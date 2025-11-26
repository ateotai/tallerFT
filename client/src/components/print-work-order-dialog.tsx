import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import type {
  WorkOrder,
  Vehicle,
  Employee,
  WorkOrderTask,
  WorkOrderMaterial,
  ServiceCategory,
  ServiceSubcategory,
} from "@shared/schema";

interface PrintWorkOrderDialogProps {
  workOrder: WorkOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintWorkOrderDialog({
  workOrder,
  open,
  onOpenChange,
}: PrintWorkOrderDialogProps) {
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

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      awaiting_approval: "Esperando Aprobación",
      pending: "Pendiente",
      in_progress: "En Progreso",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return statusLabels[status as keyof typeof statusLabels] || "Pendiente";
  };

  const getPriorityLabel = (priority: string) => {
    const priorityLabels = {
      low: "Baja",
      normal: "Normal",
      high: "Alta",
    };
    return priorityLabels[priority as keyof typeof priorityLabels] || "Normal";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa de Impresión</span>
            <Button
              onClick={handlePrint}
              className="gap-2"
              data-testid="button-print-now"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="print-content space-y-6 p-6">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content, .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
              }
              @page {
                margin: 2cm;
              }
            }
          `}</style>

          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold">ORDEN DE TRABAJO</h1>
            <p className="text-xl font-mono mt-2">#{workOrder.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-bold mb-4 border-b pb-2">
                Información General
              </h2>
              <div className="space-y-2">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Vehículo:</span>
                  <span>{getVehicleInfo(workOrder.vehicleId)}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Mecánico:</span>
                  <span>{getEmployeeName(workOrder.assignedToEmployeeId)}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Estado:</span>
                  <span>{getStatusLabel(workOrder.status)}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Prioridad:</span>
                  <span>{getPriorityLabel(workOrder.priority)}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Costos</h2>
              <div className="space-y-2">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Costo Est.:</span>
                  <span className="font-mono">
                    {workOrder.estimatedCost
                      ? `$${workOrder.estimatedCost.toFixed(2)}`
                      : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Costo Real:</span>
                  <span className="font-mono">
                    {workOrder.actualCost
                      ? `$${workOrder.actualCost.toFixed(2)}`
                      : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-semibold">Fecha:</span>
                  <span>
                    {format(new Date(workOrder.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
                {workOrder.completedDate && (
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Completado:</span>
                    <span>
                      {format(
                        new Date(workOrder.completedDate),
                        "dd/MM/yyyy"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2 border-b pb-2">
              Descripción del Trabajo
            </h2>
            <p className="text-base leading-relaxed">{workOrder.description}</p>
          </div>

          {workOrder.notes && (
            <div>
              <h2 className="text-lg font-bold mb-2 border-b pb-2">Notas</h2>
              <p className="text-base leading-relaxed text-gray-600">
                {workOrder.notes}
              </p>
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 border-b pb-2">
                Reparaciones Asignadas
              </h2>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left text-sm">
                      Técnico
                    </th>
                    <th className="border border-black p-2 text-left text-sm">
                      Mecánico
                    </th>
                    <th className="border border-black p-2 text-left text-sm">
                      Categoría
                    </th>
                    <th className="border border-black p-2 text-left text-sm">
                      Área
                    </th>
                    <th className="border border-black p-2 text-left text-sm">
                      Tiempo Est.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border border-black p-2 text-sm">
                        {getEmployeeName(task.responsibleTechnicianId)}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {getEmployeeName(task.assignedMechanicId)}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {getCategoryName(task.serviceCategoryId)}
                        {task.serviceSubcategoryId &&
                          ` - ${getSubcategoryName(task.serviceSubcategoryId)}`}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {task.workshopArea || "—"}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {task.estimatedTime || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {materials.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 border-b pb-2">
                Materiales Requeridos
              </h2>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left text-sm">
                      Número de Parte
                    </th>
                    <th className="border border-black p-2 text-left text-sm">
                      Descripción
                    </th>
                    <th className="border border-black p-2 text-center text-sm">
                      Cantidad
                    </th>
                    <th className="border border-black p-2 text-right text-sm">
                      Costo Unit.
                    </th>
                    <th className="border border-black p-2 text-right text-sm">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <tr key={material.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border border-black p-2 text-sm font-mono">
                        {material.partNumber || "—"}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {material.description}
                      </td>
                      <td className="border border-black p-2 text-center text-sm">
                        {material.quantityNeeded}
                      </td>
                      <td className="border border-black p-2 text-right text-sm font-mono">
                        ${material.unitCost.toFixed(2)}
                      </td>
                      <td className="border border-black p-2 text-right text-sm font-mono">
                        ${material.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold">
                    <td
                      colSpan={4}
                      className="border border-black p-2 text-right text-sm"
                    >
                      TOTAL MATERIALES:
                    </td>
                    <td className="border border-black p-2 text-right text-sm font-mono">
                      ${materials.reduce((sum, m) => sum + m.total, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-12 pt-6 border-t-2 border-black">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-black pt-2 mt-16">
                  <p className="font-semibold">Solicitado por</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black pt-2 mt-16">
                  <p className="font-semibold">Autorizado por</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black pt-2 mt-16">
                  <p className="font-semibold">Recibido por</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-6">
            <p>Impreso el {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
