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
import { EditDiagnosticDialog } from "./edit-diagnostic-dialog";
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
import { format } from "date-fns";
import type { Diagnostic, Report, Employee } from "@shared/schema";

interface DiagnosticsTableProps {
  diagnostics: Diagnostic[];
}

export function DiagnosticsTable({ diagnostics }: DiagnosticsTableProps) {
  const [editingDiagnostic, setEditingDiagnostic] = useState<Diagnostic | null>(null);
  const [deletingDiagnostic, setDeletingDiagnostic] = useState<Diagnostic | null>(null);
  const { toast } = useToast();

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  useEffect(() => {
    if (editingDiagnostic && !diagnostics.find(d => d.id === editingDiagnostic.id)) {
      setEditingDiagnostic(null);
    }
  }, [diagnostics, editingDiagnostic]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/diagnostics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagnostics"] });
      toast({
        title: "Diagnóstico eliminado",
        description: "El diagnóstico ha sido eliminado exitosamente",
      });
      setDeletingDiagnostic(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el diagnóstico",
        variant: "destructive",
      });
    },
  });

  const getReportInfo = (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    return report ? `Reporte #${reportId}` : "Desconocido";
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Desconocido";
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Reporte</TableHead>
              <TableHead>Mecánico</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Costo Estimado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnostics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay diagnósticos registrados
                </TableCell>
              </TableRow>
            ) : (
              diagnostics.map((diagnostic) => (
                <TableRow key={diagnostic.id} data-testid={`row-diagnostic-${diagnostic.id}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {diagnostic.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-report-${diagnostic.id}`}>
                    {getReportInfo(diagnostic.reportId)}
                  </TableCell>
                  <TableCell data-testid={`text-employee-${diagnostic.id}`}>
                    {getEmployeeName(diagnostic.employeeId)}
                  </TableCell>
                  <TableCell className="max-w-md" data-testid={`text-diagnosis-${diagnostic.id}`}>
                    <div className="space-y-1">
                      <p className="text-sm line-clamp-2">{diagnostic.diagnosis || "Sin diagnóstico"}</p>
                      {diagnostic.recommendations && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Recomendaciones: {diagnostic.recommendations}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`text-cost-${diagnostic.id}`}>
                    {diagnostic.estimatedCost ? `$${diagnostic.estimatedCost.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(diagnostic.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDiagnostic(diagnostic)}
                        data-testid={`button-edit-${diagnostic.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingDiagnostic(diagnostic)}
                        data-testid={`button-delete-${diagnostic.id}`}
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

      {editingDiagnostic && (
        <EditDiagnosticDialog
          diagnostic={editingDiagnostic}
          open={!!editingDiagnostic}
          onOpenChange={(open: boolean) => !open && setEditingDiagnostic(null)}
        />
      )}

      <AlertDialog open={!!deletingDiagnostic} onOpenChange={(open: boolean) => !open && setDeletingDiagnostic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar diagnóstico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el diagnóstico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDiagnostic && deleteMutation.mutate(deletingDiagnostic.id)}
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
