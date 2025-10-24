import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import type { VehicleType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EditVehicleTypeDialog } from "./edit-vehicle-type-dialog";
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

interface VehicleTypesTableProps {
  vehicleTypes: VehicleType[];
}

export function VehicleTypesTable({ vehicleTypes }: VehicleTypesTableProps) {
  const { toast } = useToast();
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [deletingType, setDeletingType] = useState<VehicleType | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/vehicle-types/${id}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Error al eliminar tipo de vehículo");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Tipo eliminado",
        description: "El tipo de vehículo ha sido eliminado exitosamente.",
      });
      setDeletingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tipo de vehículo",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicleTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay tipos de vehículos registrados
                </TableCell>
              </TableRow>
            ) : (
              vehicleTypes.map((type) => (
                <TableRow key={type.id} data-testid={`row-vehicle-type-${type.id}`}>
                  <TableCell className="font-medium">{type.id}</TableCell>
                  <TableCell data-testid={`text-type-name-${type.id}`}>{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">{type.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingType(type)}
                        data-testid={`button-edit-type-${type.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingType(type)}
                        data-testid={`button-delete-type-${type.id}`}
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

      {editingType && (
        <EditVehicleTypeDialog
          vehicleType={editingType}
          open={!!editingType}
          onOpenChange={(open) => !open && setEditingType(null)}
        />
      )}

      <AlertDialog open={!!deletingType} onOpenChange={(open: boolean) => !open && setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el tipo de vehículo "{deletingType?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingType && deleteMutation.mutate(deletingType.id)}
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
