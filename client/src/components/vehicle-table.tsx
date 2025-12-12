import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditVehicleDialog } from "@/components/edit-vehicle-dialog";
import type { Vehicle, ClientBranch } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

interface VehicleTableProps {
  vehicles: Vehicle[];
}

const statusConfig = {
  active: { label: "Activo", className: "border-green-600 text-green-600" },
  "in-service": { label: "En Servicio", className: "border-yellow-600 text-yellow-600" },
  inactive: { label: "Inactivo", className: "border-red-600 text-red-600" },
};

export function VehicleTable({ vehicles }: VehicleTableProps) {
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<number | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: branches = [] } = useQuery<ClientBranch[]>({ queryKey: ["/api/client-branches"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Vehículo eliminado",
        description: "El vehículo ha sido dado de baja exitosamente.",
      });
      setDeletingVehicleId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el vehículo",
        variant: "destructive",
      });
    },
  });

  return (
    <>
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
            {vehicles.map((vehicle) => {
              const status = vehicle.status as keyof typeof statusConfig;
              const statusInfo = statusConfig[status] ?? { label: String(vehicle.status || "-"), className: "border-gray-600 text-gray-600" };
              return (
                <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
                  <TableCell>
                    <div>
                      {vehicle.economicNumber && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">Nº Económico:</span>
                          <span className="font-mono font-bold text-lg" data-testid={`text-economic-${vehicle.id}`}>{vehicle.economicNumber}</span>
                        </div>
                      )}
                      {branches.find(b => b.id === vehicle.branchId) && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Sucursal: <span className="font-medium" data-testid={`text-branch-${vehicle.id}`}>{branches.find(b => b.id === vehicle.branchId)!.name}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground" data-testid={`text-vehicle-${vehicle.id}`}>
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground">{vehicle.year}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono" data-testid={`text-plate-${vehicle.id}`}>{vehicle.plate}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusInfo?.className ?? "border-gray-600 text-gray-600"}>
                      {statusInfo?.label ?? String(vehicle.status || "-")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{vehicle.mileage.toLocaleString()} km</span>
                  </TableCell>
                  <TableCell>Pendiente</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-${vehicle.id}`}
                      >
                        {(() => {
                          const params = new URLSearchParams();
                          params.set("tab", "history");
                          if (vehicle.economicNumber) params.set("economicNumber", String(vehicle.economicNumber));
                          if (vehicle.vin) params.set("vin", String(vehicle.vin));
                          return (
                            <Link href={`/vehiculos?${params.toString()}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          );
                        })()}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar"
                        onClick={() => setDeletingVehicleId(vehicle.id)}
                        data-testid={`button-delete-${vehicle.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-more-${vehicle.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setEditingVehicle(vehicle)}
                            data-testid={`button-edit-${vehicle.id}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeletingVehicleId(vehicle.id)}
                            data-testid={`button-delete-${vehicle.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Dar de Baja
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingVehicle && (
        <EditVehicleDialog
          vehicle={editingVehicle}
          open={!!editingVehicle}
          onOpenChange={(open) => !open && setEditingVehicle(null)}
        />
      )}

      <AlertDialog open={deletingVehicleId !== null} onOpenChange={(open) => !open && setDeletingVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción dará de baja el vehículo permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVehicleId && deleteMutation.mutate(deletingVehicleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Dar de Baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
