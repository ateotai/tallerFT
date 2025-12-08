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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Report, Employee, User } from "@shared/schema";

const assignSchema = z.object({
  userId: z.number(),
});

type AssignForm = z.infer<typeof assignSchema>;

interface AssignReportDialogProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignReportDialog({ report, open, onOpenChange }: AssignReportDialogProps) {
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      userId: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AssignForm) => {
      const employee = employees.find(e => e.userId === data.userId);
      if (!employee) {
        throw new Error("El usuario seleccionado no tiene un empleado vinculado");
      }
      return await apiRequest("POST", `/api/reports/${report.id}/assign`, { employeeId: employee.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diagnostics"] });
      toast({
        title: "Reporte asignado",
        description: "El reporte ha sido asignado exitosamente al usuario",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el reporte",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Reporte a Empleado</DialogTitle>
          <DialogDescription>
            Selecciona el empleado que se encargará de diagnosticar este reporte
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value !== undefined ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Selecciona usuario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                data-testid="button-submit-assign"
              >
                {mutation.isPending ? "Asignando..." : "Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
