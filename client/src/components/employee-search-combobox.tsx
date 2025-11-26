import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Employee } from "@shared/schema";

function normalize(text: string) {
  return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface EmployeeSearchComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function EmployeeSearchCombobox({ value, onValueChange, placeholder = "Seleccionar empleado" }: EmployeeSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const selected = employees.find((e) => e.id === value);
  const searchNorm = normalize(search);
  const filtered = employees.filter((e) => {
    const full = `${e.firstName || ""} ${e.lastName || ""}`;
    return normalize(full).includes(searchNorm) || `${e.id}`.includes(searchNorm);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" data-testid="select-employee">
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <Users className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">{selected.firstName} {selected.lastName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por nombre o ID..." value={search} onValueChange={setSearch} data-testid="input-search-employee" />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Cargando empleados...</div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>No se encontraron empleados.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={e.id.toString()}
                    onSelect={() => {
                      onValueChange(e.id === value ? null : e.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`employee-option-${e.id}`}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === e.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-medium truncate">{e.firstName} {e.lastName}</div>
                      <div className="text-xs text-muted-foreground">ID: {e.id}</div>
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
