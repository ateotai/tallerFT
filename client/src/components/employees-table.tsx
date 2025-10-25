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
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Employee, EmployeeType } from "@shared/schema";
import { EditEmployeeDialog } from "./edit-employee-dialog";
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

interface EmployeesTableProps {
  employees: Employee[];
}

export function EmployeesTable({ employees }: EmployeesTableProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const { data: employeeTypes = [] } = useQuery<EmployeeType[]>({
    queryKey: ["/api/employee-types"],
  });

  useEffect(() => {
    if (editingEmployee && !employees.find(e => e.id === editingEmployee.id)) {
      setEditingEmployee(null);
    }
  }, [employees, editingEmployee]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Empleado eliminado",
        description: "El empleado ha sido eliminado exitosamente",
      });
      setDeletingEmployee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el empleado",
        variant: "destructive",
      });
    },
  });

  const getEmployeeTypeName = (employeeTypeId: number) => {
    const type = employeeTypes.find(t => t.id === employeeTypeId);
    return type?.name || "—";
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Usuario Sistema</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay empleados registrados
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {employee.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-first-name-${employee.id}`}>
                    {employee.firstName}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-last-name-${employee.id}`}>
                    {employee.lastName}
                  </TableCell>
                  <TableCell data-testid={`text-type-${employee.id}`}>
                    {getEmployeeTypeName(employee.employeeTypeId)}
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-phone-${employee.id}`}>
                    {employee.phone || "—"}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`text-email-${employee.id}`}>
                    {employee.email || "—"}
                  </TableCell>
                  <TableCell data-testid={`text-user-${employee.id}`}>
                    {employee.userId ? (
                      <Badge variant="default" className="gap-1" data-testid={`badge-has-user-${employee.id}`}>
                        <Check className="h-3 w-3" />
                        Con usuario
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1" data-testid={`badge-no-user-${employee.id}`}>
                        <X className="h-3 w-3" />
                        Sin usuario
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingEmployee(employee)}
                        data-testid={`button-edit-${employee.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingEmployee(employee)}
                        data-testid={`button-delete-${employee.id}`}
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

      {editingEmployee && (
        <EditEmployeeDialog
          employee={editingEmployee}
          open={!!editingEmployee}
          onOpenChange={(open: boolean) => !open && setEditingEmployee(null)}
        />
      )}

      <AlertDialog open={!!deletingEmployee} onOpenChange={(open: boolean) => !open && setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el empleado{" "}
              <span className="font-semibold">{deletingEmployee?.firstName} {deletingEmployee?.lastName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEmployee && deleteMutation.mutate(deletingEmployee.id)}
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
