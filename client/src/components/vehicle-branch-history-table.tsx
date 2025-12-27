import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { VehicleBranchHistory, Vehicle, ClientBranch, User, Client } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VehicleBranchHistoryTableProps {
  vehicleId?: number; // Optional: if provided, filters by vehicle
}

export default function VehicleBranchHistoryTable({ vehicleId }: VehicleBranchHistoryTableProps) {
  const { data: history, isLoading: isLoadingHistory } = useQuery<VehicleBranchHistory[]>({
    queryKey: vehicleId ? [`/api/vehicles/${vehicleId}/transfer-history`] : ["/api/vehicles/transfer-history"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: branches } = useQuery<ClientBranch[]>({
    queryKey: ["/api/client-branches"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  if (isLoadingHistory) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p>No hay historial de transferencias registrado.</p>
      </div>
    );
  }

  const getBranchName = (branchId: number) => {
    const branch = branches?.find((b) => b.id === branchId);
    if (!branch) return "Desconocida";
    const client = clients?.find((c) => c.id === branch.clientId);
    return client ? `${client.name} - ${branch.name}` : branch.name;
  };

  const getUserName = (userId: number) => {
    const user = users?.find((u) => u.id === userId);
    return user ? user.username : "Desconocido";
  };

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles?.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "Desconocido";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transferencias de Sucursal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                {!vehicleId && <TableHead>Vehículo</TableHead>}
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Realizado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.changedAt), "PPP p", { locale: es })}
                  </TableCell>
                  {!vehicleId && <TableCell>{getVehicleName(record.vehicleId)}</TableCell>}
                  <TableCell>{getBranchName(record.fromBranchId)}</TableCell>
                  <TableCell>{getBranchName(record.toBranchId)}</TableCell>
                  <TableCell>{record.reason}</TableCell>
                  <TableCell>{getUserName(record.changedBy)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
