import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User } from "@shared/schema";

function normalize(text: string) {
  return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface UserSearchComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function UserSearchCombobox({ value, onValueChange, placeholder = "Seleccionar usuario" }: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const selected = users.find((u) => u.id === value);
  const searchNorm = normalize(search);
  const filtered = users.filter((u) => normalize(`${u.fullName} ${u.username} ${u.email}`).includes(searchNorm));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" data-testid="select-user">
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <UserCircle className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">{selected.fullName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por nombre, usuario o email..." value={search} onValueChange={setSearch} data-testid="input-search-user" />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Cargando usuarios...</div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={u.id.toString()}
                    onSelect={() => {
                      onValueChange(u.id === value ? null : u.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`user-option-${u.id}`}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === u.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-medium truncate">{u.fullName}</div>
                      <div className="text-xs text-muted-foreground">{u.username} • {u.email}</div>
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
