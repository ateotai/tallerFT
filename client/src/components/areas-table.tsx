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
import { Pencil, Trash2 } from "lucide-react";
import type { Area, Employee } from "@shared/schema";
import { EditAreaDialog } from "./edit-area-dialog";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AreasTableProps {
  areas: Area[];
}

export function AreasTable({ areas }: AreasTableProps) {
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  useEffect(() => {
    if (editingArea && !areas.find(a => a.id === editingArea.id)) {
      setEditingArea(null);
    }
  }, [areas, editingArea]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/areas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      toast({
        title: "Área eliminada",
        description: "El área ha sido eliminada exitosamente",
      });
      setDeletingArea(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el área",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge variant="default" data-testid={`badge-status-active`}>
        Activo
      </Badge>
    ) : (
      <Badge variant="secondary" data-testid={`badge-status-inactive`}>
        Inactivo
      </Badge>
    );
  };

  const getResponsibleName = (responsibleEmployeeId: number | null) => {
    if (!responsibleEmployeeId) {
      return "Sin asignar";
    }
    const employee = employees.find(e => e.id === responsibleEmployeeId);
    if (!employee) {
      return "Sin asignar";
    }
    return `${employee.firstName} ${employee.lastName}`;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay áreas registradas
                </TableCell>
              </TableRow>
            ) : (
              areas.map((area) => (
                <TableRow key={area.id} data-testid={`row-area-${area.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {area.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {area.name}
                  </TableCell>
                  <TableCell>
                    {area.description || "-"}
                  </TableCell>
                  <TableCell data-testid={`text-responsible-${area.id}`}>
                    {getResponsibleName(area.responsibleEmployeeId)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(area.active)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingArea(area)}
                        data-testid={`button-edit-${area.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingArea(area)}
                        data-testid={`button-delete-${area.id}`}
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

      {editingArea && (
        <EditAreaDialog
          area={editingArea}
          open={!!editingArea}
          onOpenChange={(open: boolean) => !open && setEditingArea(null)}
        />
      )}

      <AlertDialog open={!!deletingArea} onOpenChange={(open: boolean) => !open && setDeletingArea(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el área{" "}
              <span className="font-semibold">{deletingArea?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingArea && deleteMutation.mutate(deletingArea.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
