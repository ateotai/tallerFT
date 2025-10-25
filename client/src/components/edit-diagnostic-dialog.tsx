import { useEffect } from "react";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertDiagnosticSchema, type InsertDiagnostic, type Diagnostic, type Report, type Employee } from "@shared/schema";

interface EditDiagnosticDialogProps {
  diagnostic: Diagnostic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDiagnosticDialog({ diagnostic, open, onOpenChange }: EditDiagnosticDialogProps) {
  const { toast } = useToast();

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertDiagnostic>({
    resolver: zodResolver(insertDiagnosticSchema),
    defaultValues: {
      reportId: diagnostic.reportId,
      employeeId: diagnostic.employeeId,
      diagnosis: diagnostic.diagnosis,
      recommendations: diagnostic.recommendations || "",
      estimatedCost: diagnostic.estimatedCost || undefined,
    },
  });

  useEffect(() => {
    form.reset({
      reportId: diagnostic.reportId,
      employeeId: diagnostic.employeeId,
      diagnosis: diagnostic.diagnosis,
      recommendations: diagnostic.recommendations || "",
      estimatedCost: diagnostic.estimatedCost || undefined,
    });
  }, [diagnostic, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertDiagnostic) => {
      return await apiRequest("PUT", `/api/diagnostics/${diagnostic.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagnostics"] });
      toast({
        title: "Diagnóstico actualizado",
        description: "El diagnóstico ha sido actualizado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el diagnóstico",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDiagnostic) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Diagnóstico</DialogTitle>
          <DialogDescription>
            Modifica la información del diagnóstico técnico
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
                        {reports.map((report) => (
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
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
