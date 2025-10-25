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
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
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
  const [approvingDiagnostic, setApprovingDiagnostic] = useState<Diagnostic | null>(null);
  const { toast } = useToast();
  const currentUserRole = "admin";

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

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/diagnostics/${id}/approve`, { userId: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagnostics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Diagnóstico aprobado",
        description: "Se ha aprobado el diagnóstico y se creó una orden de trabajo",
      });
      setApprovingDiagnostic(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el diagnóstico",
        variant: "destructive",
      });
    },
  });

  const getReportInfo = (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    return report ? `#${reportId}` : "N/A";
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Desconocido";
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      crítico: { label: "Crítico", variant: "destructive" as const },
      moderado: { label: "Moderado", variant: "default" as const },
      leve: { label: "Leve", variant: "secondary" as const },
      pendiente: { label: "Pendiente", variant: "outline" as const },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.pendiente;
    return (
      <Badge variant={config.variant} data-testid={`badge-severity-${severity}`}>
        {config.label}
      </Badge>
    );
  };

  const getApprovalBadge = (diagnostic: Diagnostic) => {
    if (diagnostic.approvedBy) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid={`badge-approved-${diagnostic.id}`}>
          ✓ Aprobado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" data-testid={`badge-pending-approval-${diagnostic.id}`}>
        Pendiente
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
              <TableHead className="w-[80px]">Reporte</TableHead>
              <TableHead>Mecánico</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Causa Posible</TableHead>
              <TableHead className="w-[100px]">Odómetro</TableHead>
              <TableHead>Aprobación</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnostics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-sm" data-testid={`text-employee-${diagnostic.id}`}>
                    {getEmployeeName(diagnostic.employeeId)}
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(diagnostic.severity)}
                  </TableCell>
                  <TableCell className="max-w-xs" data-testid={`text-cause-${diagnostic.id}`}>
                    <p className="text-sm line-clamp-2">{diagnostic.possibleCause}</p>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground" data-testid={`text-odometer-${diagnostic.id}`}>
                    {diagnostic.odometer.toLocaleString()} km
                  </TableCell>
                  <TableCell>
                    {getApprovalBadge(diagnostic)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(diagnostic.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {currentUserRole === "admin" && !diagnostic.approvedBy && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setApprovingDiagnostic(diagnostic)}
                          data-testid={`button-approve-${diagnostic.id}`}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
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

      <AlertDialog open={!!approvingDiagnostic} onOpenChange={(open: boolean) => !open && setApprovingDiagnostic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar diagnóstico?</AlertDialogTitle>
            <AlertDialogDescription>
              Al aprobar este diagnóstico se creará automáticamente una orden de trabajo (OT) asociada.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-approve">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approvingDiagnostic && approveMutation.mutate(approvingDiagnostic.id)}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Aprobando..." : "Aprobar y Crear OT"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
