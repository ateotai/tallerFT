import { useState } from "react";
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AddVehicleDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //todo: remove mock functionality
    console.log("Add vehicle triggered");
    toast({
      title: "Vehículo agregado",
      description: "El vehículo ha sido agregado exitosamente.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-vehicle">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Vehículo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
          <DialogDescription>
            Ingresa los datos del vehículo para agregarlo a la flotilla.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="make">Marca</Label>
              <Input id="make" placeholder="Toyota" data-testid="input-make" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" placeholder="Hilux" data-testid="input-model" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input id="year" type="number" placeholder="2024" data-testid="input-year" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Placa</Label>
              <Input id="plate" placeholder="ABC-1234" data-testid="input-plate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" placeholder="1HGBH41JXMN109186" data-testid="input-vin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Kilometraje</Label>
              <Input id="mileage" type="number" placeholder="50000" data-testid="input-mileage" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select defaultValue="active">
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="in-service">En Servicio</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Tipo de Combustible</Label>
              <Select defaultValue="gasoline">
                <SelectTrigger id="fuelType" data-testid="select-fuel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Eléctrico</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-vehicle">
              Guardar Vehículo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
