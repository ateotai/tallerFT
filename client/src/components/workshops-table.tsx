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
import type { Workshop } from "@shared/schema";
import { EditWorkshopDialog } from "./edit-workshop-dialog";
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

interface WorkshopsTableProps {
  workshops: Workshop[];
}

export function WorkshopsTable({ workshops }: WorkshopsTableProps) {
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [deletingWorkshop, setDeletingWorkshop] = useState<Workshop | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingWorkshop && !workshops.find(w => w.id === editingWorkshop.id)) {
      setEditingWorkshop(null);
    }
  }, [workshops, editingWorkshop]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workshops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({
        title: "Taller eliminado",
        description: "El taller ha sido eliminado exitosamente",
      });
      setDeletingWorkshop(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el taller",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge variant="default" data-testid="badge-status-active">
        Activo
      </Badge>
    ) : (
      <Badge variant="secondary" data-testid="badge-status-inactive">
        Inactivo
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      internal: { label: "Interno", variant: "default" as const },
      external: { label: "Externo", variant: "secondary" as const },
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, variant: "secondary" as const };
    return (
      <Badge variant={typeInfo.variant}>
        {typeInfo.label}
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
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workshops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay talleres registrados
                </TableCell>
              </TableRow>
            ) : (
              workshops.map((workshop) => (
                <TableRow key={workshop.id} data-testid={`row-workshop-${workshop.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {workshop.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-name-${workshop.id}`}>
                    {workshop.name}
                  </TableCell>
                  <TableCell data-testid={`text-address-${workshop.id}`}>
                    {workshop.address || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-phone-${workshop.id}`}>
                    {workshop.phone || "-"}
                  </TableCell>
                  <TableCell data-testid={`text-type-${workshop.id}`}>
                    {getTypeBadge(workshop.type)}
                  </TableCell>
                  <TableCell data-testid={`text-capacity-${workshop.id}`}>
                    {workshop.capacity ? `${workshop.capacity} vehículos` : "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(workshop.active)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingWorkshop(workshop)}
                        data-testid={`button-edit-${workshop.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingWorkshop(workshop)}
                        data-testid={`button-delete-${workshop.id}`}
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

      {editingWorkshop && (
        <EditWorkshopDialog
          workshop={editingWorkshop}
          open={!!editingWorkshop}
          onOpenChange={(open: boolean) => !open && setEditingWorkshop(null)}
        />
      )}

      <AlertDialog open={!!deletingWorkshop} onOpenChange={(open: boolean) => !open && setDeletingWorkshop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar taller?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el taller{" "}
              <span className="font-semibold">{deletingWorkshop?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWorkshop && deleteMutation.mutate(deletingWorkshop.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover-elevate"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
