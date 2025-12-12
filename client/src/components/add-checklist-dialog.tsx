import { useEffect, useState, useMemo, memo, useRef } from "react";
import { Controller, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
 
import { Car, ClipboardPlus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertChecklistSchema, type InsertChecklist, type Vehicle, type Checklist } from "@shared/schema";
import { VehicleSearchCombobox } from "@/components/vehicle-search-combobox";
import { EmployeeSearchCombobox } from "@/components/employee-search-combobox";
import { UserSearchCombobox } from "@/components/user-search-combobox";

type ItemState = "good" | "regular" | "bad";

interface AddChecklistDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingChecklist?: Checklist | null;
}

export function AddChecklistDialog({ open: controlledOpen, onOpenChange, editingChecklist }: AddChecklistDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: myVehicle } = useQuery<Vehicle | null>({
    queryKey: ["/api/users/me/assigned-vehicle"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/assigned-vehicle", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return await res.json();
    },
  });
  // El formulario debe inicializarse antes de usar watch
  // roleTemplate se resolverá después con el rol efectivo

  const form = useForm<InsertChecklist>({
    resolver: zodResolver(insertChecklistSchema),
    shouldUnregister: false,
    defaultValues: {
      vehicleId: 0,
      type: "express",
      driverName: "",
      inspectorName: user?.fullName || "",
      reason: "scheduled_task",
      results: {},
      evidenceUrl: "",
    },
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const vehicleIdWatchForTemplate = form.watch("vehicleId") as number | undefined;
  const assignedUserId = vehicles.find(v => v.id === vehicleIdWatchForTemplate)?.assignedUserId ?? undefined;
  const { data: vehicleAssignedUser } = useQuery<any>({
    queryKey: ["/api/users", String(assignedUserId || "none")],
    queryFn: async () => {
      if (!assignedUserId) return undefined;
      const res = await fetch(`/api/users/${assignedUserId}`, { credentials: "include" });
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return await res.json();
    },
    enabled: !!assignedUserId,
  });
  const effectiveRole = (vehicleAssignedUser?.role ?? user?.role) || "";
  const { data: roleTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist-templates/by-role", effectiveRole, "all"],
    queryFn: async () => {
      if (!effectiveRole) return [];
      const res = await fetch(`/api/checklist-templates/by-role/${encodeURIComponent(effectiveRole)}/all`, { credentials: "include" });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return await res.json();
    },
    enabled: !!effectiveRole,
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist-templates", { activeOnly: true, unique: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/checklist-templates?activeOnly=true&unique=true");
      return await res.json();
    },
  });

  useEffect(() => {
    if (open) {
      if (editingChecklist) {
        const ec = editingChecklist as any;
        form.reset({
          vehicleId: ec.vehicleId ?? 0,
          type: ec.type ?? "express",
          driverName: ec.driverName ?? (user?.fullName || ""),
          inspectorName: ec.inspectorName ?? (user?.fullName || ""),
          reason: ec.reason ?? "scheduled_task",
          handoverUserId: ec.handoverUserId ?? undefined,
          inspectorEmployeeId: ec.inspectorEmployeeId ?? undefined,
          plate: ec.plate ?? "",
          economicNumber: ec.economicNumber ?? "",
          brand: ec.brand ?? "",
          model: ec.model ?? "",
          year: ec.year ?? undefined,
          mileage: ec.mileage ?? undefined,
          fuelType: ec.fuelType ?? "",
          results: (ec.results ?? {}) as any,
          generalObservations: ec.generalObservations ?? "",
          recommendations: ec.recommendations ?? "",
          priority: ec.priority ?? undefined,
          evidenceUrl: ec.evidenceUrl ?? "",
          nextMaintenanceDate: ec.nextMaintenanceDate ? (new Date(ec.nextMaintenanceDate as any) as any) : undefined,
        } as any);
      } else {
        form.reset({
          vehicleId: 0,
          type: "express",
          driverName: user?.fullName || "",
          inspectorName: user?.fullName || "",
          reason: "scheduled_task",
          results: {},
          evidenceUrl: "",
        });
      }
    }
  }, [open, editingChecklist]);

  const resultsAll = useWatch({ name: "results", control: form.control }) as any;
  const allAnswered = useMemo(() => {
    let total = 0;
    let marked = 0;
    const list = Array.isArray(roleTemplates) ? roleTemplates : [];
    for (const tpl of list) {
      const secs = Array.isArray(tpl?.sections) ? tpl.sections : [];
      for (const sec of secs) {
        const title = String(sec?.title || "").trim() || "Sección";
        const items = Array.isArray(sec?.items) ? sec.items : [];
        for (const it of items) {
          total += 1;
          const state = resultsAll?.[title]?.[String(it)]?.state;
          if (state) marked += 1;
        }
      }
    }
    return total === 0 || marked === total;
  }, [roleTemplates, resultsAll]);

  

  const vehicleIdWatch = form.watch("vehicleId");
  useEffect(() => {
    const v = vehicles.find((vv) => vv.id === vehicleIdWatch);
    if (v) {
      form.setValue("plate", v.plate);
      form.setValue("economicNumber", v.economicNumber || "");
      form.setValue("brand", v.brand);
      form.setValue("model", v.model);
      form.setValue("year", v.year);
      form.setValue("mileage", v.mileage);
      form.setValue("fuelType", v.fuelType);
    }
  }, [vehicleIdWatch, vehicles]);

  useEffect(() => {
    if (myVehicle && open) {
      form.setValue("vehicleId", myVehicle.id);
      form.setValue("driverName", user?.fullName || "");
    }
  }, [myVehicle, open]);

const Section = memo(function Section({ title, items }: { title: string; items: string[] }) {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const resultsWatch = useWatch({ name: "results", control: form.control }) as any;
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{title}</h4>
      {items.map((name) => (
        <div key={name} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
          <div className="text-sm">{name}</div>
          <FormItem>
            <FormControl>
              <RadioGroup
                value={resultsWatch?.[title]?.[name]?.state ?? ""}
                onValueChange={(v) => {
                  const base = (form.getValues("results") as any) || {};
                  const sec = { ...(base[title] || {}) };
                  const itm = { ...(sec[name] || {}) };
                  itm.state = v;
                  sec[name] = itm;
                  form.setValue("results", { ...base, [title]: sec }, { shouldDirty: true, shouldValidate: false });
                }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id={`state-${slug(title)}-${slug(name)}-yes`} />
                  <Label htmlFor={`state-${slug(title)}-${slug(name)}-yes`}>Sí</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id={`state-${slug(title)}-${slug(name)}-no`} />
                  <Label htmlFor={`state-${slug(title)}-${slug(name)}-no`}>No</Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
          <FormItem>
            <FormControl>
              <Input
                value={resultsWatch?.[title]?.[name]?.obs ?? ""}
                onChange={(e) => {
                  const base = (form.getValues("results") as any) || {};
                  const sec = { ...(base[title] || {}) };
                  const itm = { ...(sec[name] || {}) };
                  itm.obs = e.target.value;
                  sec[name] = itm;
                  form.setValue("results", { ...base, [title]: sec }, { shouldDirty: true, shouldValidate: false });
                }}
                placeholder="Observaciones"
              />
            </FormControl>
          </FormItem>
        </div>
      ))}
    </div>
  );
});

  const createMutation = useMutation({
    mutationFn: async (data: InsertChecklist) => {
      const res = await apiRequest("POST", "/api/checklists", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      toast({ title: "Revisión creada", description: "Se registró la revisión del vehículo." });
      if (onOpenChange) onOpenChange(false); else setInternalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la revisión", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertChecklist) => {
      if (!editingChecklist) throw new Error("Sin revisión a editar");
      const res = await apiRequest("PUT", `/api/checklists/${editingChecklist.id}` as any, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      toast({ title: "Revisión actualizada", description: "Se guardaron los cambios." });
      if (onOpenChange) onOpenChange(false); else setInternalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la revisión", variant: "destructive" });
    },
  });

  function onSubmit(data: InsertChecklist) {
    const list = Array.isArray(roleTemplates) ? roleTemplates : [];
    let total = 0;
    let marked = 0;
    const results = form.getValues("results") as any;
    for (const tpl of list) {
      const secs = Array.isArray(tpl?.sections) ? tpl.sections : [];
      for (const sec of secs) {
        const title = String(sec?.title || "").trim() || "Sección";
        const items = Array.isArray(sec?.items) ? sec.items : [];
        for (const it of items) {
          total += 1;
          const state = results?.[title]?.[String(it)]?.state;
          if (state) marked += 1;
        }
      }
    }
    if (!editingChecklist && total > 0 && marked < total) {
      toast({ title: "Faltan respuestas", description: "Debes marcar todas las respuestas antes de guardar." });
      return;
    }
    const payload = { ...data, results } as InsertChecklist;
    if (editingChecklist) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange ? onOpenChange(o) : setInternalOpen(o))}>
      {controlledOpen === undefined && !editingChecklist && (
        <DialogTrigger asChild>
          <Button data-testid="button-add-checklist">
            <ClipboardPlus className="h-4 w-4 mr-2" />
            Nueva revisión
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingChecklist ? "Editar revisión" : "Nueva revisión"}</DialogTitle>
          <DialogDescription>{editingChecklist ? "Actualiza la revisión del vehículo." : "Completa la revisión del vehículo."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Datos Generales del Vehículo</h3>
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo</FormLabel>
                    <FormControl>
                      <VehicleSearchCombobox value={field.value} onValueChange={field.onChange} placeholder="Buscar vehículo..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {user?.role === "admin" && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de revisión</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="completo">Completo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="driverName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Conductor o responsable</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del operario" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
            </div>

            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Revisión por</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value as any}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled_task">Tarea programada</SelectItem>
                        <SelectItem value="operator_change">Cambio de operario</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {form.watch("reason") === "operator_change" && (
                <FormField control={form.control} name="handoverUserId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario que entrega la unidad</FormLabel>
                    <FormControl>
                      <UserSearchCombobox value={field.value as any} onValueChange={field.onChange as any} placeholder="Buscar usuario..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
              {form.watch("type") === "completo" && (
                <FormField control={form.control} name="inspectorEmployeeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar inspector (solo admin)</FormLabel>
                    <FormControl>
                      <EmployeeSearchCombobox value={field.value as any} onValueChange={field.onChange as any} placeholder="Seleccionar inspector..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            {Array.isArray(roleTemplates) && roleTemplates.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {roleTemplates.map((tpl: any) => (
                  <AccordionItem key={tpl.id ?? tpl.name} value={String(tpl.id ?? tpl.name)}>
                    <AccordionTrigger>
                      {(() => {
                        let total = 0;
                        let marked = 0;
                        const secs = Array.isArray(tpl?.sections) ? tpl.sections : [];
                        for (const sec of secs) {
                          const title = String(sec?.title || "").trim() || "Sección";
                          const items = Array.isArray(sec?.items) ? sec.items : [];
                          for (const it of items) {
                            total += 1;
                            const state = resultsAll?.[title]?.[String(it)]?.state;
                            if (state) marked += 1;
                          }
                        }
                        const remaining = Math.max(total - marked, 0);
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{tpl.name || "Plantilla"}</span>
                            {total > 0 && (
                              <span className="text-xs text-muted-foreground">{remaining}/{total} por marcar</span>
                            )}
                          </div>
                        );
                      })()}
                    </AccordionTrigger>
                    <AccordionContent>
                      {Array.isArray(tpl.sections) && tpl.sections.length > 0 ? (
                        <div className="space-y-6">
                          {tpl.sections.map((sec: any, idx: number) => (
                            <Section
                              key={`${tpl.id ?? tpl.name}-${idx}-${String(sec?.title || "Sección")}`}
                              title={String(sec?.title || "Sección")}
                              items={(Array.isArray(sec?.items) ? sec.items : []).map(String)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Plantilla sin secciones</div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-sm text-muted-foreground">No tienes plantillas asignadas. Contacta al administrador.</div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Observaciones Generales y Acciones Recomendadas</h3>
              <FormField control={form.control} name="generalObservations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Hallazgos importantes" />
                  </FormControl>
                </FormItem>
              )} />
              <div className="space-y-2">
                <FormField control={form.control} name="evidenceUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subir evidencia (obligatorio)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,application/pdf"
                          ref={fileInputRef as any}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const fd = new FormData();
                              fd.append("file", file);
                              const res = await fetch("/api/checklists/upload", { method: "POST", body: fd, credentials: "include" });
                              const ct = res.headers.get("content-type") || "";
                              if (!res.ok) {
                                if (ct.includes("application/json")) {
                                  const j = await res.json();
                                  throw new Error(j?.error || "Error al subir archivo");
                                }
                                const t = await res.text();
                                throw new Error(t || "Error al subir archivo");
                              }
                              const data = ct.includes("application/json") ? await res.json() : JSON.parse(await res.text());
                              const url = data?.url as string | undefined;
                              if (!url) throw new Error("Respuesta inválida");
                              field.onChange(url);
                              toast({ title: "Evidencia subida", description: "Archivo cargado correctamente" });
                            } catch (err: any) {
                              toast({ title: "Error", description: err?.message || "No se pudo subir el archivo", variant: "destructive" });
                            } finally {
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir archivo
                        </Button>
                        {field.value && (
                          <a href={field.value as any} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Ver evidencia</a>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => (onOpenChange ? onOpenChange(false) : setInternalOpen(false))}>Cancelar</Button>
              <Button
                type="submit"
                disabled={(editingChecklist ? updateMutation.isPending : createMutation.isPending) || (!allAnswered && !editingChecklist) || !form.watch("evidenceUrl")}
                data-testid={editingChecklist ? "button-submit-edit-checklist" : "button-submit-checklist"}
              >
                {editingChecklist ? (updateMutation.isPending ? "Guardando..." : "Guardar cambios") : (createMutation.isPending ? "Guardando..." : "Guardar revisión")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
