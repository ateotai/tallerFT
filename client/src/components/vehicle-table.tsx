import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Settings, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  status: "active" | "in-service" | "inactive";
  mileage: number;
  nextService: string;
}

interface VehicleTableProps {
  vehicles: Vehicle[];
}

const statusConfig = {
  active: { label: "Activo", className: "border-green-600 text-green-600" },
  "in-service": { label: "En Servicio", className: "border-yellow-600 text-yellow-600" },
  inactive: { label: "Inactivo", className: "border-red-600 text-red-600" },
};

export function VehicleTable({ vehicles }: VehicleTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Kilometraje</TableHead>
            <TableHead>Próximo Servicio</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
              <TableCell>
                <div>
                  <div className="font-medium" data-testid={`text-vehicle-${vehicle.id}`}>
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-sm text-muted-foreground">{vehicle.year}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono" data-testid={`text-plate-${vehicle.id}`}>{vehicle.plate}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusConfig[vehicle.status].className}
                >
                  {statusConfig[vehicle.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-mono">{vehicle.mileage.toLocaleString()} km</span>
              </TableCell>
              <TableCell>{vehicle.nextService}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" data-testid={`button-view-${vehicle.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-schedule-${vehicle.id}`}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Dar de Baja
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
