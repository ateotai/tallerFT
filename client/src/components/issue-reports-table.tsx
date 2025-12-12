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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Image as ImageIcon, Mic, UserPlus, RotateCcw, XCircle } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import type { Report, Vehicle, Employee, User } from "@shared/schema";

interface IssueReportsTableProps {
  reports: Report[];
}

const statusColors = {
  nuevo: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  preliminares: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "en_transito/rescate": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pending: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  asignado: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  diagnostico: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  resolved: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const statusLabels = {
  nuevo: "Nuevo",
  preliminares: "Preliminares",
  "en_transito/rescate": "En tránsito/Rescate",
  pending: "Nuevo",
  in_progress: "En Proceso",
  asignado: "Asignado",
  diagnostico: "En Diagnóstico",
  resolved: "Resuelto",
};

export function IssueReportsTable({ reports }: IssueReportsTableProps) {
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null);
  const [reportToAssign, setReportToAssign] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | keyof typeof statusLabels>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();
  
  const { user } = useAuth();
  const roleText = (user?.role || "").toLowerCase();
  const currentUserRole = roleText;

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const currentEmployeeIds = employees.filter(e => e.userId === user?.id).map(e => e.id);

  const getAssignedUserName = (employeeId?: number | null) => {
    if (!employeeId) return "Sin asignar";
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return "Desconocido";
    const usr = users.find(u => u.id === emp.userId);
    return usr ? (usr.fullName || usr.username) : `${emp.firstName} ${emp.lastName}`;
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/reports/${id}/reject`);
      return id;
    },
    onSuccess: (id: number) => {
      // Actualizar optimistamente y forzar refetch
      queryClient.setQueryData<Report[] | undefined>(["/api/reports"], (old) => {
        if (!old) return old;
        return old.map(r => r.id === id ? { ...r, status: "nuevo", assignedToEmployeeId: null, assignedAt: null } as any : r);
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.refetchQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Reporte rechazado",
        description: "El reporte regresó a pendiente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el reporte",
        variant: "destructive",
      });
    },
  });

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return "Desconocido";
    return `${vehicle.economicNumber || vehicle.plate} - ${vehicle.brand} ${vehicle.model}`;
  };

  const sortedReports = [...reports].sort((a, b) => {
    const ta = new Date(a.createdAt as any).getTime();
    const tb = new Date(b.createdAt as any).getTime();
    return tb - ta;
  });
  const filteredReports = statusFilter === "all" ? sortedReports : sortedReports.filter(r => r.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageReports = filteredReports.slice(startIndex, startIndex + pageSize);

  const handleChangeStatus = (value: string) => {
    setStatusFilter(value as any);
    setCurrentPage(1);
  };
  const handleChangePageSize = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1);
  };
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleChangeStatus}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="preliminares">Preliminares</SelectItem>
              <SelectItem value="en_transito/rescate">En tránsito/Rescate</SelectItem>
              <SelectItem value="asignado">Asignado</SelectItem>
              <SelectItem value="diagnostico">En Diagnóstico</SelectItem>
              <SelectItem value="resolved">Resuelto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={handleChangePageSize}>
            <SelectTrigger className="w-[140px]" data-testid="select-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={prevPage} disabled={currentPage === 1} data-testid="button-prev-page">Anterior</Button>
          <span className="text-sm text-muted-foreground" data-testid="text-page-indicator">Página {currentPage} de {totalPages}</span>
          <Button variant="outline" onClick={nextPage} disabled={currentPage === totalPages} data-testid="button-next-page">Siguiente</Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de Reporte</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Resolución</TableHead>
              <TableHead>Archivos</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No hay reportes registrados
                </TableCell>
              </TableRow>
            ) : (
              pageReports.map((report) => (
                <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                  <TableCell className="font-medium">#{report.id}</TableCell>
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
                <TableCell>
                  <span className="text-sm">{getAssignedUserName(report.assignedToEmployeeId)}</span>
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
                      {(currentUserRole === "admin" || currentUserRole === "administrador") && report.status === "nuevo" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setReportToAssign(report)}
                          data-testid={`button-assign-${report.id}`}
                        >
                          <UserPlus className="h-4 w-4" />
                          </Button>
                      )}
                      {currentEmployeeIds.length > 0 && report.assignedToEmployeeId && currentEmployeeIds.includes(report.assignedToEmployeeId) && report.status !== "resolved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => rejectMutation.mutate(report.id)}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-${report.id}`}
                          title="Rechazar reporte"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(currentUserRole === "admin" || currentUserRole === "administrador" || currentUserRole === "supervisor") && report.resolved && (
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
                      {(currentUserRole === "admin" || currentUserRole === "administrador" || currentUserRole === "supervisor") && (
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
