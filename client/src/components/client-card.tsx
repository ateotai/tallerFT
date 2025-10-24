import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail, MapPin, Car, Eye } from "lucide-react";

interface ClientCardProps {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  vehicleCount: number;
  totalSpent: number;
  status: "active" | "inactive";
}

const statusConfig = {
  active: { label: "Activo", className: "border-green-600 text-green-600" },
  inactive: { label: "Inactivo", className: "border-gray-600 text-gray-600" },
};

export function ClientCard({
  id,
  name,
  company,
  phone,
  email,
  address,
  vehicleCount,
  totalSpent,
  status,
}: ClientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-client-${id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-client-name-${id}`}>
                {name}
              </h3>
              {company && (
                <p className="text-sm text-muted-foreground">{company}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={statusConfig[status].className}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span data-testid={`text-phone-${id}`}>{phone}</span>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="break-all" data-testid={`text-email-${id}`}>{email}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{address}</span>
          </div>
        </div>
        <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Car className="h-3 w-3" />
              <span>Vehículos</span>
            </div>
            <p className="font-semibold" data-testid={`text-vehicle-count-${id}`}>{vehicleCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Gastado</p>
            <p className="font-mono font-semibold" data-testid={`text-total-spent-${id}`}>
              ${totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" data-testid={`button-view-client-${id}`}>
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalles
        </Button>
        <Button variant="default" className="flex-1" data-testid={`button-contact-${id}`}>
          Contactar
        </Button>
      </CardFooter>
    </Card>
  );
}
