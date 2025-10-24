import { ClientCard } from "@/components/client-card";
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

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  //todo: remove mock functionality
  const clients = [
    {
      id: "1",
      name: "Roberto Sánchez",
      company: "Transportes del Norte S.A.",
      phone: "+52 55 1234 5678",
      email: "roberto.sanchez@transportes.com",
      address: "Av. Reforma 456, Ciudad de México",
      vehicleCount: 12,
      totalSpent: 145230,
      status: "active" as const,
    },
    {
      id: "2",
      name: "Laura Fernández",
      company: "Distribuidora Express",
      phone: "+52 55 9876 5432",
      email: "laura.fernandez@express.com",
      address: "Blvd. Insurgentes 789, CDMX",
      vehicleCount: 8,
      totalSpent: 98750,
      status: "active" as const,
    },
    {
      id: "3",
      name: "Miguel Ángel Torres",
      phone: "+52 55 5555 1234",
      email: "miguel.torres@email.com",
      address: "Calle Principal 123, Guadalajara",
      vehicleCount: 3,
      totalSpent: 34560,
      status: "active" as const,
    },
    {
      id: "4",
      name: "Patricia Ramírez",
      company: "Logística Global",
      phone: "+52 55 3333 7890",
      email: "patricia@logisticaglobal.mx",
      address: "Zona Industrial 456, Monterrey",
      vehicleCount: 15,
      totalSpent: 287450,
      status: "active" as const,
    },
    {
      id: "5",
      name: "Jorge Mendoza",
      phone: "+52 55 2222 4567",
      email: "jorge.mendoza@email.com",
      address: "Av. Central 234, Puebla",
      vehicleCount: 2,
      totalSpent: 18900,
      status: "inactive" as const,
    },
    {
      id: "6",
      name: "Carmen Ruiz",
      company: "Mensajería Rápida",
      phone: "+52 55 8888 9999",
      email: "carmen@mensajeria.com",
      address: "Calle Comercio 567, Querétaro",
      vehicleCount: 6,
      totalSpent: 67340,
      status: "active" as const,
    },
  ];

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const totalVehicles = clients.reduce((sum, c) => sum + c.vehicleCount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Clientes</h1>
        <p className="text-muted-foreground">
          Gestión de clientes y sus vehículos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Total Clientes</p>
          <p className="text-3xl font-bold" data-testid="stat-total-clients">{totalClients}</p>
        </div>
        <div className="p-6 border rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Clientes Activos</p>
          <p className="text-3xl font-bold text-green-600" data-testid="stat-active-clients">
            {activeClients}
          </p>
        </div>
        <div className="p-6 border rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Vehículos Totales</p>
          <p className="text-3xl font-bold" data-testid="stat-total-vehicles">{totalVehicles}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-clients"
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
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-add-client">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard key={client.id} {...client} />
        ))}
      </div>
    </div>
  );
}
