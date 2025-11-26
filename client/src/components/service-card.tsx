import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, DollarSign, User, Wrench } from "lucide-react";

interface ServiceCardProps {
  id: string;
  vehiclePlate: string;
  vehicleName: string;
  serviceType: string;
  date: string;
  cost: number;
  mechanic: string;
  provider: string;
  status: "scheduled" | "in-progress" | "completed" | "overdue";
}

const statusConfig = {
  scheduled: { label: "Programado", className: "border-blue-600 text-blue-600" },
  "in-progress": { label: "En Proceso", className: "border-yellow-600 text-yellow-600" },
  completed: { label: "Completado", className: "border-green-600 text-green-600" },
  overdue: { label: "Atrasado", className: "border-red-600 text-red-600" },
};

export function ServiceCard({
  id,
  vehiclePlate,
  vehicleName,
  serviceType,
  date,
  cost,
  mechanic,
  provider,
  status,
}: ServiceCardProps) {
  const info = statusConfig[status] ?? { label: String(status || "-"), className: "border-gray-600 text-gray-600" };
  return (
    <Card className="hover-elevate" data-testid={`card-service-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold" data-testid={`text-service-type-${id}`}>{serviceType}</h4>
            <p className="text-sm text-muted-foreground">
              {vehicleName} • <span className="font-mono">{vehiclePlate}</span>
            </p>
          </div>
          <Badge variant="outline" className={info?.className ?? "border-gray-600 text-gray-600"}>
            {info?.label ?? String(status || "-")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`text-date-${id}`}>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono" data-testid={`text-cost-${id}`}>${cost.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{mechanic}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{provider}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
