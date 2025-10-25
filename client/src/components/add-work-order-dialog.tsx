import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertWorkOrderSchema, type InsertWorkOrder, type Vehicle, type Employee, type Diagnostic } from "@shared/schema";

export function AddWorkOrderDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: diagnostics = [] } = useQuery<Diagnostic[]>({
    queryKey: ["/api/diagnostics"],
  });

  const form = useForm<InsertWorkOrder>({
    resolver: zodResolver(insertWorkOrderSchema),
    defaultValues: {
      diagnosticId: undefined,
      vehicleId: undefined,
      assignedToEmployeeId: undefined,
      status: "pending",
      priority: "normal",
      description: "",
      estimatedCost: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertWorkOrder) => {
      return await apiRequest("POST", "/api/work-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Orden de trabajo creada",
        description: "La orden de trabajo ha sido agregada exitosamente",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden de trabajo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWorkOrder) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-work-order">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Orden de Trabajo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Orden de Trabajo</DialogTitle>
          <DialogDescription>
            Crea una nueva orden de trabajo para gestionar reparaciones y mantenimiento
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-vehicle">
                          <SelectValue placeholder="Selecciona vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.economicNumber} - {vehicle.model}
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
                name="assignedToEmployeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mecánico Asignado</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-employee">
                          <SelectValue placeholder="Selecciona mecánico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstName} {employee.lastName}
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
                name="diagnosticId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico Asociado</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-diagnostic">
                          <SelectValue placeholder="Selecciona diagnóstico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin diagnóstico</SelectItem>
                        {diagnostics.map((diagnostic) => (
                          <SelectItem key={diagnostic.id} value={diagnostic.id.toString()}>
                            Diagnóstico #{diagnostic.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Opcional: vincula esta OT con un diagnóstico previo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Selecciona prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo Estimado</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        data-testid="input-estimated-cost"
                      />
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
                    <Textarea 
                      placeholder="Describe el trabajo a realizar"
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? "Creando..." : "Crear Orden de Trabajo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
