import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertServiceCategorySchema, type InsertServiceCategory, type ServiceCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EditServiceCategoryDialogProps {
  category: ServiceCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceCategoryDialog({ category, open, onOpenChange }: EditServiceCategoryDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertServiceCategory>({
    resolver: zodResolver(insertServiceCategorySchema),
    defaultValues: {
      name: category.name,
      description: category.description || "",
      active: category.active,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category.name,
        description: category.description || "",
        active: category.active,
      });
    }
  }, [category, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertServiceCategory>) => {
      const res = await apiRequest("PUT", `/api/service-categories/${category.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      toast({
        title: "Categoría actualizada",
        description: "Los cambios se guardaron exitosamente.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertServiceCategory) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Categoría de Servicio</DialogTitle>
          <DialogDescription>
            Modifica los datos de la categoría de servicio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Mantenimiento Preventivo" data-testid="input-edit-category-name" />
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
                      {...field}
                      value={field.value || ""}
                      placeholder="Servicios de revisión y prevención de fallas..."
                      data-testid="input-edit-category-description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Estado Activo</FormLabel>
                    <FormDescription>
                      La categoría estará disponible para ser asignada a servicios
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-edit-category-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-category">
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-category">
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
