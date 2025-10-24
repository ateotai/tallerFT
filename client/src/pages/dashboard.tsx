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
  CheckCircle
} from "lucide-react";
import type { Vehicle, Client, Service, ScheduledMaintenance, Inventory } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: scheduledMaintenance = [] } = useQuery<ScheduledMaintenance[]>({
    queryKey: ["/api/scheduled-maintenance"],
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const activeVehicles = vehicles.filter(v => v.status === "active").length;
  const inServiceVehicles = vehicles.filter(v => v.status === "in-service").length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const completedServices = services.filter(s => s.status === "completed").length;
  const pendingServices = services.filter(s => s.status === "pending").length;
  const pendingMaintenance = scheduledMaintenance.filter(m => m.status === "pending").length;
  const lowStockItems = inventory.filter(i => i.quantity < i.minQuantity).length;

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

        <Link href="/clientes">
          <Card className="hover-elevate cursor-pointer" data-testid="card-clients-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-clients">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {activeClients} clientes activos
              </p>
            </CardContent>
          </Card>
        </Link>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}
