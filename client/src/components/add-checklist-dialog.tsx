import { useEffect, useState, memo } from "react";
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
 
import { Car, ClipboardPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertChecklistSchema, type InsertChecklist, type Vehicle } from "@shared/schema";
import { VehicleSearchCombobox } from "@/components/vehicle-search-combobox";
import { EmployeeSearchCombobox } from "@/components/employee-search-combobox";
import { UserSearchCombobox } from "@/components/user-search-combobox";

type ItemState = "good" | "regular" | "bad";

interface AddChecklistDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedTemplateId?: number | null;
}

export function AddChecklistDialog({ open: controlledOpen, onOpenChange, selectedTemplateId }: AddChecklistDialogProps) {
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
    },
  });

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
  const { data: activeTemplate } = useQuery<any | null>({
    queryKey: ["/api/checklist-templates", selectedTemplateId || "none"],
    queryFn: async () => {
      if (!selectedTemplateId) return null;
      const res = await apiRequest("GET", `/api/checklist-templates/${selectedTemplateId}`);
      return await res.json();
    },
    enabled: !!selectedTemplateId,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        vehicleId: 0,
        type: "express",
        driverName: user?.fullName || "",
        inspectorName: user?.fullName || "",
        reason: "scheduled_task",
        results: {},
      });
    }
  }, [open]);

  useEffect(() => {
    if (activeTemplate?.type) {
      form.setValue("type", activeTemplate.type);
    }
  }, [activeTemplate]);

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
      toast({ title: "Checklist creado", description: "Se registró la revisión del vehículo." });
      if (onOpenChange) onOpenChange(false); else setInternalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo crear el checklist", variant: "destructive" });
    },
  });

  function onSubmit(data: InsertChecklist) {
    createMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange ? onOpenChange(o) : setInternalOpen(o))}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button data-testid="button-add-checklist">
            <ClipboardPlus className="h-4 w-4 mr-2" />
            Nuevo Checklist
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro de Checklist</DialogTitle>
          <DialogDescription>Completa la revisión del vehículo.</DialogDescription>
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
                      <FormLabel>Tipo de checklist</FormLabel>
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
                  <FormLabel>Checklist por</FormLabel>
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

            {activeTemplate?.sections && activeTemplate.sections.length > 0 ? (
              activeTemplate.sections.map((sec: any) => (
                <Section key={sec.title} title={sec.title} items={sec.items} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Selecciona una plantilla para cargar las secciones del checklist.</div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value as any}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )} />
                
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => (onOpenChange ? onOpenChange(false) : setInternalOpen(false))}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-checklist">
                {createMutation.isPending ? "Guardando..." : "Guardar Checklist"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
