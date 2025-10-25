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
import { insertDiagnosticSchema, type InsertDiagnostic, type Report, type Employee } from "@shared/schema";

export function AddDiagnosticDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const assignedReports = reports.filter(r => r.status === "diagnostico");

  const form = useForm<InsertDiagnostic>({
    resolver: zodResolver(insertDiagnosticSchema),
    defaultValues: {
      reportId: undefined,
      employeeId: undefined,
      diagnosis: "",
      recommendations: "",
      estimatedCost: undefined,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Diagnóstico</DialogTitle>
          <DialogDescription>
            Registra un nuevo diagnóstico técnico para un reporte asignado
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Mecánico *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-employee">
                          <SelectValue placeholder="Selecciona mecánico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
            </div>

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción detallada del diagnóstico técnico"
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-diagnosis"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recomendaciones</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Recomendaciones para la reparación"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-recommendations"
                    />
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
                  <FormLabel>Costo Estimado</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      data-testid="input-estimated-cost"
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
                {mutation.isPending ? "Creando..." : "Crear Diagnóstico"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
