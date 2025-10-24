import { useState } from "react";
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
}

export function ProvidersTable({ providers }: ProvidersTableProps) {
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el proveedor",
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
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
      </div>

      {editingProvider && (
        <EditProviderDialog
          provider={editingProvider}
          open={!!editingProvider}
          onOpenChange={(open: boolean) => !open && setEditingProvider(null)}
        />
      )}

      <AlertDialog open={!!deletingProvider} onOpenChange={(open: boolean) => !open && setDeletingProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor{" "}
              <span className="font-semibold">{deletingProvider?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProvider && deleteMutation.mutate(deletingProvider.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
