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
import { Badge } from "@/components/ui/badge";
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
import { Eye, CheckCircle2, ClipboardCheck } from "lucide-react";
import { ViewWorkOrderDialog } from "./view-work-order-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { WorkOrder, Vehicle, Employee } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface TestingValidationTableProps {
  workOrders: WorkOrder[];
}

export function TestingValidationTable({ workOrders }: TestingValidationTableProps) {
  const [viewingWorkOrder, setViewingWorkOrder] = useState<WorkOrder | null>(null);
  const [activatingVehicle, setActivatingVehicle] = useState<WorkOrder | null>(null);
  const [activatedIds, setActivatedIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const activateVehicleMutation = useMutation({
    mutationFn: async (workOrderId: number) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/activate-vehicle`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Vehículo dado de alta",
        description: "El vehículo ha sido activado y está listo para su uso operativo",
      });
      if (activatingVehicle) {
        setActivatedIds((prev) => new Set(prev).add(activatingVehicle.id));
      }
      setActivatingVehicle(null);
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      let description = "No se pudo dar de alta el vehículo";
      try {
        const body = msg.split(":").slice(1).join(":").trim();
        const parsed = JSON.parse(body);
        description = parsed.error || description;
      } catch {}
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    },
  });

  const validateWorkOrderMutation = useMutation({
    mutationFn: async (workOrderId: number) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/validate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Orden validada",
        description: "La orden fue validada por administración",
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      let description = "No se pudo validar la orden";
      try {
        const body = msg.split(":").slice(1).join(":").trim();
        const parsed = JSON.parse(body);
        description = parsed.error || description;
      } catch {}
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    },
  });

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.economicNumber})` : "N/A";
  };

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return "N/A";
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "N/A";
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: "Alta", variant: "destructive" as const },
      normal: { label: "Normal", variant: "secondary" as const },
      low: { label: "Baja", variant: "outline" as const },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Vehículo</TableHead>
            <TableHead>Asignado a</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Fecha Completado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map((workOrder) => (
            <TableRow key={workOrder.id}>
              <TableCell className="font-medium" data-testid={`work-order-id-${workOrder.id}`}>
                #{workOrder.id}
              </TableCell>
              <TableCell data-testid={`work-order-vehicle-${workOrder.id}`}>
                {getVehicleName(workOrder.vehicleId)}
              </TableCell>
              <TableCell data-testid={`work-order-employee-${workOrder.id}`}>
                {getEmployeeName(workOrder.assignedToEmployeeId)}
              </TableCell>
              <TableCell data-testid={`work-order-priority-${workOrder.id}`}>
                {getPriorityBadge(workOrder.priority)}
              </TableCell>
              <TableCell data-testid={`work-order-completed-${workOrder.id}`}>
                {workOrder.completedDate ? format(new Date(workOrder.completedDate), "dd/MM/yyyy HH:mm") : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingWorkOrder(workOrder)}
                    data-testid={`button-view-${workOrder.id}`}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setActivatingVehicle(workOrder)}
                    data-testid={`button-activate-${workOrder.id}`}
                    className="gap-2"
                    disabled={workOrder.status !== "validated" || activatedIds.has(workOrder.id)}
                    title={workOrder.status !== "validated" ? "Validar por administración antes de dar de alta" : activatedIds.has(workOrder.id) ? "Vehículo ya dado de alta" : undefined}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Dar de Alta
                  </Button>
                  {workOrder.status === "awaiting_validation" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => validateWorkOrderMutation.mutate(workOrder.id)}
                      data-testid={`button-validate-${workOrder.id}`}
                      className="gap-2"
                      disabled={validateWorkOrderMutation.isPending}
                      title="Validar orden de trabajo"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Validar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {viewingWorkOrder && (
        <ViewWorkOrderDialog
          workOrder={viewingWorkOrder}
          open={!!viewingWorkOrder}
          onOpenChange={(open) => !open && setViewingWorkOrder(null)}
        />
      )}

      <AlertDialog open={!!activatingVehicle} onOpenChange={(open) => !open && setActivatingVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de Alta Vehículo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas dar de alta el vehículo {activatingVehicle && getVehicleName(activatingVehicle.vehicleId)}?
              <br /><br />
              Esta acción marcará el vehículo como disponible para uso operativo después de completar la orden de trabajo #{activatingVehicle?.id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-activate">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => activatingVehicle && activateVehicleMutation.mutate(activatingVehicle.id)}
              disabled={activateVehicleMutation.isPending}
              data-testid="button-confirm-activate"
            >
              {activateVehicleMutation.isPending ? "Activando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
