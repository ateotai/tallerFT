import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertScheduledMaintenanceSchema, type InsertScheduledMaintenance, type Vehicle, type ServiceCategory, type User, type ScheduledMaintenance } from "@shared/schema";

interface AddScheduledMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  editItem?: ScheduledMaintenance | null;
}

type FormValues = {
  vehicleId?: number;
  categoryId?: number;
  assignedUserId?: number;
  title: string;
  description: string;
  frequency: string;
  nextDueDate: string;
  nextDueMileage?: number;
  estimatedCost?: number;
  status?: string;
};

export function AddScheduledMaintenanceDialog({ open, onOpenChange, onCreated, editItem }: AddScheduledMaintenanceDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vehicles");
      return await res.json();
    },
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/service-categories");
      return await res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  const toInputDate = (d?: Date | string | null) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d as unknown as string) : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(
      insertScheduledMaintenanceSchema.extend({
        nextDueDate: z.string().min(1, { message: "La fecha es requerida" }),
      })
    ),
    defaultValues: {
      vehicleId: editItem?.vehicleId ?? undefined,
      categoryId: editItem?.categoryId ?? undefined,
      assignedUserId: editItem?.assignedUserId ?? undefined,
      title: editItem?.title ?? "",
      description: editItem?.description ?? "",
      frequency: editItem?.frequency ?? "mensual",
      nextDueDate: toInputDate(editItem?.nextDueDate ?? null),
      nextDueMileage: editItem?.nextDueMileage ?? undefined,
      estimatedCost: editItem?.estimatedCost ?? undefined,
      status: (editItem?.status as any) ?? "pending",
    },
  });

  useEffect(() => {
    if (!open) return;
    const base: FormValues = {
      vehicleId: editItem?.vehicleId ?? undefined,
      categoryId: editItem?.categoryId ?? undefined,
      assignedUserId: editItem?.assignedUserId ?? undefined,
      title: editItem?.title ?? "",
      description: editItem?.description ?? "",
      frequency: editItem?.frequency ?? "mensual",
      nextDueDate: toInputDate(editItem?.nextDueDate ?? null),
      nextDueMileage: editItem?.nextDueMileage ?? undefined,
      estimatedCost: editItem?.estimatedCost ?? undefined,
      status: (editItem?.status as any) ?? "pending",
    };
    form.reset(base);
  }, [editItem, open]);

  useEffect(() => {
    if (!open) return;
    if (editItem?.assignedUserId) {
      form.setValue("assignedUserId", Number(editItem.assignedUserId));
    }
  }, [open, editItem, users]);

  useEffect(() => {
    if (!open) return;
    if (editItem?.vehicleId) {
      form.setValue("vehicleId", Number(editItem.vehicleId));
    }
  }, [open, editItem, vehicles]);

  

  const createOrUpdateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: Partial<InsertScheduledMaintenance> = {
        vehicleId: values.vehicleId,
        categoryId: values.categoryId,
        assignedUserId: values.assignedUserId!,
        title: values.title,
        description: values.description,
        frequency: values.frequency,
        nextDueDate: new Date(values.nextDueDate),
        nextDueMileage: values.nextDueMileage,
        estimatedCost: values.estimatedCost,
        status: values.status,
      };
      if (editItem) {
        const res = await apiRequest("PUT", `/api/scheduled-maintenance/${editItem.id}`, payload);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/scheduled-maintenance", payload as InsertScheduledMaintenance);
        return await res.json();
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-maintenance"] });
      const num = data?.id ? ` · Nº ${data.id}` : "";
      toast({ title: editItem ? "Cambios guardados" : "Servicio programado", description: (editItem ? "La tarea fue actualizada exitosamente." : "El mantenimiento fue programado exitosamente.") + num });
      onOpenChange(false);
      onCreated?.();
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || (editItem ? "No se pudo actualizar la tarea" : "No se pudo programar el servicio"), variant: "destructive" });
    },
    onSettled: () => setSubmitting(false),
  });

  const onSubmit = (values: FormValues) => {
    setSubmitting(true);
    createOrUpdateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Editar Servicio Programado" : "Programar Servicio"}
            {editItem ? ` · Nº ${editItem.id}` : ""}
          </DialogTitle>
          <DialogDescription>{editItem ? "Actualiza los detalles del mantenimiento programado" : "Define el mantenimiento programado para un vehículo."}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={form.watch("vehicleId") !== undefined ? String(form.watch("vehicleId")!) : undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-vehicle">
                          <SelectValue placeholder="Selecciona vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(() => {
                          const vid = form.watch("vehicleId");
                          const present = vehicles.some((v) => v.id === vid);
                          return !present && vid !== undefined ? (
                            <SelectItem value={String(vid)}>Vehículo #{vid}</SelectItem>
                          ) : null;
                        })()}
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.brand} {v.model} · {v.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value !== undefined ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.filter((c) => c.active).map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar usuario *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value !== undefined ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assigned-user">
                          <SelectValue placeholder="Selecciona usuario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(() => {
                          const uid = form.watch("assignedUserId");
                          const present = users.some((u) => u.id === uid);
                          return !present && uid !== undefined ? (
                            <SelectItem value={String(uid)}>Usuario #{uid}</SelectItem>
                          ) : null;
                        })()}
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.fullName || u.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Cambio de aceite" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia *</FormLabel>
                    <FormControl>
                      <Input placeholder="mensual, trimestral, por kilometraje..." {...field} data-testid="input-frequency" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha y hora *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} data-testid="input-next-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextDueMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometraje próximo</FormLabel>
                    <FormControl>
                      <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-next-due-mileage" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo estimado</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} data-testid="input-estimated-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Detalles del servicio programado" {...field} data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-submit-scheduled">
                {submitting ? "Guardando..." : (editItem ? "Guardar Cambios" : "Programar")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
