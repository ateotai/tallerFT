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
import { Plus } from "lucide-react";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema, type InsertClient } from "@shared/schema";
import type { Client, InsertClientBranch, ClientBranch } from "@shared/schema";
import { insertClientBranchSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClientSearchCombobox } from "@/components/client-search-combobox";
import { z } from "zod";

export function AddClientDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      company: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente agregado",
        description: "El cliente ha sido agregado exitosamente.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el cliente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClient) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button data-testid="button-add-client">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Transportes del Norte" data-testid="input-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+52 55 1234 5678" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="cliente@example.com" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle Principal 123, Ciudad" data-testid="input-address" />
                    </FormControl>
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
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-client">
                {createMutation.isPending ? "Guardando..." : "Guardar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function AddClientBranchDialog({ clientId: presetClientId, trigger }: { clientId?: number; trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const form = useForm<InsertClientBranch>({
    resolver: zodResolver(insertClientBranchSchema),
    defaultValues: {
      clientId: presetClientId as any,
      name: "",
      address: "",
      status: "active",
    },
  });

  if (presetClientId) {
    try {
      form.setValue("clientId", presetClientId);
    } catch {}
  }

  const createMutation = useMutation({
    mutationFn: async (data: InsertClientBranch) => {
      const res = await apiRequest("POST", "/api/client-branches", data);
      return await res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-branches"] });
      toast({ title: "Sucursal agregada", description: `Se creó: ${created?.name}` });
      const continuar = window.confirm("¿Deseas agregar otra sucursal?");
      if (continuar) {
        form.reset({ clientId: presetClientId ?? created.clientId, name: "", address: "", status: "active" });
      } else {
        setOpen(false);
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo agregar la sucursal", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertClientBranch) => {
    if (!data.clientId) {
      toast({ title: "Cliente requerido", description: "Selecciona un cliente", variant: "destructive" });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" data-testid="button-add-branch">
            <Building2 className="h-4 w-4 mr-2" />
            Agregar Sucursal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar Sucursal</DialogTitle>
          <DialogDescription>Asocia una sucursal a un cliente existente.</DialogDescription>
        </DialogHeader>
        <Form {...form as any}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            {!presetClientId && (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <ClientSearchCombobox
                    value={form.watch("clientId")}
                    onValueChange={(v) => form.setValue("clientId", v)}
                    placeholder="Buscar cliente..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name={"name" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Sucursal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Sucursal Centro" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name={"status" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as any}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name={"address" as any}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle, Ciudad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Guardando..." : "Guardar Sucursal"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
