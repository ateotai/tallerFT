import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  Users, 
  Wrench, 
  Calendar, 
  Package, 
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Stethoscope,
  ShoppingCart,
  Building2,
  MapPin,
  Briefcase
} from "lucide-react";
import type { Vehicle, Client, Service, ScheduledMaintenance, Inventory, Role, Permission, RolePermission, Report, Checklist, WorkOrder, Diagnostic, Workshop, Area, Employee, PurchaseQuote } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { data: permissions = [] } = useQuery<Permission[]>({ queryKey: ["/api/permissions"] });
  const currentRoleId = roles.find(r => r.name === user?.role)?.id;
  const { data: rolePerms = [] } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions", currentRoleId ?? ""],
    enabled: !!currentRoleId,
  });

  const allowedModules = new Set<string>();
  if (permissions.length && rolePerms.length) {
    for (const rp of rolePerms) {
      const perm = permissions.find(p => p.id === rp.permissionId);
      if (perm?.module) {
        allowedModules.add(perm.module);
      }
    }
  }
  allowedModules.add("Reportes de Fallas");
  const roleText = (user?.role || '').toLowerCase();
  if (roleText === 'admin' || roleText === 'administrador') {
    allowedModules.add("Checklists");
  }

  const hasPermission = (permName: string, module: string) => {
    if (!permissions.length || !rolePerms.length) return false;
    const perm = permissions.find(p => p.name === permName && p.module === module);
    if (!perm) return false;
    return rolePerms.some(rp => rp.permissionId === perm.id);
  };

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: allowedModules.has("Vehículos"),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: allowedModules.has("Clientes"),
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: allowedModules.has("Órdenes de Trabajo"),
  });

  const { data: scheduledMaintenance = [] } = useQuery<ScheduledMaintenance[]>({
    queryKey: ["/api/scheduled-maintenance"],
    enabled: allowedModules.has("Tareas Programadas"),
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
    enabled: allowedModules.has("Inventario"),
  });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: allowedModules.has("Reportes de Fallas"),
  });

  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
    enabled: allowedModules.has("Checklists"),
  });

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
    enabled: allowedModules.has("Órdenes de Trabajo") || allowedModules.has("Prueba y Validación"),
  });

  const { data: diagnostics = [] } = useQuery<Diagnostic[]>({
    queryKey: ["/api/diagnostics"],
    enabled: allowedModules.has("Evaluación y Diagnóstico"),
  });

  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
    enabled: allowedModules.has("Talleres"),
  });

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["/api/areas"],
    enabled: allowedModules.has("Áreas"),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: allowedModules.has("Empleados"),
  });

  const { data: purchaseQuotes = [] } = useQuery<PurchaseQuote[]>({
    queryKey: ["/api/purchase-quotes"],
    enabled: allowedModules.has("Cotizaciones de Compra"),
  });

  const quotesDraft = purchaseQuotes.filter(q => q.status === "draft").length;
  const quotesPending = purchaseQuotes.filter(q => q.status === "pending").length;
  const quotesApproved = purchaseQuotes.filter(q => q.status === "approved").length;

  const activeVehicles = vehicles.filter(v => v.status === "active").length;
  const inServiceVehicles = vehicles.filter(v => v.status === "in-service").length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const completedServices = services.filter(s => s.status === "completed").length;
  const pendingServices = services.filter(s => s.status === "pending").length;
  const pendingMaintenance = scheduledMaintenance.filter(m => m.status === "pending").length;
  const lowStockItems = inventory.filter(i => i.quantity < i.minQuantity).length;
  const pendingReports = reports.filter(r => !r.resolved).length;
  const pendingChecklists = checklists.length;
  const woPending = workOrders.filter(w => w.status === "pending").length;
  const woInProgress = workOrders.filter(w => w.status === "in_progress").length;
  const woCompleted = workOrders.filter(w => w.status === "completed").length;
  const woAwaitingValidation = workOrders.filter(w => w.status === "awaiting_validation").length;
  const woValidated = workOrders.filter(w => w.status === "validated").length;
  const pendingDiagnosticsCount = diagnostics.filter(d => !d.approvedAt).length;

  const recentServices = [...services]
    .sort((a, b) => {
      const dateA = a.completedDate || a.scheduledDate || a.createdAt;
      const dateB = b.completedDate || b.scheduledDate || b.createdAt;
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de mantenimiento vehicular
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {allowedModules.has("Vehículos") && (
        <Link href="/vehiculos">
          <Card className="hover-elevate cursor-pointer" data-testid="card-vehicles-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehículos</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-vehicles">{vehicles.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  {activeVehicles} activos
                </Badge>
                {inServiceVehicles > 0 && (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                    {inServiceVehicles} en servicio
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Reportes de Fallas") && (
        <Link href="/reportes-fallas">
          <Card className="hover-elevate cursor-pointer" data-testid="card-reports-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-reports">{reports.length}</div>
              {pendingReports > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {pendingReports} sin resolver
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Clientes") && (
        <Link href="/clientes">
          <Card className="hover-elevate cursor-pointer" data-testid="card-clients-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Razones Sociales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-clients">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {activeClients} razones sociales activas
              </p>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Órdenes de Trabajo") && (
        <Link href="/servicios">
          <Card className="hover-elevate cursor-pointer" data-testid="card-services-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-services">{services.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {completedServices}
                </Badge>
                {pendingServices > 0 && (
                  <Badge variant="outline" className="border-blue-600 text-blue-600">
                    {pendingServices} pendientes
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Tareas Programadas") && (
        <Link href="/programados">
          <Card className="hover-elevate cursor-pointer" data-testid="card-maintenance-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mantenimientos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-maintenance">{scheduledMaintenance.length}</div>
              {pendingMaintenance > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {pendingMaintenance} programados pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Checklists") && (
        <Link href="/checklists">
          <Card className="hover-elevate cursor-pointer" data-testid="card-checklists-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisiones</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-checklists">{pendingChecklists}</div>
              <p className="text-xs text-muted-foreground mt-2">Revisiones registradas</p>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allowedModules.has("Órdenes de Trabajo") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Servicios Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentServices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay servicios registrados
              </p>
            ) : (
              <div className="space-y-3">
                {recentServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                    data-testid={`service-item-${service.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">Servicio #{service.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        service.status === "completed" 
                          ? "border-green-600 text-green-600"
                          : service.status === "pending"
                          ? "border-blue-600 text-blue-600"
                          : "border-yellow-600 text-yellow-600"
                      }
                    >
                      {service.status === "completed" ? "Completado" : 
                       service.status === "pending" ? "Pendiente" : "En proceso"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {allowedModules.has("Inventario") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estado del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="text-sm text-muted-foreground">Total Artículos</p>
                  <p className="text-2xl font-bold" data-testid="text-inventory-total">{inventory.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>

              {lowStockItems > 0 && (
                <Link href="/inventario">
                  <div className="flex items-center gap-3 p-4 border border-destructive/50 bg-destructive/5 rounded-md hover-elevate cursor-pointer">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Stock Bajo</p>
                      <p className="text-xs text-muted-foreground">
                        {lowStockItems} artículo{lowStockItems > 1 ? "s" : ""} por debajo del stock mínimo
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {inventory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valor Total Estimado</p>
                  <p className="text-2xl font-bold" data-testid="text-inventory-value">
                    ${inventory.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allowedModules.has("Categorías") && (
        <Link href="/categorias">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categorías de Servicio</p>
                  <p className="text-2xl font-bold mt-1">Ver todas</p>
                </div>
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Proveedores") && (
        <Link href="/proveedores">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Proveedores</p>
                  <p className="text-2xl font-bold mt-1">Gestionar</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Reportes") && hasPermission("Ver reportes", "Reportes") && (
        <Link href="/reportes">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reportes</p>
                  <p className="text-2xl font-bold mt-1">Ver análisis</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {allowedModules.has("Órdenes de Trabajo") && (
        <Link href="/ordenes-trabajo">
          <Card className="hover-elevate cursor-pointer" data-testid="card-work-orders-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes de Trabajo</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrders.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="border-blue-600 text-blue-600">{woPending} pendientes</Badge>
                {woInProgress > 0 && (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600">{woInProgress} en progreso</Badge>
                )}
                {woCompleted > 0 && (
                  <Badge variant="outline" className="border-green-600 text-green-600">{woCompleted} completadas</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Evaluación y Diagnóstico") && (
        <Link href="/diagnosticos">
          <Card className="hover-elevate cursor-pointer" data-testid="card-diagnostics-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnósticos</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{diagnostics.length}</div>
              {pendingDiagnosticsCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{pendingDiagnosticsCount} pendientes</p>
              )}
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Prueba y Validación") && (
        <Link href="/prueba-validacion">
          <Card className="hover-elevate cursor-pointer" data-testid="card-validation-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validación</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{woAwaitingValidation}</div>
              {woValidated > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{woValidated} validados</p>
              )}
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Cotizaciones de Compra") && (
        <Link href="/cotizaciones">
          <Card className="hover-elevate cursor-pointer" data-testid="card-quotes-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseQuotes.length}</div>
              <div className="flex gap-2 mt-2">
                {quotesDraft > 0 && (
                  <Badge variant="outline" className="border-gray-600 text-gray-600">{quotesDraft} borradores</Badge>
                )}
                {quotesPending > 0 && (
                  <Badge variant="outline" className="border-blue-600 text-blue-600">{quotesPending} pendientes</Badge>
                )}
                {quotesApproved > 0 && (
                  <Badge variant="outline" className="border-green-600 text-green-600">{quotesApproved} aprobadas</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allowedModules.has("Talleres") && (
        <Link href="/talleres">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Talleres</p>
                  <p className="text-2xl font-bold mt-1">{workshops.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Áreas") && (
        <Link href="/areas">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Áreas</p>
                  <p className="text-2xl font-bold mt-1">{areas.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {allowedModules.has("Empleados") && (
        <Link href="/empleados">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Empleados</p>
                  <p className="text-2xl font-bold mt-1">{employees.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>
    </div>
  );
}
