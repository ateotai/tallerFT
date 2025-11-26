import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { Calendar as DayCalendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ScheduledService {
  id: string;
  date: string;
  time: string;
  vehiclePlate: string;
  serviceType: string;
  status: "upcoming" | "today" | "overdue";
  due: Date;
}

interface ScheduledCalendarProps {
  services: ScheduledService[];
}

const statusConfig = {
  upcoming: { label: "Próximo", className: "border-blue-600 text-blue-600" },
  today: { label: "Hoy", className: "border-green-600 text-green-600" },
  overdue: { label: "Atrasado", className: "border-red-600 text-red-600" },
};

export function ScheduledCalendar({ services }: ScheduledCalendarProps) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // Group services by date
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.date]) {
      acc[service.date] = [];
    }
    acc[service.date].push(service);
    return acc;
  }, {} as Record<string, ScheduledService[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-xl">Mantenimientos Programados</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            data-testid="button-view-list"
          >
            Lista
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            data-testid="button-view-calendar"
          >
            Calendario
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {view === "list" ? (
          Object.entries(groupedServices).map(([date, dateServices]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{date}</span>
              </div>
              <div className="space-y-2 pl-6">
                {dateServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate"
                    data-testid={`service-${service.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{service.serviceType}</span>
                        {(() => {
                          const st = service.status as keyof typeof statusConfig;
                          const info = statusConfig[st] ?? { label: String(service.status || "-"), className: "border-gray-600 text-gray-600" };
                          return (
                            <Badge variant="outline" className={info?.className ?? "border-gray-600 text-gray-600"}>
                              {info?.label ?? String(service.status || "-")}
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.time}
                        </span>
                        <span className="font-mono">{service.vehiclePlate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-6">
            <DayCalendar
              mode="single"
              selected={selected}
              onSelect={(date) => setSelected(date || selected)}
            />

            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selected
                    ? selected.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Selecciona una fecha"}
                </span>
              </div>

              <div className="space-y-2 pl-6">
                {services.filter((s) => selected && isSameDay(s.due, selected)).length === 0 ? (
                  <div className="text-muted-foreground">No hay servicios para esta fecha</div>
                ) : (
                  services
                    .filter((s) => selected && isSameDay(s.due, selected))
                    .map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{service.serviceType}</span>
                            {(() => {
                              const st = service.status as keyof typeof statusConfig;
                              const info = statusConfig[st] ?? { label: String(service.status || "-"), className: "border-gray-600 text-gray-600" };
                              return (
                                <Badge variant="outline" className={info?.className ?? "border-gray-600 text-gray-600"}>
                                  {info?.label ?? String(service.status || "-")}
                                </Badge>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.time}
                            </span>
                            <span className="font-mono">{service.vehiclePlate}</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
