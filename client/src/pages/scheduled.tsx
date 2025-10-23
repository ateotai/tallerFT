import { ScheduledCalendar } from "@/components/scheduled-calendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ScheduledPage() {
  //todo: remove mock functionality
  const services = [
    {
      id: "1",
      date: "24 Oct 2024",
      time: "09:00",
      vehiclePlate: "ABC-1234",
      serviceType: "Cambio de Aceite",
      status: "today" as const,
    },
    {
      id: "2",
      date: "24 Oct 2024",
      time: "14:00",
      vehiclePlate: "DEF-5678",
      serviceType: "Revisión General",
      status: "today" as const,
    },
    {
      id: "3",
      date: "25 Oct 2024",
      time: "10:00",
      vehiclePlate: "GHI-9012",
      serviceType: "Alineación y Balanceo",
      status: "upcoming" as const,
    },
    {
      id: "4",
      date: "25 Oct 2024",
      time: "15:30",
      vehiclePlate: "JKL-3456",
      serviceType: "Cambio de Filtros",
      status: "upcoming" as const,
    },
    {
      id: "5",
      date: "26 Oct 2024",
      time: "11:00",
      vehiclePlate: "MNO-7890",
      serviceType: "Revisión de Suspensión",
      status: "upcoming" as const,
    },
    {
      id: "6",
      date: "22 Oct 2024",
      time: "11:00",
      vehiclePlate: "PQR-1122",
      serviceType: "Cambio de Frenos",
      status: "overdue" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mantenimientos Programados</h1>
          <p className="text-muted-foreground">
            Calendario de servicios y alertas automáticas
          </p>
        </div>
        <Button data-testid="button-schedule-service">
          <Plus className="h-4 w-4 mr-2" />
          Programar Servicio
        </Button>
      </div>

      <ScheduledCalendar services={services} />
    </div>
  );
}
