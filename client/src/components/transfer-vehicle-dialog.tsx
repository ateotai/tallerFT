import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Vehicle, ClientBranch, Client } from "@shared/schema";
import { Loader2, Check, ChevronsUpDown, Building2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const transferSchema = z.object({
  toBranchId: z.number({
    required_error: "Selecciona una sucursal destino",
  }),
  reason: z.string().min(1, "El motivo es requerido"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferVehicleDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferVehicleDialog({
  vehicle,
  open,
  onOpenChange,
}: TransferVehicleDialogProps) {
  const { toast } = useToast();
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const { data: branches = [] } = useQuery<ClientBranch[]>({ 
    queryKey: ["/api/client-branches"],
  });
  
  const { data: clients = [] } = useQuery<Client[]>({ 
    queryKey: ["/api/clients"],
  });

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      toBranchId: 0,
      reason: "",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        toBranchId: 0,
        reason: "",
      });
    }
  }, [open, form]);

  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      const res = await apiRequest(
        "POST",
        `/api/vehicles/${vehicle.id}/transfer`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      // Also invalidate history if we are viewing it
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicle.id}/history`] });
      
      toast({
        title: "Transferencia exitosa",
        description: "El vehículo ha sido transferido correctamente.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error en la transferencia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransferFormValues) => {
    if (data.toBranchId === vehicle.branchId) {
      form.setError("toBranchId", { 
        message: "La sucursal destino debe ser diferente a la actual" 
      });
      return;
    }
    transferMutation.mutate(data);
  };

  // Filter branches to show context (Client Name - Branch Name)
  const getBranchLabel = (branch: ClientBranch) => {
    const client = clients.find(c => c.id === branch.clientId);
    return `${client?.name || 'Sin Cliente'} - ${branch.name}`;
  };

  const currentBranch = branches.find(b => b.id === vehicle.branchId);
  const currentBranchLabel = currentBranch ? getBranchLabel(currentBranch) : "Sin asignar";

  const filteredBranches = branches.filter(b => b.id !== vehicle.branchId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transferir Vehículo</DialogTitle>
          <DialogDescription>
            Mover el vehículo {vehicle.brand} {vehicle.model} ({vehicle.plate}) a otra sucursal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Sucursal Actual
              </span>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background text-muted-foreground">
                <Building2 className="mr-2 h-4 w-4 opacity-50" />
                {currentBranchLabel}
              </div>
            </div>

            <FormField
              control={form.control}
              name="toBranchId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Sucursal Destino</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? branches.find((b) => b.id === field.value)
                              ? getBranchLabel(branches.find((b) => b.id === field.value)!)
                              : "Seleccione sucursal"
                            : "Buscar sucursal..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar sucursal..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron sucursales.</CommandEmpty>
                          <CommandGroup>
                            {filteredBranches.map((branch) => (
                              <CommandItem
                                value={getBranchLabel(branch)}
                                key={branch.id}
                                onSelect={() => {
                                  form.setValue("toBranchId", branch.id);
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    branch.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {getBranchLabel(branch)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del cambio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Reasignación de flota" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Transferir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
