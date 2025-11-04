import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { insertDiagnosticSchema, type InsertDiagnostic, type Report, type Employee } from "@shared/schema";

export function AddDiagnosticDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const roleText = (user?.role || "").toLowerCase();
  const isPrivileged = roleText === "admin" || roleText === "administrador" || roleText === "supervisor";
  // Identificar empleado actual con fallback por nombre completo y correo
  const currentEmployee = (() => {
    if (!user) return undefined;
    const byUserId = employees.find(e => e.userId === user.id);
    if (byUserId) return byUserId;
    const full = (user.fullName || "").trim().toLowerCase();
    const [firstCandidate, ...rest] = full.split(" ");
    const lastCandidate = rest.join(" ");
    const byName = employees.find(e => (
      (e.firstName || "").trim().toLowerCase() === firstCandidate &&
      (e.lastName || "").trim().toLowerCase() === lastCandidate
    ));
    if (byName) return byName;
    const byEmail = employees.find(e => (e.email || "").trim().toLowerCase() === (user.email || "").trim().toLowerCase());
    return byEmail;
  })();

  const assignedReports = reports.filter(r =>
    r.status === "diagnostico" && (isPrivileged || (currentEmployee && r.assignedToEmployeeId === currentEmployee.id))
  );

  const form = useForm<InsertDiagnostic>({
    resolver: zodResolver(insertDiagnosticSchema),
    defaultValues: {
      reportId: undefined,
      employeeId: undefined,
      odometer: 0,
      vehicleCondition: "",
      fuelLevel: "",
      possibleCause: "",
      severity: "pendiente",
      technicalRecommendation: "",
      estimatedRepairTime: "",
      requiredMaterials: "",
      requiresAdditionalTests: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertDiagnostic) => {
      return await apiRequest("POST", "/api/diagnostics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagnostics"] });
      toast({
        title: "Diagnóstico creado",
        description: "El diagnóstico ha sido agregado exitosamente",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el diagnóstico",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isPrivileged && currentEmployee && !form.getValues("employeeId")) {
      form.setValue("employeeId", currentEmployee.id);
    }
  }, [isPrivileged, currentEmployee, form]);

  const onSubmit = (data: InsertDiagnostic) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-diagnostic">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Diagnóstico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Diagnóstico</DialogTitle>
          <DialogDescription>
            Registra un nuevo diagnóstico técnico profesional para un reporte asignado
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reportId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporte *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-report">
                          <SelectValue placeholder="Selecciona reporte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignedReports.map((report) => (
                          <SelectItem key={report.id} value={report.id.toString()}>
                            Reporte #{report.id}
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
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mecánico Asignado *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-employee" disabled={!isPrivileged}>
                          <SelectValue placeholder="Selecciona mecánico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(isPrivileged ? employees : employees.filter(e => e.id === currentEmployee?.id)).map((employee) => (
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
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odómetro (km) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        data-testid="input-odometer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severidad *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-severity">
                          <SelectValue placeholder="Selecciona severidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="crítico">Crítico</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición del Vehículo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Bueno, Regular, Malo"
                        {...field}
                        data-testid="input-vehicle-condition"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Combustible *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Lleno, 3/4, 1/2, 1/4, Vacío"
                        {...field}
                        data-testid="input-fuel-level"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedRepairTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo Estimado de Reparación *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: 2 horas, 1 día, 3 días"
                        {...field}
                        data-testid="input-estimated-repair-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="possibleCause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Causa Posible *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción detallada de la posible causa del problema"
                      className="min-h-[80px]"
                      {...field}
                      data-testid="textarea-possible-cause"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technicalRecommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recomendación Técnica *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Recomendaciones técnicas para la reparación"
                      className="min-h-[80px]"
                      {...field}
                      data-testid="textarea-technical-recommendation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiredMaterials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materiales Requeridos *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Lista de materiales y repuestos necesarios para la reparación"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-required-materials"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresAdditionalTests"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-requires-additional-tests"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Requiere Pruebas Adicionales
                    </FormLabel>
                    <FormDescription>
                      Marca esta casilla si se necesitan pruebas o diagnósticos adicionales
                    </FormDescription>
                  </div>
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
                {mutation.isPending ? "Creando..." : "Crear Diagnóstico"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
