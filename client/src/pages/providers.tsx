import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const providers = [
    {
      id: "1",
      name: "AutoService Pro",
      services: ["Mecánica General", "Eléctrico", "Transmisión"],
      phone: "+52 55 1234 5678",
      email: "contacto@autoservicepro.com",
      address: "Av. Principal 123, Ciudad de México",
      rating: 4.8,
      totalJobs: 156,
    },
    {
      id: "2",
      name: "Taller Central",
      services: ["Suspensión", "Frenos", "Motor"],
      phone: "+52 55 9876 5432",
      email: "info@tallercentral.mx",
      address: "Calle Industria 456, CDMX",
      rating: 4.5,
      totalJobs: 203,
    },
    {
      id: "3",
      name: "Taller Rápido",
      services: ["Alineación", "Balanceo", "Neumáticos"],
      phone: "+52 55 5555 1234",
      email: "servicio@tallerrapido.com",
      address: "Blvd. Norte 789, Ciudad de México",
      rating: 4.2,
      totalJobs: 98,
    },
    {
      id: "4",
      name: "Diesel Experts",
      services: ["Motor Diesel", "Inyección", "Turbo"],
      phone: "+52 55 3333 7890",
      email: "contacto@dieselexperts.mx",
      address: "Zona Industrial, CDMX",
      rating: 4.9,
      totalJobs: 127,
    },
  ];

  const filteredProviders = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Proveedores y Talleres</h1>
        <p className="text-muted-foreground">
          Directorio completo de proveedores de servicio
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-providers"
          />
        </div>
        <Button data-testid="button-add-provider">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Proveedor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <ProviderCard key={provider.id} {...provider} />
        ))}
      </div>
    </div>
  );
}
