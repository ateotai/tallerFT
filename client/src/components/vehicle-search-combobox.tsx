import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Vehicle } from "@shared/schema";

interface VehicleSearchComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function VehicleSearchCombobox({
  value,
  onValueChange,
  placeholder = "Seleccionar vehículo",
}: VehicleSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === value);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = search.toLowerCase();
    const economicNumberMatch = vehicle.economicNumber?.toLowerCase().includes(searchLower);
    const plateMatch = vehicle.plate.toLowerCase().includes(searchLower);
    const modelMatch = vehicle.model.toLowerCase().includes(searchLower);
    const brandMatch = vehicle.brand.toLowerCase().includes(searchLower);
    const idMatch = vehicle.id.toString().includes(searchLower);
    return economicNumberMatch || plateMatch || modelMatch || brandMatch || idMatch;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid="select-vehicle"
        >
          {selectedVehicle ? (
            <div className="flex items-center gap-2 truncate">
              <Car className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedVehicle.economicNumber && `${selectedVehicle.economicNumber} - `}
                {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.plate})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por número económico, placa o modelo..."
            value={search}
            onValueChange={setSearch}
            data-testid="input-search-vehicle"
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Cargando vehículos...
              </div>
            ) : filteredVehicles.length === 0 ? (
              <CommandEmpty>No se encontraron vehículos.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredVehicles.map((vehicle) => (
                  <CommandItem
                    key={vehicle.id}
                    value={vehicle.id.toString()}
                    onSelect={() => {
                      onValueChange(vehicle.id === value ? null : vehicle.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`vehicle-option-${vehicle.id}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === vehicle.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        {vehicle.economicNumber && (
                          <span className="shrink-0">{vehicle.economicNumber}</span>
                        )}
                        <span className="shrink-0">Placa: {vehicle.plate}</span>
                        <span className="shrink-0 text-muted-foreground/70">ID: {vehicle.id}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
