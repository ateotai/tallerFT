import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

export function AddChecklistDialog({ open: controlledOpen, onOpenChange }: AddChecklistDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: myVehicle } = useQuery<Vehicle | undefined>({
    queryKey: ["/api/users/me/assigned-vehicle"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/assigned-vehicle", { credentials: "include" });
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return await res.json();
    },
  });
  // El formulario debe inicializarse antes de usar watch
  // roleTemplate se resolverá después con el rol efectivo

  const form = useForm<InsertChecklist>({
    resolver: zodResolver(insertChecklistSchema),
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
  const { data: roleTemplate } = useQuery<any>({
    queryKey: ["/api/checklist-templates/by-role", effectiveRole],
    queryFn: async () => {
      if (!effectiveRole) return undefined;
      const res = await fetch(`/api/checklist-templates/by-role/${encodeURIComponent(effectiveRole)}`, { credentials: "include" });
      if (res.status === 404) return undefined;
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
    enabled: (user?.role === "admin"),
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const activeTemplate = selectedTemplateId ? templates.find((t: any) => t.id === selectedTemplateId) : roleTemplate;

  useEffect(() => {
    if (open) {
      form.reset({
        vehicleId: 0,
        type: (user?.role === "admin"
          ? (activeTemplate?.type ?? "completo")
          : (activeTemplate?.type ?? "express")),
        driverName: user?.fullName || "",
        inspectorName: user?.fullName || "",
        reason: "scheduled_task",
        results: {},
      });
    }
  }, [open, activeTemplate]);

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

  function Section({ title, items }: { title: string; items: string[] }) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold">{title}</h4>
        {items.map((name) => (
          <div key={name} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm">{name}</div>
            <FormField
              control={form.control}
              name={`results.${title}.${name}.state` as any}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value as any}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Bueno</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="bad">Malo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`results.${title}.${name}.obs` as any}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Observaciones" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    );
  }

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
              <FormField control={form.control} name="inspectorName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector o técnico</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del inspector" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {user?.role === "admin" && templates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Plantilla (admin)</FormLabel>
                  <FormControl>
                    <Select value={selectedTemplateId ? String(selectedTemplateId) : undefined} onValueChange={(val) => setSelectedTemplateId(Number(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name} · {t.type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              </div>
            )}

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

            {(activeTemplate?.sections && activeTemplate.sections.length > 0 ? activeTemplate.sections : [
              { title: "Estado General Exterior", items: [
                "Carrocería / pintura",
                "Parabrisas / cristales",
                "Espejos retrovisores",
                "Luces delanteras / traseras / direccionales",
                "Placas visibles",
                "Limpiaparabrisas / líquido limpiador",
                "Llantas (presión, desgaste, repuesto)",
              ] },
              { title: "Sistema de Motor", items: [
                "Nivel de aceite de motor",
                "Nivel de anticongelante / refrigerante",
                "Fugas visibles de aceite o líquido",
                "Correas / bandas",
                "Batería (terminales, carga)",
                "Filtro de aire",
                "Ruidos o vibraciones anormales",
              ] },
              { title: "Sistema Eléctrico", items: [
                "Luces altas / bajas",
                "Luces de freno / reversa",
                "Claxon",
                "Tablero de instrumentos / testigos",
                "Sistema de carga (alternador)",
              ] },
              { title: "Sistema de Frenos y Suspensión", items: [
                "Nivel de líquido de frenos",
                "Funcionamiento del pedal",
                "Pastillas / zapatas",
                "Discos / tambores",
                "Suspensión delantera / trasera",
                "Dirección / alineación",
              ] },
              { title: "Fluidos y Niveles", items: [
                "Aceite de motor",
                "Líquido de frenos",
                "Anticongelante / refrigerante",
                "Líquido de dirección hidráulica",
                "Aceite de transmisión",
                "Líquido limpiaparabrisas",
              ] },
              { title: "Interior y Seguridad", items: [
                "Cinturones de seguridad",
                "Bocina / claxon",
                "Extintor (vigencia, presión)",
                "Triángulos reflejantes / kit de emergencia",
                "Botiquín de primeros auxilios",
                "Asientos / tapicería",
                "Aire acondicionado / calefacción",
              ] },
            ]).map((sec: any) => (
              <Section key={sec.title} title={sec.title} items={sec.items} />
            ))}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Observaciones Generales y Acciones Recomendadas</h3>
              <FormField control={form.control} name="generalObservations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Hallazgos importantes" />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="recommendations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recomendaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Reparaciones o mantenimientos sugeridos" />
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
                <FormField control={form.control} name="nextMaintenanceDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha sugerida próximo mantenimiento</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ? new Date(field.value as any).toISOString().slice(0,10) : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
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
