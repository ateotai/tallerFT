import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Edit, Trash2, Wrench } from "lucide-react";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  serviceCount: number;
  color: string;
  avgCost: number;
}

export function CategoryCard({
  id,
  name,
  description,
  serviceCount,
  color,
  avgCost,
}: CategoryCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-category-${id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center"
              style={{ backgroundColor: color + "20", color: color }}
            >
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-category-name-${id}`}>
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Servicios registrados:</span>
          <Badge variant="secondary" data-testid={`text-service-count-${id}`}>
            {serviceCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Costo promedio:</span>
          <span className="font-mono font-medium" data-testid={`text-avg-cost-${id}`}>
            ${avgCost.toLocaleString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-${id}`}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button variant="outline" size="sm" data-testid={`button-delete-${id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
