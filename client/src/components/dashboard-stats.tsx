import { useQuery } from "@tanstack/react-query";
import { Car, Wrench, DollarSign, AlertTriangle, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vehicle, Service, Inventory, Client, ClientBranch } from "@shared/schema";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-2">
            <span
              className={
                trend.isPositive ? "text-green-600" : "text-red-600"
              }
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}%
            </span>{" "}
            vs mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: branches = [] } = useQuery<ClientBranch[]>({ queryKey: ["/api/client-branches"] });

  const pendingServices = services.filter(s => s.status === "pending").length;
  const lowStockItems = inventory.filter(i => i.quantity < i.minQuantity).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = services
    .filter(service => {
      const serviceDate = service.completedDate || service.scheduledDate;
      if (!serviceDate) return false;
      const date = new Date(serviceDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, service) => sum + service.cost, 0);

  const stats = [
    {
      title: "Total Vehículos",
      value: vehicles.length,
      icon: <Car className="h-5 w-5" />,
    },
    {
      title: "Clientes",
      value: clients.length,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Sucursales Activas",
      value: branches.filter((b) => b.status === "active").length,
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      title: "Servicios Pendientes",
      value: pendingServices,
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      title: "Gastos del Mes",
      value: `$${monthlyExpenses.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Alertas de Stock",
      value: lowStockItems,
      icon: <AlertTriangle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
