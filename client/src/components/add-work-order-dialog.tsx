import { useState, useEffect } from "react";
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
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  insertWorkOrderSchema, 
  type InsertWorkOrder,
  type WorkOrder,
  type Vehicle, 
  type Employee, 
  type Diagnostic, 
  type Report,
  type ServiceCategory,
  type ServiceSubcategory,
  type Inventory,
  type Provider,
  type InsertWorkOrderTask,
  type InsertWorkOrderMaterial,
  type InsertWorkOrderEvidence,
} from "@shared/schema";

interface TaskForm {
  responsibleTechnicianId?: number;
  assignedMechanicId?: number;
  serviceCategoryId?: number;
  serviceSubcategoryId?: number;
  providerId?: number;
  workshopArea?: string;
  estimatedTime?: string;
  completionDate?: string;
  notes?: string;
}

interface MaterialForm {
  inventoryId?: number;
  partNumber?: string;
  description: string;
  quantityNeeded: number;
  unitCost: number;
}

interface EvidenceForm {
  fileUrl: string;
  description: string;
  fileName?: string;
}

export function AddWorkOrderDialog() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskForm[]>([]);
  const [materials, setMaterials] = useState<MaterialForm[]>([]);
  const [evidences, setEvidences] = useState<EvidenceForm[]>([]);
  const [newTask, setNewTask] = useState<TaskForm>({});
  const [newMaterial, setNewMaterial] = useState<MaterialForm>({ description: "", quantityNeeded: 1, unitCost: 0 });
  const [newEvidence, setNewEvidence] = useState<EvidenceForm>({ fileUrl: "", description: "" });
  
  const { toast } = useToast();

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: diagnostics = [] } = useQuery<Diagnostic[]>({
    queryKey: ["/api/diagnostics"],
  });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
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

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
  });

  const form = useForm<InsertWorkOrder>({
    resolver: zodResolver(insertWorkOrderSchema),
    defaultValues: {
      diagnosticId: undefined,
      vehicleId: undefined,
      assignedToEmployeeId: undefined,
      status: "awaiting_approval",
      priority: "normal",
      description: "",
      estimatedCost: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertWorkOrder) => {
      let workOrder: WorkOrder;
      
      try {
        workOrder = await apiRequest("POST", "/api/work-orders", data) as unknown as WorkOrder;
      } catch (error) {
        throw new Error("Error al crear la orden de trabajo: " + (error instanceof Error ? error.message : "Error desconocido"));
      }
      
      const taskPromises = tasks.map(task => 
        apiRequest("POST", "/api/work-order-tasks", {
          ...task,
          workOrderId: workOrder.id,
        }).catch(err => {
          console.error("Error creando tarea:", err);
          throw new Error("Error al crear una de las tareas");
        })
      );
      
      const materialPromises = materials.map(material => {
        if (!Number.isFinite(material.quantityNeeded) || !Number.isFinite(material.unitCost)) {
          throw new Error("Cantidad o costo unitario inválido en materiales");
        }
        const total = material.quantityNeeded * material.unitCost;
        return apiRequest("POST", "/api/work-order-materials", {
          ...material,
          partNumber: material.partNumber || null,
          workOrderId: workOrder.id,
          total,
          approved: false,
        }).catch(err => {
          console.error("Error creando material:", err);
          throw new Error("Error al crear uno de los materiales");
        });
      });
      
      const evidencePromises = evidences.slice(0, 10).map(evidence =>
        apiRequest("POST", "/api/work-order-evidence", {
          ...evidence,
          workOrderId: workOrder.id,
        }).catch(err => {
          console.error("Error creando evidencia:", err);
          throw new Error("Error al crear una de las evidencias");
        })
      );
      
      try {
        await Promise.all([...taskPromises, ...materialPromises, ...evidencePromises]);
      } catch (error) {
        throw new Error(
          "Orden de trabajo creada pero hubo errores al guardar algunos elementos adicionales. " +
          "Por favor revise la orden #" + workOrder.id + " y agregue los elementos faltantes manualmente. " +
          "Detalle: " + (error instanceof Error ? error.message : "Error desconocido")
        );
      }
      
      return workOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Orden de trabajo creada",
        description: "La orden de trabajo ha sido agregada exitosamente con todas sus tareas, materiales y evidencias",
      });
      form.reset();
      setTasks([]);
      setMaterials([]);
      setEvidences([]);
      setNewTask({});
      setNewMaterial({ description: "", quantityNeeded: 1, unitCost: 0 });
      setNewEvidence({ fileUrl: "", description: "" });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden de trabajo",
        variant: "destructive",
      });
    },
  });

  const diagnosticId = form.watch("diagnosticId");

  useEffect(() => {
    if (diagnosticId && diagnostics.length > 0 && reports.length > 0) {
      const selectedDiagnostic = diagnostics.find(d => d.id === diagnosticId);
      if (selectedDiagnostic) {
        const relatedReport = reports.find(r => r.id === selectedDiagnostic.reportId);
        
        if (relatedReport) {
          form.setValue("vehicleId", relatedReport.vehicleId);
        }
        
        form.setValue("assignedToEmployeeId", selectedDiagnostic.employeeId);
        
        const description = `${selectedDiagnostic.possibleCause}\n\nRecomendación Técnica: ${selectedDiagnostic.technicalRecommendation}\n\nMateriales Requeridos: ${selectedDiagnostic.requiredMaterials || 'No especificado'}`;
        form.setValue("description", description);
        
        const priorityMap: Record<string, "low" | "normal" | "high"> = {
          "crítico": "high",
          "moderado": "normal",
          "leve": "low"
        };
        form.setValue("priority", priorityMap[selectedDiagnostic.severity] || "normal");
      }
    }
  }, [diagnosticId, diagnostics, reports, form]);

  const onSubmit = (data: InsertWorkOrder) => {
    mutation.mutate(data);
  };

  const addTask = () => {
    setTasks([...tasks, newTask]);
    setNewTask({});
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
    
    if (newEvidence.fileUrl && newEvidence.description) {
      setEvidences([...evidences, newEvidence]);
      setNewEvidence({ fileUrl: "", description: "" });
    } else {
      toast({
        title: "Error",
        description: "Complete la URL del archivo y la descripción",
        variant: "destructive",
      });
    }
  };

  const removeEvidence = (index: number) => {
    setEvidences(evidences.filter((_, i) => i !== index));
  };

  const getInventoryDetails = (inventoryId?: number) => {
    if (!inventoryId) return null;
    return inventory.find(item => item.id === inventoryId);
  };

  const updateMaterialFromInventory = (inventoryId: number) => {
    const item = getInventoryDetails(inventoryId);
    if (item) {
      setNewMaterial({
        ...newMaterial,
        inventoryId,
        partNumber: item.partNumber || undefined,
        description: item.name,
        unitCost: item.unitPrice || 0,
      });
    }
  };

  const filteredSubcategories = newTask.serviceCategoryId
    ? serviceSubcategories.filter(sub => sub.categoryId === newTask.serviceCategoryId)
    : serviceSubcategories;

  const totalMaterialsCost = materials.reduce((sum, m) => sum + (m.quantityNeeded * m.unitCost), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-work-order">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Orden de Trabajo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Orden de Trabajo</DialogTitle>
          <DialogDescription>
            Crea una nueva orden de trabajo para gestionar reparaciones y mantenimiento
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              Tareas {tasks.length > 0 && <Badge className="ml-2" variant="secondary">{tasks.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">
              Materiales {materials.length > 0 && <Badge className="ml-2" variant="secondary">{materials.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="evidence" data-testid="tab-evidence">
              Evidencias {evidences.length > 0 && <Badge className="ml-2" variant="secondary">{evidences.length}/10</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Form {...form}>
              <form id="work-order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Tarea</CardTitle>
                <CardDescription>Define las tareas específicas para esta orden de trabajo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mecánico Asignado</label>
                    <Select
                      value={newTask.assignedMechanicId?.toString() || "none"}
                      onValueChange={(value) => setNewTask({ ...newTask, assignedMechanicId: value === "none" ? undefined : parseInt(value) })}
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoría de Servicio</label>
                    <Select
                      value={newTask.serviceCategoryId?.toString() || "none"}
                      onValueChange={(value) => {
                        setNewTask({ 
                          ...newTask, 
                          serviceCategoryId: value === "none" ? undefined : parseInt(value),
                          serviceSubcategoryId: undefined
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-task-category">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {serviceCategories.filter(c => c.active).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subcategoría</label>
                    <Select
                      value={newTask.serviceSubcategoryId?.toString() || "none"}
                      onValueChange={(value) => setNewTask({ ...newTask, serviceSubcategoryId: value === "none" ? undefined : parseInt(value) })}
                      disabled={!newTask.serviceCategoryId}
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Proveedor</label>
                    <Select
                      value={newTask.providerId?.toString() || "none"}
                      onValueChange={(value) => setNewTask({ ...newTask, providerId: value === "none" ? undefined : parseInt(value) })}
                    >
                      <SelectTrigger data-testid="select-task-provider">
                        <SelectValue placeholder="Selecciona proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {providers.filter(p => p.status === "active").map((provider) => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Área del Taller</label>
                    <Input
                      placeholder="Ej: Área de suspensión"
                      value={newTask.workshopArea || ""}
                      onChange={(e) => setNewTask({ ...newTask, workshopArea: e.target.value })}
                      data-testid="input-task-workshop-area"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tiempo Estimado</label>
                    <Input
                      placeholder="Ej: 2 horas"
                      value={newTask.estimatedTime || ""}
                      onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                      data-testid="input-task-estimated-time"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de Terminación</label>
                    <Input
                      type="date"
                      value={newTask.completionDate || ""}
                      onChange={(e) => setNewTask({ ...newTask, completionDate: e.target.value })}
                      data-testid="input-task-completion-date"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Notas</label>
                    <Textarea
                      placeholder="Notas adicionales sobre la tarea"
                      value={newTask.notes || ""}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      data-testid="textarea-task-notes"
                    />
                  </div>
                </div>

                <Button type="button" onClick={addTask} className="w-full" data-testid="button-add-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tarea
                </Button>
              </CardContent>
            </Card>

            {tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tareas Agregadas ({tasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Mecánico</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Tiempo</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task, index) => {
                        const category = serviceCategories.find(c => c.id === task.serviceCategoryId);
                        const mech = employees.find(e => e.id === task.assignedMechanicId);
                        const provider = providers.find(p => p.id === task.providerId);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{category?.name || "Sin categoría"}</TableCell>
                            <TableCell>{mech ? `${mech.firstName} ${mech.lastName}` : "-"}</TableCell>
                            <TableCell>{provider?.name || "-"}</TableCell>
                            <TableCell>{task.estimatedTime || "-"}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTask(index)}
                                data-testid={`button-remove-task-${index}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Material</CardTitle>
                <CardDescription>Gestiona los materiales y repuestos necesarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Desde Inventario</label>
                    <Select
                      value={newMaterial.inventoryId?.toString() || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setNewMaterial({ ...newMaterial, inventoryId: undefined, partNumber: undefined });
                        } else {
                          updateMaterialFromInventory(parseInt(value));
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número de Parte</label>
                    <Input
                      placeholder="Ej: ABC-123"
                      value={newMaterial.partNumber || ""}
                      onChange={(e) => setNewMaterial({ ...newMaterial, partNumber: e.target.value })}
                      data-testid="input-material-part-number"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Descripción *</label>
                    <Input
                      placeholder="Descripción del material"
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      data-testid="input-material-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cantidad Necesaria *</label>
                    <Input
                      type="number"
                      min="1"
                      value={newMaterial.quantityNeeded}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantityNeeded: parseInt(e.target.value) || 1 })}
                      data-testid="input-material-quantity"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Costo Unitario *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMaterial.unitCost}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: parseFloat(e.target.value) || 0 })}
                      data-testid="input-material-unit-cost"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Total</label>
                    <div className="text-2xl font-bold text-primary">
                      ${(newMaterial.quantityNeeded * newMaterial.unitCost).toFixed(2)}
                    </div>
                  </div>
                </div>

                <Button type="button" onClick={addMaterial} className="w-full" data-testid="button-add-material">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Material
                </Button>
              </CardContent>
            </Card>

            {materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Materiales Agregados ({materials.length})</CardTitle>
                  <CardDescription>
                    Total de materiales: <span className="text-lg font-bold">${totalMaterialsCost.toFixed(2)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Parte #</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell>{material.description}</TableCell>
                          <TableCell>{material.partNumber || "-"}</TableCell>
                          <TableCell className="text-right">{material.quantityNeeded}</TableCell>
                          <TableCell className="text-right">${material.unitCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">
                            ${(material.quantityNeeded * material.unitCost).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMaterial(index)}
                              data-testid={`button-remove-material-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Evidencia</CardTitle>
                <CardDescription>
                  Adjunta hasta 10 archivos de evidencia (fotos, documentos, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Archivo *</label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewEvidence({ 
                              ...newEvidence, 
                              fileUrl: reader.result as string,
                              fileName: file.name
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      data-testid="input-evidence-file"
                    />
                    {newEvidence.fileName && (
                      <p className="text-sm text-muted-foreground">
                        Archivo seleccionado: {newEvidence.fileName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción *</label>
                    <Textarea
                      placeholder="Describe el contenido del archivo"
                      value={newEvidence.description}
                      onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                      data-testid="textarea-evidence-description"
                    />
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={addEvidence} 
                  className="w-full" 
                  disabled={evidences.length >= 10}
                  data-testid="button-add-evidence"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Agregar Evidencia ({evidences.length}/10)
                </Button>
              </CardContent>
            </Card>

            {evidences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evidencias Agregadas ({evidences.length}/10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Archivo</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidences.map((evidence, index) => (
                        <TableRow key={index}>
                          <TableCell>{evidence.description}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {evidence.fileName || "Archivo adjunto"}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEvidence(index)}
                              data-testid={`button-remove-evidence-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {tasks.length > 0 && <span className="mr-4">{tasks.length} tarea(s)</span>}
            {materials.length > 0 && <span className="mr-4">{materials.length} material(es) - ${totalMaterialsCost.toFixed(2)}</span>}
            {evidences.length > 0 && <span>{evidences.length} evidencia(s)</span>}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="work-order-form"
              disabled={mutation.isPending}
              data-testid="button-submit"
            >
              {mutation.isPending ? "Creando..." : "Crear Orden de Trabajo"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
