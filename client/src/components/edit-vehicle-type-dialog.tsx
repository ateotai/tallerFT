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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleTypeSchema, type InsertVehicleType, type VehicleType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EditVehicleTypeDialogProps {
  vehicleType: VehicleType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVehicleTypeDialog({ vehicleType, open, onOpenChange }: EditVehicleTypeDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertVehicleType>({
    resolver: zodResolver(insertVehicleTypeSchema),
    defaultValues: {
      name: vehicleType.name,
      description: vehicleType.description,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: vehicleType.name,
        description: vehicleType.description,
      });
    }
  }, [vehicleType, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertVehicleType>) => {
      const res = await apiRequest("PUT", `/api/vehicle-types/${vehicleType.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Tipo actualizado",
        description: "Los cambios se guardaron exitosamente.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el tipo de vehículo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicleType) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Vehículo</DialogTitle>
          <DialogDescription>
            Modifica los datos del tipo de vehículo.
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
                    <Input {...field} placeholder="Sedán" data-testid="input-edit-type-name" />
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
                      placeholder="Vehículo de cuatro puertas con techo fijo..."
                      data-testid="input-edit-type-description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-type">
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
