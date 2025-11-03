import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Eye, Settings } from "lucide-react";
import type { Vehicle } from "@shared/schema";
import vanImage from "@assets/generated_images/White_commercial_van_photo_54e80b21.png";
import { useLocation } from "wouter";

interface VehicleCardProps {
  vehicle: Vehicle;
}

const statusConfig = {
  active: { label: "Activo", className: "border-green-600 text-green-600" },
  "in-service": { label: "En Servicio", className: "border-yellow-600 text-yellow-600" },
  inactive: { label: "Inactivo", className: "border-red-600 text-red-600" },
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const status = vehicle.status as keyof typeof statusConfig;
  const [, navigate] = useLocation();
  
  return (
    <Card className="hover-elevate" data-testid={`card-vehicle-${vehicle.id}`}>
      <CardHeader className="p-0">
        <div className="aspect-[4/3] overflow-hidden rounded-t-md bg-muted">
          <img
            src={vehicle.imageUrl || vanImage}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            {vehicle.economicNumber && (
              <div className="text-sm text-muted-foreground mb-1">
                Nº Económico: <span className="font-mono font-semibold" data-testid={`text-economic-${vehicle.id}`}>{vehicle.economicNumber}</span>
              </div>
            )}
            <h3 className="font-semibold text-lg" data-testid={`text-vehicle-name-${vehicle.id}`}>
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.year}</p>
          </div>
          <Badge variant="outline" className={statusConfig[status].className}>
            {statusConfig[status].label}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Placa:</span>
            <span className="font-mono font-medium" data-testid={`text-plate-${vehicle.id}`}>{vehicle.plate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kilometraje:</span>
            <span className="font-mono" data-testid={`text-mileage-${vehicle.id}`}>{vehicle.mileage.toLocaleString()} km</span>
          </div>
          {vehicle.color && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Color:</span>
              <span>{vehicle.color}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Próximo servicio:</span>
            <span className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Pendiente
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          data-testid={`button-view-${vehicle.id}`}
          onClick={() => {
            const params = new URLSearchParams();
            params.set("tab", "history");
            if (vehicle.economicNumber) params.set("economicNumber", String(vehicle.economicNumber));
            if (vehicle.vin) params.set("vin", String(vehicle.vin));
            navigate(`/vehiculos?${params.toString()}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalles
        </Button>
        <Button variant="default" size="sm" className="flex-1" data-testid={`button-service-${vehicle.id}`}>
          <Settings className="h-4 w-4 mr-1" />
          Programar
        </Button>
      </CardFooter>
    </Card>
  );
}
