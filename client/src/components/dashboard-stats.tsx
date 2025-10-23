import { Car, Wrench, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  //todo: remove mock functionality
  const stats = [
    {
      title: "Total Vehículos",
      value: 47,
      icon: <Car className="h-5 w-5" />,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Servicios Pendientes",
      value: 12,
      icon: <Wrench className="h-5 w-5" />,
      trend: { value: 3, isPositive: false },
    },
    {
      title: "Gastos del Mes",
      value: "$28,450",
      icon: <DollarSign className="h-5 w-5" />,
      trend: { value: 12, isPositive: false },
    },
    {
      title: "Alertas de Stock",
      value: 8,
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
