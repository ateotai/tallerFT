import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Phone, Mail, MapPin, Star } from "lucide-react";

interface ProviderCardProps {
  id: string;
  name: string;
  services: string[];
  phone: string;
  email: string;
  address: string;
  rating: number;
  totalJobs: number;
}

export function ProviderCard({
  id,
  name,
  services,
  phone,
  email,
  address,
  rating,
  totalJobs,
}: ProviderCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-provider-${id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg" data-testid={`text-provider-name-${id}`}>{name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium" data-testid={`text-rating-${id}`}>{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({totalJobs} servicios)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <Badge key={service} variant="secondary" className="text-xs">
              {service}
            </Badge>
          ))}
        </div>
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
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" data-testid={`button-contact-${id}`}>
          Contactar
        </Button>
        <Button variant="default" className="flex-1" data-testid={`button-assign-${id}`}>
          Asignar Servicio
        </Button>
      </CardFooter>
    </Card>
  );
}
