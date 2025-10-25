import { useQuery } from "@tanstack/react-query";
import { WorkOrdersTable } from "@/components/work-orders-table";
import { AddWorkOrderDialog } from "@/components/add-work-order-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import type { WorkOrder } from "@shared/schema";

export default function WorkOrdersPage() {
  const { data: workOrders = [], isLoading, error } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const stats = {
    total: workOrders.length,
    pending: workOrders.filter(wo => wo.status === "pending").length,
    inProgress: workOrders.filter(wo => wo.status === "in_progress").length,
    completed: workOrders.filter(wo => wo.status === "completed").length,
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Error al cargar las órdenes de trabajo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-work-orders">
            Órdenes de Trabajo
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las órdenes de trabajo de mantenimiento y reparación
          </p>
        </div>
        <AddWorkOrderDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-work-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total OT</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Órdenes de trabajo totales
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-work-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por iniciar
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-in-progress-work-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-in-progress">
                {stats.inProgress}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En ejecución
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-completed-work-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">
                {stats.completed}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Finalizadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes de Trabajo</CardTitle>
          <CardDescription>
            Visualiza y gestiona todas las órdenes de trabajo del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <WorkOrdersTable workOrders={workOrders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
