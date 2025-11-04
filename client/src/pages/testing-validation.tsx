import { useQuery } from "@tanstack/react-query";
import { TestingValidationTable } from "@/components/testing-validation-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, AlertCircle } from "lucide-react";
import type { WorkOrder } from "@shared/schema";

export default function TestingValidationPage() {
  const { data: workOrders = [], isLoading, error } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });
  // Con la nueva lógica, las OT "completed" pasan a "awaiting_validation" automáticamente,
  // y administración puede marcarlas como "validated". Ambas deben mostrarse aquí.
  const awaitingValidationWorkOrders = workOrders.filter(wo => wo.status === "awaiting_validation");
  const validatedWorkOrders = workOrders.filter(wo => wo.status === "validated");
  const completedWorkOrders = [...awaitingValidationWorkOrders, ...validatedWorkOrders];

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
          <h1 className="text-3xl font-bold" data-testid="heading-testing-validation">
            Prueba y Validación
          </h1>
          <p className="text-muted-foreground mt-1">
            Valida órdenes completadas y da de alta vehículos para su uso operativo
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card data-testid="card-completed-work-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OT Completadas (pendientes de validación)</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">
                {awaitingValidationWorkOrders.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ordenes esperando validación administrativa
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-ready-for-use">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listos para Alta (validados)</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-ready">
                {validatedWorkOrders.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vehículos validados por administración y listos para alta
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Trabajo Completadas</CardTitle>
          <CardDescription>
            Revisa las órdenes completadas y da de alta los vehículos para su uso operativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : completedWorkOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay órdenes de trabajo completadas
            </div>
          ) : (
            <TestingValidationTable workOrders={completedWorkOrders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
