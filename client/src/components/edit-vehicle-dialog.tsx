import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleSchema, type InsertVehicle, type Vehicle } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImagePlus } from "lucide-react";
import { UserSearchCombobox } from "@/components/user-search-combobox";

interface EditVehicleDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVehicleDialog({ vehicle, open, onOpenChange }: EditVehicleDialogProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(vehicle.imageUrl || null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      vin: vehicle.vin || "",
      color: vehicle.color || "",
      mileage: vehicle.mileage,
      fuelType: vehicle.fuelType,
      status: vehicle.status,
      assignedArea: vehicle.assignedArea || "",
      economicNumber: vehicle.economicNumber || "",
      clientId: vehicle.clientId,
      vehicleTypeId: vehicle.vehicleTypeId,
      imageUrl: vehicle.imageUrl,
      assignedUserId: vehicle.assignedUserId ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        plate: vehicle.plate,
        vin: vehicle.vin || "",
        color: vehicle.color || "",
        mileage: vehicle.mileage,
        fuelType: vehicle.fuelType,
        status: vehicle.status,
        assignedArea: vehicle.assignedArea || "",
        economicNumber: vehicle.economicNumber || "",
        clientId: vehicle.clientId,
        vehicleTypeId: vehicle.vehicleTypeId,
        imageUrl: vehicle.imageUrl,
        assignedUserId: vehicle.assignedUserId ?? null,
      });
      setPreviewUrl(vehicle.imageUrl || null);
    }
  }, [vehicle, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertVehicle>) => {
      const res = await apiRequest("PUT", `/api/vehicles/${vehicle.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Vehículo actualizado",
        description: "Los cambios se guardaron exitosamente.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el vehículo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    updateMutation.mutate(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`/api/vehicles/${vehicle.id}/image`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("No se pudo subir la imagen");
      const payload = await res.json();
      form.setValue("imageUrl", payload.url);
      setPreviewUrl(payload.url);
      toast({ title: "Imagen subida", description: "La foto del vehículo se actualizó." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Falló la subida de imagen", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Vehículo</DialogTitle>
          <DialogDescription>
            Modifica los datos del vehículo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Toyota" data-testid="input-edit-brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Hilux" data-testid="input-edit-model" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="2024"
                        data-testid="input-edit-year"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABC-1234" data-testid="input-edit-plate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="economicNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Económico</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="ECO-001" data-testid="input-edit-economic-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="1HGBH41JXMN109186" data-testid="input-edit-vin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Blanco" data-testid="input-edit-color" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometraje</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="50000"
                        data-testid="input-edit-mileage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustible</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-fuel">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Eléctrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="in-service">En Servicio</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar usuario</FormLabel>
                    <FormControl>
                      <UserSearchCombobox
                        value={field.value ?? null}
                        onValueChange={(userId) => field.onChange(userId)}
                        placeholder="Buscar usuario..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Asignada</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ej: Operaciones, Ventas" data-testid="input-edit-assigned-area" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 space-y-2">
                <FormLabel>Imagen del vehículo</FormLabel>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-md text-sm">
                    <ImagePlus className="h-4 w-4" />
                    <span>{uploading ? "Subiendo..." : "Seleccionar imagen"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  {previewUrl && (
                    <img src={previewUrl} alt="Vehicle" className="h-12 w-20 object-cover rounded-md border" />
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-vehicle">
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
