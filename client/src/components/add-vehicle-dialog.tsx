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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleSchema, type InsertVehicle, type VehicleType } from "@shared/schema";
import { UserSearchCombobox } from "@/components/user-search-combobox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClientSearchCombobox } from "@/components/client-search-combobox";
import type { ClientBranch } from "@shared/schema";

export function AddVehicleDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
        defaultValues: {
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          plate: "",
          vin: "",
          serie: "",
          engineNumber: "",
          color: "",
          mileage: 0,
          fuelType: "gasoline",
          status: "active",
          assignedArea: "",
          economicNumber: "",
          vehicleValue: undefined,
          policyNumber: "",
          insurer: "",
          policyStart: undefined,
          policyEnd: undefined,
          clientId: null,
          vehicleTypeId: null,
          assignedUserId: null,
          imageUrl: null,
        },
  });

  const { data: vehicleTypes = [] } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  const clientId = (form.watch("clientId") ?? null) as number | null;
  const { data: branches = [] } = useQuery<ClientBranch[]>({
    queryKey: ["/api/client-branches", clientId ?? ""],
    enabled: !!clientId,
    queryFn: async () => {
      const res = await fetch(`/api/client-branches?clientId=${clientId}`);
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const res = await apiRequest("POST", "/api/vehicles", data);
      const created = await res.json();
      if (selectedFile && created?.id) {
        const fd = new FormData();
        fd.append("image", selectedFile);
        const up = await fetch(`/api/vehicles/${created.id}/image`, { method: "POST", body: fd });
        if (up.ok) {
          const payload = await up.json();
          created.imageUrl = payload.url;
        }
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehículo agregado", description: "El vehículo ha sido agregado exitosamente." });
      setOpen(false);
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo agregar el vehículo", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    createMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-vehicle">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Vehículo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
          <DialogDescription>
            Ingresa los datos del vehículo para agregarlo a la flotilla.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <ClientSearchCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Buscar cliente..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        <FormField
          control={form.control}
          name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString() || ""}
                    disabled={!clientId || branches.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-branch">
                        <SelectValue placeholder={clientId ? (branches.length ? "Seleccionar sucursal" : "Sin sucursales") : "Selecciona cliente primero"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Toyota" data-testid="input-make" />
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
                      <Input {...field} placeholder="Hilux" data-testid="input-model" />
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
                        data-testid="input-year"
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
                      <Input {...field} placeholder="ABC-1234" data-testid="input-plate" />
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
                      <Input {...field} value={field.value || ""} placeholder="ECO-001" data-testid="input-economic-number" />
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
                      <Input {...field} value={field.value || ""} placeholder="1HGBH41JXMN109186" data-testid="input-vin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serie</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Serie del vehículo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="engineNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Motor</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Número de motor" />
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
                      <Input {...field} value={field.value || ""} placeholder="Blanco" data-testid="input-color" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Vehicular</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value === undefined || field.value === null ? "" : String(field.value)}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? undefined : parseFloat(v));
                        }}
                        placeholder="Ej: 250000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Póliza</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Número de póliza" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aseguradora</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Nombre de aseguradora" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio Póliza</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value as any).toISOString().slice(0, 10) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Vencimiento Póliza</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value as any).toISOString().slice(0, 10) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
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
                        data-testid="input-mileage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Carrocería</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-vehicle-type">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
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
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustible</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-fuel">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
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
                name="assignedArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Asignada</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ej: Operaciones, Ventas" data-testid="input-assigned-area" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 space-y-2">
                <FormLabel>Imagen del vehículo (opcional)</FormLabel>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-md text-sm">
                    <ImagePlus className="h-4 w-4" />
                    <span>{createMutation.isPending ? "Guardando..." : "Seleccionar imagen"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  {previewUrl && (
                    <img src={previewUrl} alt="Vehicle" className="h-12 w-20 object-cover rounded-md border" />
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-vehicle">
                {createMutation.isPending ? "Guardando..." : "Guardar Vehículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
