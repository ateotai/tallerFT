import { ScheduledCalendar } from "@/components/scheduled-calendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ScheduledMaintenance, Vehicle, User } from "@shared/schema";
import { useMemo, useState } from "react";
import { AddScheduledMaintenanceDialog } from "@/components/add-scheduled-maintenance-dialog";

export default function ScheduledPage() {
  const [openDialog, setOpenDialog] = useState(false);

  const { data: scheduled = [] } = useQuery<ScheduledMaintenance[]>({
    queryKey: ["/api/scheduled-maintenance"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scheduled-maintenance");
      return await res.json();
    },
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vehicles");
      return await res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  const vehicleMap = useMemo(() => {
    const map = new Map<number, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const services = useMemo(() => {
    const formatterDate = new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formatterTime = new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    return scheduled.map((item) => {
      const due = item.nextDueDate ? new Date(item.nextDueDate as unknown as string) : new Date();
      const dateLabel = formatterDate.format(due);
      const timeLabel = formatterTime.format(due);
      const vehicle = vehicleMap.get(item.vehicleId);
      const plate = vehicle?.plate || "—";
      const assigned = users.find((u) => Number(u.id) === Number(item.assignedUserId || NaN));
      const assignedName = assigned ? (assigned.fullName || assigned.username) : undefined;

      return {
        id: item.id.toString(),
        date: dateLabel,
        time: timeLabel,
        vehiclePlate: plate,
        serviceType: item.title,
        status: (item.status as any) || "pending",
        assignedUser: assignedName,
        assignedUserId: item.assignedUserId,
        due,
      } as const;
    });
  }, [scheduled, vehicleMap, users]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tareas Programadas</h1>
          <p className="text-muted-foreground">
            Calendario de servicios y alertas automáticas
          </p>
        </div>
        <Button data-testid="button-schedule-service" onClick={() => setOpenDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Programar Servicio
        </Button>
      </div>

      <ScheduledCalendar services={services} />

      <AddScheduledMaintenanceDialog
        open={openDialog}
        onOpenChange={(o) => setOpenDialog(o)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/scheduled-maintenance"] });
        }}
      />
    </div>
  );
}
