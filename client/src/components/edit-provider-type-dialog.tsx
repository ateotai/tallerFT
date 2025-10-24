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
import { insertProviderTypeSchema, type InsertProviderType, type ProviderType } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditProviderTypeDialogProps {
  providerType: ProviderType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProviderTypeDialog({ providerType, open, onOpenChange }: EditProviderTypeDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertProviderType>({
    resolver: zodResolver(insertProviderTypeSchema),
    defaultValues: {
      name: providerType.name,
      description: providerType.description,
    },
  });

  useEffect(() => {
    form.reset({
      name: providerType.name,
      description: providerType.description,
    });
  }, [providerType, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProviderType) => {
      return await apiRequest("PUT", `/api/provider-types/${providerType.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider-types"] });
      toast({
        title: "Tipo actualizado",
        description: "El tipo de proveedor ha sido actualizado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el tipo de proveedor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProviderType) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Proveedor</DialogTitle>
          <DialogDescription>
            Modifica la información del tipo de proveedor.
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
                      placeholder="ej. Taller Mecánico"
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
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe los servicios que ofrece este tipo de proveedor"
                      {...field}
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
