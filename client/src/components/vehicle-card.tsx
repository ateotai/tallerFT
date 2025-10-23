import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Eye, Settings } from "lucide-react";

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  status: "active" | "in-service" | "inactive";
  nextService: string;
  imageUrl: string;
  mileage: number;
}

const statusConfig = {
  active: { label: "Activo", className: "border-green-600 text-green-600" },
  "in-service": { label: "En Servicio", className: "border-yellow-600 text-yellow-600" },
  inactive: { label: "Inactivo", className: "border-red-600 text-red-600" },
};

export function VehicleCard({
  id,
  make,
  model,
  year,
  plate,
  status,
  nextService,
  imageUrl,
  mileage,
}: VehicleCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-vehicle-${id}`}>
      <CardHeader className="p-0">
        <div className="aspect-[4/3] overflow-hidden rounded-t-md bg-muted">
          <img
            src={imageUrl}
            alt={`${make} ${model}`}
            className="h-full w-full object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-lg" data-testid={`text-vehicle-name-${id}`}>
              {make} {model}
            </h3>
            <p className="text-sm text-muted-foreground">{year}</p>
          </div>
          <Badge variant="outline" className={statusConfig[status].className}>
            {statusConfig[status].label}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Placa:</span>
            <span className="font-mono font-medium" data-testid={`text-plate-${id}`}>{plate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kilometraje:</span>
            <span className="font-mono" data-testid={`text-mileage-${id}`}>{mileage.toLocaleString()} km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Próximo servicio:</span>
            <span className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {nextService}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-${id}`}>
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalles
        </Button>
        <Button variant="default" size="sm" className="flex-1" data-testid={`button-service-${id}`}>
          <Settings className="h-4 w-4 mr-1" />
          Programar
        </Button>
      </CardFooter>
    </Card>
  );
}
