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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertInventorySchema, type InsertInventory, type Inventory, type Provider, type InventoryCategory, type Workshop } from "@shared/schema";

interface EditInventoryDialogProps {
  item: Inventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInventoryDialog({ item, open, onOpenChange }: EditInventoryDialogProps) {
  const { toast } = useToast();

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
  });

  const { data: categories = [] } = useQuery<InventoryCategory[]>({
    queryKey: ["/api/inventory-categories"],
  });

  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  const form = useForm<InsertInventory>({
    resolver: zodResolver(insertInventorySchema),
    defaultValues: {
      name: item.name,
      categoryId: item.categoryId,
      partNumber: item.partNumber || "",
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      unitPrice: item.unitPrice,
      location: item.location || "",
      providerId: item.providerId,
      workshopId: item.workshopId,
    },
  });

  useEffect(() => {
    form.reset({
      name: item.name,
      categoryId: item.categoryId,
      partNumber: item.partNumber || "",
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      unitPrice: item.unitPrice,
      location: item.location || "",
      providerId: item.providerId,
      workshopId: item.workshopId,
    });
  }, [item, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertInventory) => {
      return await apiRequest("PUT", `/api/inventory/${item.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Artículo actualizado",
        description: "Los cambios han sido guardados exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el artículo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInventory) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Refacción</DialogTitle>
          <DialogDescription>
            Actualiza la información del artículo
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parte</FormLabel>
                    <FormControl>
                      <Input placeholder="FLT-001" {...field} value={field.value || ""} data-testid="input-part-number" />
                    </FormControl>
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
                      <Input placeholder="Filtro de Aceite" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría (Opcional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Almacén A-12" {...field} value={field.value || ""} data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Mínima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-min-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Máxima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-max-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-unit-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor (Opcional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder="Selecciona proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            {provider.name}
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
                name="workshopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taller</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-workshop">
                          <SelectValue placeholder="Seleccionar taller" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {workshops.map((workshop) => (
                          <SelectItem key={workshop.id} value={workshop.id.toString()}>
                            {workshop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
