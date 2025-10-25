import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeTypeSchema, type InsertEmployeeType, type EmployeeType } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditEmployeeTypeDialogProps {
  employeeType: EmployeeType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEmployeeTypeDialog({ employeeType, open, onOpenChange }: EditEmployeeTypeDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertEmployeeType>({
    resolver: zodResolver(insertEmployeeTypeSchema),
    defaultValues: {
      name: employeeType.name,
      description: employeeType.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: employeeType.name,
      description: employeeType.description || "",
    });
  }, [employeeType, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertEmployeeType) => {
      return await apiRequest("PUT", `/api/employee-types/${employeeType.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-types"] });
      toast({
        title: "Tipo actualizado",
        description: "El tipo de empleado ha sido actualizado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el tipo de empleado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployeeType) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Empleado</DialogTitle>
          <DialogDescription>
            Modifica la información del tipo de empleado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej. Mecánico"
                      {...field}
                      data-testid="input-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las responsabilidades de este tipo de empleado"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-description"
                      rows={3}
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
                disabled={updateMutation.isPending}
                data-testid="button-submit"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
