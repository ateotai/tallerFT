import { useState } from "react";
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
import { Edit, Trash2, Image as ImageIcon, Mic, UserPlus, RotateCcw } from "lucide-react";
import { EditIssueReportDialog } from "./edit-issue-report-dialog";
import { AssignReportDialog } from "./assign-report-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Report, Vehicle } from "@shared/schema";

interface IssueReportsTableProps {
  reports: Report[];
}

const statusColors = {
  pending: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  diagnostico: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  resolved: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  diagnostico: "En Diagnóstico",
  resolved: "Resuelto",
};

export function IssueReportsTable({ reports }: IssueReportsTableProps) {
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null);
  const [reportToAssign, setReportToAssign] = useState<Report | null>(null);
  const { toast } = useToast();
  
  const currentUserRole = "admin";

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Reporte eliminado",
        description: "El reporte ha sido eliminado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el reporte",
        variant: "destructive",
      });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/reports/${id}/reopen`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Reporte reabierto",
        description: "El reporte ha sido reabierto exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al reabrir el reporte",
        variant: "destructive",
      });
    },
  });

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return "Desconocido";
    return `${vehicle.economicNumber || vehicle.plate} - ${vehicle.brand} ${vehicle.model}`;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Resolución</TableHead>
              <TableHead>Archivos</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay reportes registrados
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                  <TableCell className="font-medium">
                    {getVehicleInfo(report.vehicleId)}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <p className="text-sm line-clamp-2">{report.description}</p>
                      {report.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Notas: {report.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[report.status as keyof typeof statusColors]}
                      data-testid={`status-${report.id}`}
                    >
                      {statusLabels[report.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`resolved-status-${report.id}`}>
                    {report.resolved ? (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                          Resuelto
                        </Badge>
                        {report.resolvedDate && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(report.resolvedDate), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pendiente</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {Array.isArray(report.images) && report.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground" data-testid={`has-images-${report.id}`}>
                            {report.images.length}
                          </span>
                        </div>
                      )}
                      {report.audioUrl && (
                        <Mic className="h-4 w-4 text-muted-foreground" data-testid={`has-audio-${report.id}`} />
                      )}
                      {(!Array.isArray(report.images) || report.images.length === 0) && !report.audioUrl && (
                        <span className="text-xs text-muted-foreground">Sin archivos</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(report.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(currentUserRole === "admin" || currentUserRole === "supervisor") && report.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setReportToAssign(report)}
                          data-testid={`button-assign-${report.id}`}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      {(currentUserRole === "admin" || currentUserRole === "supervisor") && report.resolved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reopenMutation.mutate(report.id)}
                          disabled={reopenMutation.isPending}
                          data-testid={`button-reopen-${report.id}`}
                          title="Reabrir reporte"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {(currentUserRole === "admin" || currentUserRole === "supervisor") && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReportToEdit(report)}
                            data-testid={`button-edit-${report.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-delete-${report.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará el reporte permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid="button-cancel-delete">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(report.id)}
                                  data-testid="button-confirm-delete"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {reportToEdit && (
        <EditIssueReportDialog
          report={reportToEdit}
          open={!!reportToEdit}
          onOpenChange={(open: boolean) => !open && setReportToEdit(null)}
        />
      )}
      
      {reportToAssign && (
        <AssignReportDialog
          report={reportToAssign}
          open={!!reportToAssign}
          onOpenChange={(open: boolean) => !open && setReportToAssign(null)}
        />
      )}
    </>
  );
}
