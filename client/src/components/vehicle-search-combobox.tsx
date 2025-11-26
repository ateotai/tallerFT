import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Vehicle, Client } from "@shared/schema";

function normalize(text: string) {
  return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface VehicleSearchComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function VehicleSearchCombobox({ value, onValueChange, placeholder = "Buscar vehículo" }: VehicleSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const selected = vehicles.find((v) => v.id === value);
  const searchNorm = normalize(search);
  const filtered = vehicles.filter((v) => {
    const clientName = clients.find((c) => c.id === v.clientId)?.name || "";
    const pool = `${v.economicNumber || ""} ${v.brand || ""} ${v.model || ""} ${clientName}`;
    return normalize(pool).includes(searchNorm);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" data-testid="select-vehicle">
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <Car className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">{selected.economicNumber || selected.plate} · {selected.brand} {selected.model}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por Nº económico, marca, modelo o cliente..." value={search} onValueChange={setSearch} data-testid="input-search-vehicle" />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Cargando vehículos...</div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>No se encontraron vehículos.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((v) => {
                  const clientName = clients.find((c) => c.id === v.clientId)?.name || "";
                  return (
                    <CommandItem
                      key={v.id}
                      value={v.id.toString()}
                      onSelect={() => {
                        onValueChange(v.id === value ? null : v.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      data-testid={`vehicle-option-${v.id}`}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === v.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="font-medium truncate">{v.economicNumber || v.plate} · {v.brand} {v.model}</div>
                        <div className="text-xs text-muted-foreground">Cliente: {clientName}</div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
