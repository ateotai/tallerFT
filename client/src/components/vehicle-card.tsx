import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import type { Vehicle, ClientBranch, Client, User } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import vanImage from "@assets/generated_images/White_commercial_van_photo_54e80b21.png";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { EditVehicleDialog } from "@/components/edit-vehicle-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const statusInfo = statusConfig[status] ?? { label: String(vehicle.status || "-"), className: "border-gray-600 text-gray-600" };
  const [, navigate] = useLocation();
  const [openEdit, setOpenEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { data: branches = [] } = useQuery<ClientBranch[]>({ queryKey: ["/api/client-branches"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: directUser } = useQuery<User | null>({
    queryKey: ["/api/users", String(vehicle.assignedUserId || "none")],
    queryFn: async () => {
      if (!vehicle.assignedUserId) return null;
      const res = await fetch(`/api/users/${vehicle.assignedUserId}`, { credentials: "include" });
      if (!res.ok) return null;
      return await res.json();
    },
  });
  const branch = branches.find((b) => b.id === vehicle.branchId);
  const client = clients.find((c) => c.id === vehicle.clientId);
  const assignedUser = users.find(u => Number(u.id) === Number(vehicle.assignedUserId ?? NaN)) || directUser || undefined;
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/vehicles/${vehicle.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehículo eliminado", description: "El vehículo ha sido dado de baja exitosamente." });
      setDeleting(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar el vehículo", variant: "destructive" });
    },
  });
  
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
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Nº Económico:</span>
                <span className="font-mono font-bold text-xl leading-tight" data-testid={`text-economic-${vehicle.id}`}>{vehicle.economicNumber}</span>
              </div>
            )}
            <h3 className="font-medium text-base text-muted-foreground" data-testid={`text-vehicle-name-${vehicle.id}`}>
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs text-muted-foreground">{vehicle.year}</p>
          </div>
          <Badge variant="outline" className={statusInfo?.className ?? "border-gray-600 text-gray-600"}>
            {statusInfo?.label ?? String(vehicle.status || "-")}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium" data-testid={`text-client-${vehicle.id}`}>{client?.name || ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sucursal:</span>
            <span className="font-medium" data-testid={`text-branch-${vehicle.id}`}>{branch?.name || ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usuario:</span>
          <span className="font-medium" data-testid={`text-user-${vehicle.id}`}>
            {assignedUser ? (assignedUser.fullName || assignedUser.username) : (vehicle.assignedUserId ? `ID ${vehicle.assignedUserId}` : "")}
          </span>
        </div>
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
          asChild
          variant="outline"
          size="icon"
          title="Ver detalles"
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
          variant="outline"
          size="icon"
          title="Editar"
          data-testid={`button-edit-${vehicle.id}`}
          onClick={() => setOpenEdit(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Eliminar"
          data-testid={`button-delete-${vehicle.id}`}
          onClick={() => setDeleting(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
      <EditVehicleDialog vehicle={vehicle} open={openEdit} onOpenChange={setOpenEdit} />
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
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
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Dar de Baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
