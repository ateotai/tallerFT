import { ScheduledCalendar } from "../scheduled-calendar";

export default function ScheduledCalendarExample() {
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
      date: "22 Oct 2024",
      time: "11:00",
      vehiclePlate: "JKL-3456",
      serviceType: "Cambio de Frenos",
      status: "overdue" as const,
    },
  ];

  return <ScheduledCalendar services={services} />;
}
