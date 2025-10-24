import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { ProviderType } from "@shared/schema";
import { EditProviderTypeDialog } from "./edit-provider-type-dialog";
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

interface ProviderTypesTableProps {
  providerTypes: ProviderType[];
}

export function ProviderTypesTable({ providerTypes }: ProviderTypesTableProps) {
  const [editingProviderType, setEditingProviderType] = useState<ProviderType | null>(null);
  const [deletingProviderType, setDeletingProviderType] = useState<ProviderType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingProviderType && !providerTypes.find(pt => pt.id === editingProviderType.id)) {
      setEditingProviderType(null);
    }
  }, [providerTypes, editingProviderType]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/provider-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider-types"] });
      toast({
        title: "Tipo eliminado",
        description: "El tipo de proveedor ha sido eliminado exitosamente",
      });
      setDeletingProviderType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tipo de proveedor",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providerTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay tipos de proveedores registrados
                </TableCell>
              </TableRow>
            ) : (
              providerTypes.map((providerType) => (
                <TableRow key={providerType.id} data-testid={`row-provider-type-${providerType.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {providerType.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-name-${providerType.id}`}>
                    {providerType.name}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`text-description-${providerType.id}`}>
                    {providerType.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProviderType(providerType)}
                        data-testid={`button-edit-${providerType.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProviderType(providerType)}
                        data-testid={`button-delete-${providerType.id}`}
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

      {editingProviderType && (
        <EditProviderTypeDialog
          providerType={editingProviderType}
          open={!!editingProviderType}
          onOpenChange={(open: boolean) => !open && setEditingProviderType(null)}
        />
      )}

      <AlertDialog open={!!deletingProviderType} onOpenChange={(open: boolean) => !open && setDeletingProviderType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el tipo{" "}
              <span className="font-semibold">{deletingProviderType?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProviderType && deleteMutation.mutate(deletingProviderType.id)}
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
