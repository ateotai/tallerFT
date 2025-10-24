import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User } from "lucide-react";
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
import type { Client } from "@shared/schema";

interface ClientSearchComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function ClientSearchCombobox({
  value,
  onValueChange,
  placeholder = "Seleccionar cliente",
}: ClientSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const selectedClient = clients.find((client) => client.id === value);

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase();
    const nameMatch = client.name.toLowerCase().includes(searchLower);
    const companyMatch = client.company?.toLowerCase().includes(searchLower);
    const idMatch = client.id.toString().includes(searchLower);
    return nameMatch || companyMatch || idMatch;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid="select-client"
        >
          {selectedClient ? (
            <div className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedClient.name}
                {selectedClient.company && ` - ${selectedClient.company}`}
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
            placeholder="Buscar por nombre, empresa o ID..."
            value={search}
            onValueChange={setSearch}
            data-testid="input-search-client"
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Cargando clientes...
              </div>
            ) : filteredClients.length === 0 ? (
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id.toString()}
                    onSelect={() => {
                      onValueChange(client.id === value ? null : client.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`client-option-${client.id}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-medium truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        {client.company && (
                          <span className="truncate">{client.company}</span>
                        )}
                        <span className="shrink-0">ID: {client.id}</span>
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
