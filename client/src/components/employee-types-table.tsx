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
import type { EmployeeType } from "@shared/schema";
import { EditEmployeeTypeDialog } from "./edit-employee-type-dialog";
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

interface EmployeeTypesTableProps {
  employeeTypes: EmployeeType[];
}

export function EmployeeTypesTable({ employeeTypes }: EmployeeTypesTableProps) {
  const [editingEmployeeType, setEditingEmployeeType] = useState<EmployeeType | null>(null);
  const [deletingEmployeeType, setDeletingEmployeeType] = useState<EmployeeType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingEmployeeType && !employeeTypes.find(et => et.id === editingEmployeeType.id)) {
      setEditingEmployeeType(null);
    }
  }, [employeeTypes, editingEmployeeType]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employee-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-types"] });
      toast({
        title: "Tipo eliminado",
        description: "El tipo de empleado ha sido eliminado exitosamente",
      });
      setDeletingEmployeeType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tipo de empleado",
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
            {employeeTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay tipos de empleados registrados
                </TableCell>
              </TableRow>
            ) : (
              employeeTypes.map((employeeType) => (
                <TableRow key={employeeType.id} data-testid={`row-employee-type-${employeeType.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {employeeType.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-name-${employeeType.id}`}>
                    {employeeType.name}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`text-description-${employeeType.id}`}>
                    {employeeType.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingEmployeeType(employeeType)}
                        data-testid={`button-edit-${employeeType.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingEmployeeType(employeeType)}
                        data-testid={`button-delete-${employeeType.id}`}
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

      {editingEmployeeType && (
        <EditEmployeeTypeDialog
          employeeType={editingEmployeeType}
          open={!!editingEmployeeType}
          onOpenChange={(open: boolean) => !open && setEditingEmployeeType(null)}
        />
      )}

      <AlertDialog open={!!deletingEmployeeType} onOpenChange={(open: boolean) => !open && setDeletingEmployeeType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el tipo{" "}
              <span className="font-semibold">{deletingEmployeeType?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEmployeeType && deleteMutation.mutate(deletingEmployeeType.id)}
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
