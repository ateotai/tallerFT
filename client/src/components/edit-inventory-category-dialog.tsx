import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { insertInventoryCategorySchema } from "@shared/schema";
import type { InsertInventoryCategory, InventoryCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditInventoryCategoryDialogProps {
  category: InventoryCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInventoryCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditInventoryCategoryDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertInventoryCategory>({
    resolver: zodResolver(insertInventoryCategorySchema),
    defaultValues: {
      name: category.name,
      description: category.description,
    },
  });

  useEffect(() => {
    form.reset({
      name: category.name,
      description: category.description,
    });
  }, [category, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertInventoryCategory) => {
      return await apiRequest("PUT", `/api/inventory-categories/${category.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-categories"] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría se actualizó exitosamente",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInventoryCategory) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-edit-category">
        <DialogHeader>
          <DialogTitle>Editar Categoría de Inventario</DialogTitle>
          <DialogDescription>
            Modifica los datos de la categoría de inventario
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
                    <Input
                      placeholder="Filtros"
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
                      placeholder="Descripción de la categoría"
                      {...field}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
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
                {mutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
