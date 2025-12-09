import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Star } from "lucide-react";
import type { Provider } from "@shared/schema";
import { EditProviderDialog } from "./edit-provider-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProvidersTableProps {
  providers: Provider[];
  view?: "table" | "cards";
}

export function ProvidersTable({ providers, view = "table" }: ProvidersTableProps) {
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingProvider && !providers.find(p => p.id === editingProvider.id)) {
      setEditingProvider(null);
    }
  }, [providers, editingProvider]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado exitosamente",
      });
      setDeletingProvider(null);
    },
    onError: (error: Error) => {
      let msg = error.message || "No se pudo eliminar el proveedor";
      const m = msg.match(/^\d{3}:\s*(.*)$/);
      if (m) {
        try {
          const j = JSON.parse(m[1]);
          if (j?.error) msg = j.error;
        } catch {}
      }
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Activo", variant: "default" as const },
      inactive: { label: "Inactivo", variant: "secondary" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return (
      <Badge variant={statusInfo.variant} data-testid={`badge-status-${status}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const renderCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay proveedores registrados</div>
      ) : (
        providers.map((provider) => (
          <div key={provider.id} className="border rounded-md p-4 space-y-3" data-testid={`card-provider-${provider.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-lg font-semibold" data-testid={`text-name-${provider.id}`}>{provider.name}</div>
                {provider.tradeName && (
                  <div className="text-sm text-muted-foreground" data-testid={`text-tradename-${provider.id}`}>{provider.tradeName}</div>
                )}
                <div className="text-sm" data-testid={`text-type-${provider.id}`}>{provider.type}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditingProvider(provider)} data-testid={`button-edit-${provider.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeletingProvider(provider)} data-testid={`button-delete-${provider.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-mono">Código: {provider.code || ""}</div>
              <div className="font-mono">RFC: {provider.rfc || ""}</div>
              <div>Régimen: {provider.regimen || ""}</div>
              <div className="font-mono">Tel: {provider.phone}</div>
              <div className="break-all">Email: {provider.email}</div>
              <div>{getStatusBadge(provider.status)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="rounded-md border">
        {view === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Nombre Comercial</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>RFC</TableHead>
              <TableHead>Régimen</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Calificación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay proveedores registrados
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id} data-testid={`row-provider-${provider.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {provider.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-name-${provider.id}`}>
                    {provider.name}
                  </TableCell>
                  <TableCell data-testid={`text-tradename-${provider.id}`}>
                    {provider.tradeName || ""}
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-code-${provider.id}`}>
                    {provider.code || ""}
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-rfc-${provider.id}`}>
                    {provider.rfc || ""}
                  </TableCell>
                  <TableCell data-testid={`text-regimen-${provider.id}`}>
                    {provider.regimen || ""}
                  </TableCell>
                  <TableCell data-testid={`text-type-${provider.id}`}>
                    {provider.type}
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-phone-${provider.id}`}>
                    {provider.phone}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`text-email-${provider.id}`}>
                    {provider.email}
                  </TableCell>
                  <TableCell data-testid={`text-rating-${provider.id}`}>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(provider.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProvider(provider)}
                        data-testid={`button-edit-${provider.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProvider(provider)}
                        data-testid={`button-delete-${provider.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        ) : (
          renderCards()
        )}
      </div>

      {editingProvider && (
        <EditProviderDialog
          provider={editingProvider}
          open={!!editingProvider}
          onOpenChange={(open: boolean) => !open && setEditingProvider(null)}
        />
      )}

      <AlertDialog open={!!deletingProvider} onOpenChange={(open: boolean) => !open && setDeletingProvider(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor{" "}
              <span className="font-semibold">{deletingProvider?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel data-testid="button-cancel-delete" className="w-full sm:w-auto h-9 px-4 text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProvider && deleteMutation.mutate(deletingProvider.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="w-full sm:w-auto h-9 px-4 text-sm"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
