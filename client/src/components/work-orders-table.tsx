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
import { Pencil, Trash2, Check } from "lucide-react";
import { EditWorkOrderDialog } from "./edit-work-order-dialog";
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
import type { WorkOrder, Vehicle, Employee } from "@shared/schema";

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
}

export function WorkOrdersTable({ workOrders }: WorkOrdersTableProps) {
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [deletingWorkOrder, setDeletingWorkOrder] = useState<WorkOrder | null>(null);
  const { toast } = useToast();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  useEffect(() => {
    if (editingWorkOrder && !workOrders.find(wo => wo.id === editingWorkOrder.id)) {
      setEditingWorkOrder(null);
    }
  }, [workOrders, editingWorkOrder]);

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/work-orders/${id}/approve`, { userId: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Orden de trabajo aprobada",
        description: "La orden de trabajo ha sido aprobada y está en progreso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la orden de trabajo",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/work-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Orden de trabajo eliminada",
        description: "La orden de trabajo ha sido eliminada exitosamente",
      });
      setDeletingWorkOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la orden de trabajo",
        variant: "destructive",
      });
    },
  });

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.economicNumber} - ${vehicle.model}` : "Desconocido";
  };

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return "Sin asignar";
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Desconocido";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      awaiting_approval: { label: "Esperando Aprobación", variant: "outline" as const },
      pending: { label: "Pendiente", variant: "outline" as const },
      in_progress: { label: "En Progreso", variant: "default" as const },
      completed: { label: "Completada", variant: "secondary" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Baja", variant: "secondary" as const },
      normal: { label: "Normal", variant: "outline" as const },
      high: { label: "Alta", variant: "destructive" as const },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return (
      <Badge variant={config.variant} data-testid={`badge-priority-${priority}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">OT</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Mecánico</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Costo Est.</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay órdenes de trabajo registradas
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((workOrder) => (
                <TableRow key={workOrder.id} data-testid={`row-work-order-${workOrder.id}`}>
                  <TableCell className="font-mono font-medium">
                    #{workOrder.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-vehicle-${workOrder.id}`}>
                    {getVehicleInfo(workOrder.vehicleId)}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`text-employee-${workOrder.id}`}>
                    {getEmployeeName(workOrder.assignedToEmployeeId)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(workOrder.status)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(workOrder.priority)}
                  </TableCell>
                  <TableCell className="max-w-sm" data-testid={`text-description-${workOrder.id}`}>
                    <p className="text-sm line-clamp-2">{workOrder.description}</p>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground" data-testid={`text-cost-${workOrder.id}`}>
                    {workOrder.estimatedCost ? `$${workOrder.estimatedCost.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(workOrder.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {workOrder.status === "awaiting_approval" && (
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => approveMutation.mutate(workOrder.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-${workOrder.id}`}
                          title="Aprobar orden de trabajo"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingWorkOrder(workOrder)}
                        data-testid={`button-edit-${workOrder.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingWorkOrder(workOrder)}
                        data-testid={`button-delete-${workOrder.id}`}
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

      {editingWorkOrder && (
        <EditWorkOrderDialog
          workOrder={editingWorkOrder}
          open={!!editingWorkOrder}
          onOpenChange={(open: boolean) => !open && setEditingWorkOrder(null)}
        />
      )}

      <AlertDialog open={!!deletingWorkOrder} onOpenChange={(open: boolean) => !open && setDeletingWorkOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden de trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la orden de trabajo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWorkOrder && deleteMutation.mutate(deletingWorkOrder.id)}
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
