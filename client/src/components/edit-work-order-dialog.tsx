import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Trash2 } from "lucide-react";
import { 
  insertWorkOrderSchema, 
  type InsertWorkOrder, 
  type WorkOrder, 
  type Vehicle, 
  type Employee, 
  type Diagnostic,
  type ServiceCategory,
  type ServiceSubcategory,
  type Inventory,
  type WorkOrderTask,
  type WorkOrderMaterial,
  type WorkOrderEvidence,
} from "@shared/schema";

interface EditWorkOrderDialogProps {
  workOrder: WorkOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TaskFormData {
  responsibleTechnicianId?: number | null;
  assignedMechanicId?: number | null;
  serviceCategoryId?: number | null;
  serviceSubcategoryId?: number | null;
  workshopArea?: string;
  estimatedTime?: string;
  completionDate?: string;
  notes?: string;
}

interface MaterialFormData {
  inventoryId?: number | null;
  partNumber?: string;
  description: string;
  quantityNeeded: number;
  unitCost: number;
}

interface EvidenceFormData {
  fileUrl: string;
  description: string;
  fileType?: string;
}

export function EditWorkOrderDialog({ workOrder, open, onOpenChange }: EditWorkOrderDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: diagnostics = [] } = useQuery<Diagnostic[]>({
    queryKey: ["/api/diagnostics"],
  });

  const { data: serviceCategories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const { data: serviceSubcategories = [] } = useQuery<ServiceSubcategory[]>({
    queryKey: ["/api/service-subcategories"],
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: existingTasks = [], refetch: refetchTasks } = useQuery<WorkOrderTask[]>({
    queryKey: ["/api/work-orders", workOrder.id, "tasks"],
    queryFn: () => fetch(`/api/work-orders/${workOrder.id}/tasks`).then(res => res.json()),
    enabled: open,
  });

  const { data: existingMaterials = [], refetch: refetchMaterials } = useQuery<WorkOrderMaterial[]>({
    queryKey: ["/api/work-orders", workOrder.id, "materials"],
    queryFn: () => fetch(`/api/work-orders/${workOrder.id}/materials`).then(res => res.json()),
    enabled: open,
  });

  const { data: existingEvidence = [], refetch: refetchEvidence } = useQuery<WorkOrderEvidence[]>({
    queryKey: ["/api/work-orders", workOrder.id, "evidence"],
    queryFn: () => fetch(`/api/work-orders/${workOrder.id}/evidence`).then(res => res.json()),
    enabled: open,
  });

  const [tasks, setTasks] = useState<TaskFormData[]>([]);
  const [materials, setMaterials] = useState<MaterialFormData[]>([]);
  const [evidences, setEvidences] = useState<EvidenceFormData[]>([]);

  const [newTask, setNewTask] = useState<TaskFormData>({});
  const [newMaterial, setNewMaterial] = useState<MaterialFormData>({ description: "", quantityNeeded: 1, unitCost: 0 });
  const [newEvidence, setNewEvidence] = useState<EvidenceFormData>({ fileUrl: "", description: "" });

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    if (open && existingTasks) {
      setTasks(existingTasks.map(task => ({
        responsibleTechnicianId: task.responsibleTechnicianId,
        assignedMechanicId: task.assignedMechanicId,
        serviceCategoryId: task.serviceCategoryId,
        serviceSubcategoryId: task.serviceSubcategoryId,
        workshopArea: task.workshopArea || undefined,
        estimatedTime: task.estimatedTime || undefined,
        completionDate: task.completionDate ? new Date(task.completionDate).toISOString().split('T')[0] : undefined,
        notes: task.notes || undefined,
      })));
    }
  }, [open, existingTasks]);

  useEffect(() => {
    if (open && existingMaterials) {
      setMaterials(existingMaterials.map(material => ({
        inventoryId: material.inventoryId,
        partNumber: material.partNumber || undefined,
        description: material.description,
        quantityNeeded: material.quantityNeeded,
        unitCost: material.unitCost,
      })));
    }
  }, [open, existingMaterials]);

  useEffect(() => {
    if (open && existingEvidence) {
      setEvidences(existingEvidence.map(evidence => ({
        fileUrl: evidence.fileUrl,
        description: evidence.description,
        fileType: evidence.fileType || undefined,
      })));
    }
  }, [open, existingEvidence]);

  const form = useForm<InsertWorkOrder>({
    resolver: zodResolver(insertWorkOrderSchema),
    defaultValues: {
      diagnosticId: workOrder.diagnosticId,
      vehicleId: workOrder.vehicleId,
      assignedToEmployeeId: workOrder.assignedToEmployeeId,
      status: workOrder.status,
      priority: workOrder.priority,
      description: workOrder.description,
      estimatedCost: workOrder.estimatedCost,
    },
  });

  useEffect(() => {
    form.reset({
      diagnosticId: workOrder.diagnosticId,
      vehicleId: workOrder.vehicleId,
      assignedToEmployeeId: workOrder.assignedToEmployeeId,
      status: workOrder.status,
      priority: workOrder.priority,
      description: workOrder.description,
      estimatedCost: workOrder.estimatedCost,
    });
  }, [workOrder, form]);

  const addTask = () => {
    setTasks([...tasks, newTask]);
    setNewTask({});
    setSelectedCategory(null);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    if (!newMaterial.description || newMaterial.description.trim() === "") {
      toast({
        title: "Error",
        description: "La descripción del material es requerida",
        variant: "destructive",
      });
      return;
    }
    
    if (!Number.isFinite(newMaterial.quantityNeeded) || newMaterial.quantityNeeded <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número válido mayor a 0",
        variant: "destructive",
      });
      return;
    }
    
    if (!Number.isFinite(newMaterial.unitCost) || newMaterial.unitCost < 0) {
      toast({
        title: "Error",
        description: "El costo unitario debe ser un número válido mayor o igual a 0",
        variant: "destructive",
      });
      return;
    }
    
    setMaterials([...materials, newMaterial]);
    setNewMaterial({ description: "", quantityNeeded: 1, unitCost: 0 });
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const addEvidence = () => {
    if (evidences.length >= 10) {
      toast({
        title: "Límite alcanzado",
        description: "Solo se permiten hasta 10 archivos de evidencia",
        variant: "destructive",
      });
      return;
    }
    if (!newEvidence.fileUrl || !newEvidence.description) {
      toast({
        title: "Error",
        description: "URL y descripción son requeridos",
        variant: "destructive",
      });
      return;
    }
    setEvidences([...evidences, newEvidence]);
    setNewEvidence({ fileUrl: "", description: "" });
  };

  const removeEvidence = (index: number) => {
    setEvidences(evidences.filter((_, i) => i !== index));
  };

  const filteredSubcategories = serviceSubcategories.filter(
    (sub) => sub.categoryId === selectedCategory
  );

  const mutation = useMutation({
    mutationFn: async (data: InsertWorkOrder) => {
      try {
        const updatedWorkOrder = await apiRequest("PUT", `/api/work-orders/${workOrder.id}`, data) as unknown as WorkOrder;
        
        await Promise.all(existingTasks.map(task => 
          apiRequest("DELETE", `/api/work-orders/tasks/${task.id}`)
        ));
        await Promise.all(existingMaterials.map(material => 
          apiRequest("DELETE", `/api/work-orders/materials/${material.id}`)
        ));
        await Promise.all(existingEvidence.map(evidence => 
          apiRequest("DELETE", `/api/work-orders/evidence/${evidence.id}`)
        ));

        const taskPromises = tasks.map(task => 
          apiRequest("POST", `/api/work-orders/${workOrder.id}/tasks`, task).catch(err => {
            console.error("Error creando tarea:", err);
            throw new Error("Error al crear una de las tareas");
          })
        );
        
        const materialPromises = materials.map(material => {
          if (!Number.isFinite(material.quantityNeeded) || !Number.isFinite(material.unitCost)) {
            throw new Error("Cantidad o costo unitario inválido en materiales");
          }
          const total = material.quantityNeeded * material.unitCost;
          return apiRequest("POST", `/api/work-orders/${workOrder.id}/materials`, {
            ...material,
            partNumber: material.partNumber || null,
            total,
            approved: false,
          }).catch(err => {
            console.error("Error creando material:", err);
            throw new Error("Error al crear uno de los materiales");
          });
        });
        
        const evidencePromises = evidences.slice(0, 10).map(evidence =>
          apiRequest("POST", `/api/work-orders/${workOrder.id}/evidence`, evidence).catch(err => {
            console.error("Error creando evidencia:", err);
            throw new Error("Error al crear una de las evidencias");
          })
        );
        
        try {
          await Promise.all([...taskPromises, ...materialPromises, ...evidencePromises]);
        } catch (error) {
          throw new Error(
            "Orden de trabajo actualizada pero hubo errores al guardar algunos elementos adicionales. " +
            "Por favor revise la orden #" + workOrder.id + " y agregue los elementos faltantes manualmente. " +
            "Detalle: " + (error instanceof Error ? error.message : "Error desconocido")
          );
        }
        
        return updatedWorkOrder;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      refetchTasks();
      refetchMaterials();
      refetchEvidence();
      toast({
        title: "Orden de trabajo actualizada",
        description: "La orden de trabajo ha sido actualizada exitosamente",
      });
      onOpenChange(false);
      setTasks([]);
      setMaterials([]);
      setEvidences([]);
      setNewTask({});
      setNewMaterial({ description: "", quantityNeeded: 1, unitCost: 0 });
      setNewEvidence({ fileUrl: "", description: "" });
      setActiveTab("general");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la orden de trabajo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWorkOrder) => {
    mutation.mutate(data);
  };

  const totalMaterialsCost = materials.reduce((sum, mat) => sum + (mat.quantityNeeded * mat.unitCost), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orden de Trabajo #{workOrder.id}</DialogTitle>
          <DialogDescription>
            Modifica la información de la orden de trabajo
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tareas ({tasks.length})</TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">Materiales ({materials.length})</TabsTrigger>
            <TabsTrigger value="evidence" data-testid="tab-evidence">Evidencias ({evidences.length}/10)</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehículo *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-vehicle">
                              <SelectValue placeholder="Selecciona vehículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.economicNumber} - {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedToEmployeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mecánico Asignado</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-employee">
                              <SelectValue placeholder="Selecciona mecánico" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin asignar</SelectItem>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diagnosticId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnóstico Asociado</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-diagnostic">
                              <SelectValue placeholder="Selecciona diagnóstico" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin diagnóstico</SelectItem>
                            {diagnostics.map((diagnostic) => (
                              <SelectItem key={diagnostic.id} value={diagnostic.id.toString()}>
                                Diagnóstico #{diagnostic.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Opcional: vincula esta OT con un diagnóstico previo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Selecciona estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="awaiting_approval">Esperando Aprobación</SelectItem>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in_progress">En Progreso</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Selecciona prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Estimado</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            data-testid="input-estimated-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe el trabajo a realizar"
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Agregar Tarea</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Técnico Responsable</label>
                      <Select
                        value={newTask.responsibleTechnicianId?.toString() || "none"}
                        onValueChange={(value) => setNewTask({ ...newTask, responsibleTechnicianId: value === "none" ? null : parseInt(value) })}
                      >
                        <SelectTrigger data-testid="select-task-technician">
                          <SelectValue placeholder="Selecciona técnico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.firstName} {emp.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Mecánico Asignado</label>
                      <Select
                        value={newTask.assignedMechanicId?.toString() || "none"}
                        onValueChange={(value) => setNewTask({ ...newTask, assignedMechanicId: value === "none" ? null : parseInt(value) })}
                      >
                        <SelectTrigger data-testid="select-task-mechanic">
                          <SelectValue placeholder="Selecciona mecánico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.firstName} {emp.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Categoría de Servicio</label>
                      <Select
                        value={selectedCategory?.toString() || "none"}
                        onValueChange={(value) => {
                          const catId = value === "none" ? null : parseInt(value);
                          setSelectedCategory(catId);
                          setNewTask({ ...newTask, serviceCategoryId: catId, serviceSubcategoryId: null });
                        }}
                      >
                        <SelectTrigger data-testid="select-task-category">
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {serviceCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Subcategoría</label>
                      <Select
                        value={newTask.serviceSubcategoryId?.toString() || "none"}
                        onValueChange={(value) => setNewTask({ ...newTask, serviceSubcategoryId: value === "none" ? null : parseInt(value) })}
                        disabled={!selectedCategory}
                      >
                        <SelectTrigger data-testid="select-task-subcategory">
                          <SelectValue placeholder="Selecciona subcategoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin subcategoría</SelectItem>
                          {filteredSubcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Área de Taller</label>
                      <Input
                        placeholder="Ej: Área 1"
                        value={newTask.workshopArea || ""}
                        onChange={(e) => setNewTask({ ...newTask, workshopArea: e.target.value })}
                        data-testid="input-task-workshop-area"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tiempo Estimado</label>
                      <Input
                        placeholder="Ej: 3 horas"
                        value={newTask.estimatedTime || ""}
                        onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                        data-testid="input-task-estimated-time"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Fecha de Terminación</label>
                      <Input
                        type="date"
                        value={newTask.completionDate || ""}
                        onChange={(e) => setNewTask({ ...newTask, completionDate: e.target.value })}
                        data-testid="input-task-completion-date"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Notas</label>
                      <Textarea
                        placeholder="Notas adicionales"
                        value={newTask.notes || ""}
                        onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                        data-testid="textarea-task-notes"
                      />
                    </div>
                  </div>

                  <Button type="button" onClick={addTask} data-testid="button-add-task">
                    Agregar Tarea
                  </Button>
                </div>

                {tasks.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Técnico</TableHead>
                          <TableHead>Mecánico</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Área</TableHead>
                          <TableHead>Tiempo Est.</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task, index) => {
                          const tech = employees.find(e => e.id === task.responsibleTechnicianId);
                          const mech = employees.find(e => e.id === task.assignedMechanicId);
                          const cat = serviceCategories.find(c => c.id === task.serviceCategoryId);
                          return (
                            <TableRow key={index}>
                              <TableCell>{tech ? `${tech.firstName} ${tech.lastName}` : "-"}</TableCell>
                              <TableCell>{mech ? `${mech.firstName} ${mech.lastName}` : "-"}</TableCell>
                              <TableCell>{cat?.name || "-"}</TableCell>
                              <TableCell>{task.workshopArea || "-"}</TableCell>
                              <TableCell>{task.estimatedTime || "-"}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTask(index)}
                                  data-testid={`button-remove-task-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Agregar Material</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Del Inventario (Opcional)</label>
                      <Select
                        value={newMaterial.inventoryId?.toString() || "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            setNewMaterial({ ...newMaterial, inventoryId: null, partNumber: "", unitCost: 0 });
                          } else {
                            const item = inventory.find(i => i.id === parseInt(value));
                            if (item) {
                              setNewMaterial({
                                ...newMaterial,
                                inventoryId: item.id,
                                partNumber: item.partNumber || "",
                                description: item.name,
                                unitCost: item.unitPrice,
                              });
                            }
                          }
                        }}
                      >
                        <SelectTrigger data-testid="select-material-inventory">
                          <SelectValue placeholder="Selecciona del inventario (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Manual (sin inventario)</SelectItem>
                          {inventory.map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} - {item.partNumber} (Stock: {item.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Número de Parte</label>
                      <Input
                        placeholder="Ej: ABC-123"
                        value={newMaterial.partNumber || ""}
                        onChange={(e) => setNewMaterial({ ...newMaterial, partNumber: e.target.value })}
                        data-testid="input-material-part-number"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Descripción *</label>
                      <Input
                        placeholder="Descripción del material"
                        value={newMaterial.description}
                        onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                        data-testid="input-material-description"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Cantidad Necesaria *</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={newMaterial.quantityNeeded}
                        onChange={(e) => setNewMaterial({ ...newMaterial, quantityNeeded: parseFloat(e.target.value) || 0 })}
                        data-testid="input-material-quantity"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Costo Unitario *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newMaterial.unitCost}
                        onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: parseFloat(e.target.value) || 0 })}
                        data-testid="input-material-unit-cost"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full">
                        <label className="text-sm font-medium">Total</label>
                        <Input
                          value={`$${(newMaterial.quantityNeeded * newMaterial.unitCost).toFixed(2)}`}
                          disabled
                          data-testid="input-material-total"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="button" onClick={addMaterial} data-testid="button-add-material">
                    Agregar Material
                  </Button>
                </div>

                {materials.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Unit.</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.map((material, index) => (
                          <TableRow key={index}>
                            <TableCell>{material.description}</TableCell>
                            <TableCell>{material.quantityNeeded}</TableCell>
                            <TableCell>${material.unitCost.toFixed(2)}</TableCell>
                            <TableCell>${(material.quantityNeeded * material.unitCost).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMaterial(index)}
                                data-testid={`button-remove-material-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-semibold">Total Materiales:</TableCell>
                          <TableCell className="font-semibold" data-testid="text-total-materials">
                            ${totalMaterialsCost.toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="evidence" className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Agregar Evidencia ({evidences.length}/10)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">URL del Archivo *</label>
                      <Input
                        placeholder="https://ejemplo.com/archivo.jpg"
                        value={newEvidence.fileUrl}
                        onChange={(e) => setNewEvidence({ ...newEvidence, fileUrl: e.target.value })}
                        data-testid="input-evidence-url"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tipo de Archivo</label>
                      <Input
                        placeholder="Ej: imagen, video, documento"
                        value={newEvidence.fileType || ""}
                        onChange={(e) => setNewEvidence({ ...newEvidence, fileType: e.target.value })}
                        data-testid="input-evidence-type"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Descripción *</label>
                      <Textarea
                        placeholder="Describe la evidencia"
                        value={newEvidence.description}
                        onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                        data-testid="textarea-evidence-description"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={addEvidence}
                    disabled={evidences.length >= 10}
                    data-testid="button-add-evidence"
                  >
                    Agregar Evidencia
                  </Button>
                </div>

                {evidences.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evidences.map((evidence, index) => (
                          <TableRow key={index}>
                            <TableCell className="max-w-[200px] truncate">{evidence.fileUrl}</TableCell>
                            <TableCell>{evidence.fileType || "-"}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{evidence.description}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEvidence(index)}
                                data-testid={`button-remove-evidence-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
