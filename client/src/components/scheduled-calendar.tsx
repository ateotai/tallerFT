import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Search, Trash2, Pencil } from "lucide-react";
import { Calendar as DayCalendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AddScheduledMaintenanceDialog } from "@/components/add-scheduled-maintenance-dialog";
import type { ScheduledMaintenance } from "@shared/schema";

interface ScheduledService {
  id: string;
  date: string;
  time: string;
  vehiclePlate: string;
  serviceType: string;
  status: "pending" | "in_progress" | "completed";
  assignedUser?: string;
  assignedUserId?: number;
  due: Date;
}

interface ScheduledCalendarProps {
  services: ScheduledService[];
}

const statusConfig = {
  pending: { label: "Nuevo", className: "border-red-600 text-red-600" },
  in_progress: { label: "En Progreso", className: "border-yellow-600 text-yellow-600" },
  completed: { label: "Listo", className: "border-green-600 text-green-600" },
} as const;

export function ScheduledCalendar({ services }: ScheduledCalendarProps) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | keyof typeof statusConfig>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();
  const { user } = useAuth();
  const roleText = (user?.role || "").toLowerCase();
  const isPrivileged = roleText === "admin" || roleText === "administrador" || roleText === "supervisor";
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const effectiveServices = isPrivileged || !user
    ? services
    : services.filter((s) => Number(s.assignedUserId || NaN) === Number(user.id));

  const normalized = [...effectiveServices]
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      const matches =
        s.serviceType.toLowerCase().includes(q) ||
        s.vehiclePlate.toLowerCase().includes(q) ||
        (s.assignedUser || "").toLowerCase().includes(q);
      const statusOk = statusFilter === "all" || s.status === statusFilter;
      return matches && statusOk;
    })
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const totalPages = Math.max(1, Math.ceil(normalized.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageServices = normalized.slice(startIndex, startIndex + pageSize);

  const groupedServices = pageServices.reduce((acc, service) => {
    if (!acc[service.date]) acc[service.date] = [];
    acc[service.date].push(service);
    return acc;
  }, {} as Record<string, ScheduledService[]>);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scheduled-maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-maintenance"] });
      toast({ title: "Eliminado", description: "Tarea programada eliminada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar", variant: "destructive" });
    },
  });

  const { data: editItem } = useQuery<ScheduledMaintenance | undefined>({
    queryKey: ["/api/scheduled-maintenance", String(editingId || "none")],
    queryFn: async () => {
      if (!editingId) return undefined;
      const res = await apiRequest("GET", `/api/scheduled-maintenance/${editingId}`);
      return await res.json();
    },
    enabled: !!editingId,
  });

  return (
    <>
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
          <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tareas..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                  data-testid="input-search-scheduled"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-scheduled">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Nuevo</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Listo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-page-size-scheduled">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 por página</SelectItem>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} data-testid="button-prev-page-scheduled">Anterior</Button>
              <span className="text-sm text-muted-foreground" data-testid="text-page-indicator-scheduled">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} data-testid="button-next-page-scheduled">Siguiente</Button>
            </div>
            {Object.entries(groupedServices).map(([date, dateServices]) => (
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
                          <span className="font-mono">Nº {service.id}</span>
                          {service.assignedUser && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="text-xs">{service.assignedUser}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {isPrivileged && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            onClick={() => deleteMutation.mutate(Number(service.id))}
                            data-testid={`button-delete-scheduled-${service.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => { setEditingId(Number(service.id)); setEditOpen(true); }}
                            data-testid={`button-edit-scheduled-${service.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          ))}
          </>
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
                {effectiveServices.filter((s) => selected && isSameDay(s.due, selected)).length === 0 ? (
                  <div className="text-muted-foreground">No hay servicios para esta fecha</div>
                ) : (
                  effectiveServices
                    .filter((s) => selected && isSameDay(s.due, selected))
                    .map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{service.serviceType}</span>
                            <span className="text-xs text-muted-foreground">Nº {service.id}</span>
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
                            {service.assignedUser && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="text-xs">{service.assignedUser}</span>
                              </span>
                            )}
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
    <AddScheduledMaintenanceDialog
      open={editOpen}
      onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingId(null); }}
      onCreated={() => { queryClient.invalidateQueries({ queryKey: ["/api/scheduled-maintenance"] }); }}
      editItem={editItem ?? null}
    />
    </>
  );
}
