import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Mail, FileImage, AlertCircle } from "lucide-react";
import { PrintWorkOrderDialog } from "./print-work-order-dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type {
  WorkOrder,
  Vehicle,
  Employee,
  WorkOrderTask,
  WorkOrderMaterial,
  WorkOrderEvidence,
  ServiceCategory,
  ServiceSubcategory,
} from "@shared/schema";

interface ViewWorkOrderDialogProps {
  workOrder: WorkOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewWorkOrderDialog({
  workOrder,
  open,
  onOpenChange,
}: ViewWorkOrderDialogProps) {
  const [showPrint, setShowPrint] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleImageError = (evidenceId: number) => {
    setImageErrors((prev) => new Set(prev).add(evidenceId));
  };

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: tasks = [] } = useQuery<WorkOrderTask[]>({
    queryKey: ['/api/work-orders', workOrder.id, 'tasks'],
    enabled: open,
  });

  const { data: materials = [] } = useQuery<WorkOrderMaterial[]>({
    queryKey: ['/api/work-orders', workOrder.id, 'materials'],
    enabled: open,
  });

  const { data: evidences = [] } = useQuery<WorkOrderEvidence[]>({
    queryKey: ['/api/work-orders', workOrder.id, 'evidence'],
    enabled: open,
  });

  const { data: serviceCategories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
    enabled: open && tasks.length > 0,
  });

  const { data: serviceSubcategories = [] } = useQuery<ServiceSubcategory[]>({
    queryKey: ["/api/service-subcategories"],
    enabled: open && tasks.length > 0,
  });

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle
      ? `${vehicle.economicNumber} - ${vehicle.brand} ${vehicle.model}`
      : "Desconocido";
  };

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return "Sin asignar";
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.firstName} ${employee.lastName}`
      : "Desconocido";
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "—";
    const category = serviceCategories.find((c) => c.id === categoryId);
    return category ? category.name : "—";
  };

  const getSubcategoryName = (subcategoryId: number | null) => {
    if (!subcategoryId) return "—";
    const subcategory = serviceSubcategories.find((s) => s.id === subcategoryId);
    return subcategory ? subcategory.name : "—";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      awaiting_approval: {
        label: "Esperando Aprobación",
        variant: "outline" as const,
      },
      pending: { label: "Pendiente", variant: "outline" as const },
      in_progress: { label: "En Progreso", variant: "default" as const },
      completed: { label: "Completada", variant: "secondary" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Baja", variant: "secondary" as const },
      normal: { label: "Normal", variant: "outline" as const },
      high: { label: "Alta", variant: "destructive" as const },
    };

    const config =
      priorityConfig[priority as keyof typeof priorityConfig] ||
      priorityConfig.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendEmail = () => {
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La función de envío de correo estará disponible próximamente",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-3">
              <span>Orden de Trabajo #{workOrder.id}</span>
              {getStatusBadge(workOrder.status)}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrint(true)}
                data-testid="button-print-work-order"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                data-testid="button-email-work-order"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Enviar a Correo
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" data-testid="tab-general">
              General
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              Reparaciones ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">
              Materiales ({materials.length})
            </TabsTrigger>
            <TabsTrigger value="evidence" data-testid="tab-evidence">
              Evidencias ({evidences.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Vehículo
                </h3>
                <p className="text-base font-medium" data-testid="text-vehicle">
                  {getVehicleInfo(workOrder.vehicleId)}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Mecánico Asignado
                </h3>
                <p className="text-base" data-testid="text-mechanic">
                  {getEmployeeName(workOrder.assignedToEmployeeId)}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Estado
                </h3>
                <div data-testid="text-status">{getStatusBadge(workOrder.status)}</div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Prioridad
                </h3>
                <div data-testid="text-priority">
                  {getPriorityBadge(workOrder.priority)}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Costo Estimado
                </h3>
                <p className="text-base font-mono" data-testid="text-estimated-cost">
                  {workOrder.estimatedCost
                    ? `$${workOrder.estimatedCost.toFixed(2)}`
                    : "—"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Costo Real
                </h3>
                <p className="text-base font-mono" data-testid="text-actual-cost">
                  {workOrder.actualCost
                    ? `$${workOrder.actualCost.toFixed(2)}`
                    : "—"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Fecha de Creación
                </h3>
                <p className="text-base" data-testid="text-created-date">
                  {format(new Date(workOrder.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>

              {workOrder.completedDate && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Fecha de Completado
                  </h3>
                  <p className="text-base" data-testid="text-completed-date">
                    {format(
                      new Date(workOrder.completedDate),
                      "dd/MM/yyyy HH:mm"
                    )}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                Descripción
              </h3>
              <p className="text-base" data-testid="text-description">
                {workOrder.description}
              </p>
            </div>

            {workOrder.notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Notas
                </h3>
                <p className="text-base text-muted-foreground" data-testid="text-notes">
                  {workOrder.notes}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay reparaciones asignadas
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Mecánico</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Subcategoría</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Tiempo Est.</TableHead>
                      <TableHead>Fecha Comp.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          {getEmployeeName(task.responsibleTechnicianId)}
                        </TableCell>
                        <TableCell>
                          {getEmployeeName(task.assignedMechanicId)}
                        </TableCell>
                        <TableCell>
                          {getCategoryName(task.serviceCategoryId)}
                        </TableCell>
                        <TableCell>
                          {getSubcategoryName(task.serviceSubcategoryId)}
                        </TableCell>
                        <TableCell>{task.workshopArea || "—"}</TableCell>
                        <TableCell>{task.estimatedTime || "—"}</TableCell>
                        <TableCell>
                          {task.completionDate
                            ? format(
                                new Date(task.completionDate),
                                "dd/MM/yyyy"
                              )
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            {materials.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay materiales registrados
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número de Parte</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cant. Disponible</TableHead>
                      <TableHead>Cant. Necesaria</TableHead>
                      <TableHead>Costo Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-mono text-sm">
                          {material.partNumber || "—"}
                        </TableCell>
                        <TableCell>{material.description}</TableCell>
                        <TableCell className="text-center">
                          {material.quantityAvailable}
                        </TableCell>
                        <TableCell className="text-center">
                          {material.quantityNeeded}
                        </TableCell>
                        <TableCell className="font-mono">
                          ${material.unitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          ${material.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              material.approved ? "secondary" : "outline"
                            }
                          >
                            {material.approved ? "Aprobado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Total de Materiales
                      </p>
                      <p className="text-lg font-bold font-mono">
                        $
                        {materials
                          .reduce((sum, m) => sum + m.total, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="mt-6">
            {evidences.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay evidencias registradas
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="rounded-md border p-4 space-y-3"
                    data-testid={`evidence-card-${evidence.id}`}
                  >
                    <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                      {imageErrors.has(evidence.id) ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-12 w-12" />
                          <p className="text-xs text-center px-4">
                            No se pudo cargar la imagen
                          </p>
                        </div>
                      ) : evidence.fileUrl.startsWith("data:") ? (
                        <img
                          src={evidence.fileUrl}
                          alt={evidence.description}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(evidence.id)}
                          data-testid={`evidence-image-${evidence.id}`}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <FileImage className="h-12 w-12" />
                          <p className="text-xs text-center px-4">
                            Archivo externo
                          </p>
                          <a
                            href={evidence.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            data-testid={`evidence-link-${evidence.id}`}
                          >
                            Ver archivo
                          </a>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`evidence-description-${evidence.id}`}>
                      {evidence.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {showPrint && (
        <PrintWorkOrderDialog
          workOrder={workOrder}
          open={showPrint}
          onOpenChange={setShowPrint}
        />
      )}
    </Dialog>
  );
}
