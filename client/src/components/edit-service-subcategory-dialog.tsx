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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { insertServiceSubcategorySchema, type InsertServiceSubcategory, type ServiceSubcategory, type ServiceCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EditServiceSubcategoryDialogProps {
  subcategory: ServiceSubcategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceSubcategoryDialog({ subcategory, open, onOpenChange }: EditServiceSubcategoryDialogProps) {
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const form = useForm<InsertServiceSubcategory>({
    resolver: zodResolver(insertServiceSubcategorySchema),
    defaultValues: {
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      description: subcategory.description || "",
      active: subcategory.active,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        description: subcategory.description || "",
        active: subcategory.active,
      });
    }
  }, [subcategory, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertServiceSubcategory>) => {
      const res = await apiRequest("PUT", `/api/service-subcategories/${subcategory.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-subcategories"] });
      toast({
        title: "Subcategoría actualizada",
        description: "Los cambios se guardaron exitosamente.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la subcategoría",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertServiceSubcategory) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Subcategoría de Servicio</DialogTitle>
          <DialogDescription>
            Modifica los datos de la subcategoría de servicio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-subcategory-category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.filter(c => c.active).map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                          data-testid={`select-option-edit-category-${category.id}`}
                        >
                          {category.name}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Cambio de aceite y filtro" data-testid="input-edit-subcategory-name" />
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
                      placeholder="Servicio de cambio de aceite y filtro..."
                      data-testid="input-edit-subcategory-description"
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
                      La subcategoría estará disponible para ser asignada a servicios
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-edit-subcategory-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-subcategory">
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-subcategory">
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
