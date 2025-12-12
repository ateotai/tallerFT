import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Provider } from "@shared/schema";

function normalize(text: string) {
  return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface ProviderSearchComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function ProviderSearchCombobox({ value, onValueChange, placeholder = "Seleccionar proveedor" }: ProviderSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: providers = [], isLoading } = useQuery<Provider[]>({ queryKey: ["/api/providers"] });

  const selected = providers.find((p) => p.id === value);
  const searchNorm = normalize(search);
  const filtered = providers.filter((p) => normalize(`${p.name} ${p.tradeName} ${p.type} ${p.rfc} ${p.code}`).includes(searchNorm));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" data-testid="select-provider">
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <Store className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">{selected.name}{selected.tradeName ? ` · ${selected.tradeName}` : ""}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por nombre, comercial, tipo, RFC o código..." value={search} onValueChange={setSearch} data-testid="input-search-provider" />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Cargando proveedores...</div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id.toString()}
                    onSelect={() => {
                      onValueChange(p.id === value ? null : p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`provider-option-${p.id}`}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name}{p.tradeName ? ` · ${p.tradeName}` : ""}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.type}{p.rfc ? ` • ${p.rfc}` : ""}</div>
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

