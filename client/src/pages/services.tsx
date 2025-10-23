import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
import { useState } from "react";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  //todo: remove mock functionality
  const services = [
    {
      id: "1",
      vehiclePlate: "ABC-1234",
      vehicleName: "Ford Transit",
      serviceType: "Cambio de Aceite",
      date: "15 Nov 2024",
      cost: 1250,
      mechanic: "Juan Pérez",
      provider: "AutoService Pro",
      status: "scheduled" as const,
    },
    {
      id: "2",
      vehiclePlate: "DEF-5678",
      vehicleName: "Toyota Hilux",
      serviceType: "Revisión General",
      date: "20 Nov 2024",
      cost: 3500,
      mechanic: "María García",
      provider: "Taller Central",
      status: "in-progress" as const,
    },
    {
      id: "3",
      vehiclePlate: "GHI-9012",
      vehicleName: "Chevrolet Suburban",
      serviceType: "Cambio de Frenos",
      date: "10 Oct 2024",
      cost: 4200,
      mechanic: "Carlos López",
      provider: "AutoService Pro",
      status: "completed" as const,
    },
    {
      id: "4",
      vehiclePlate: "JKL-3456",
      vehicleName: "Honda Accord",
      serviceType: "Alineación y Balanceo",
      date: "18 Oct 2024",
      cost: 850,
      mechanic: "Juan Pérez",
      provider: "Taller Rápido",
      status: "overdue" as const,
    },
  ];

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.serviceType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Registro de Servicios</h1>
        <p className="text-muted-foreground">
          Historial detallado de todos los mantenimientos realizados
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-services"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="in-progress">En Proceso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-add-service">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Servicio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <ServiceCard key={service.id} {...service} />
        ))}
      </div>
    </div>
  );
}
