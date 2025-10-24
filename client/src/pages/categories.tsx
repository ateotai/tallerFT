import { CategoryCard } from "@/components/category-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const categories = [
    {
      id: "1",
      name: "Mantenimiento Preventivo",
      description: "Servicios programados de revisión y prevención",
      serviceCount: 145,
      color: "#3b82f6",
      avgCost: 1850,
    },
    {
      id: "2",
      name: "Cambio de Aceite",
      description: "Cambio de aceite motor y filtros",
      serviceCount: 98,
      color: "#10b981",
      avgCost: 1250,
    },
    {
      id: "3",
      name: "Sistema de Frenos",
      description: "Reparación y mantenimiento de frenos",
      serviceCount: 67,
      color: "#f59e0b",
      avgCost: 3200,
    },
    {
      id: "4",
      name: "Sistema Eléctrico",
      description: "Diagnóstico y reparación eléctrica",
      serviceCount: 54,
      color: "#8b5cf6",
      avgCost: 2450,
    },
    {
      id: "5",
      name: "Transmisión",
      description: "Servicio de transmisión automática y manual",
      serviceCount: 42,
      color: "#ef4444",
      avgCost: 5800,
    },
    {
      id: "6",
      name: "Neumáticos",
      description: "Cambio, alineación y balanceo",
      serviceCount: 89,
      color: "#14b8a6",
      avgCost: 1650,
    },
    {
      id: "7",
      name: "Suspensión",
      description: "Reparación de sistema de suspensión",
      serviceCount: 38,
      color: "#ec4899",
      avgCost: 2900,
    },
    {
      id: "8",
      name: "Sistema de Enfriamiento",
      description: "Mantenimiento de radiador y sistema de enfriamiento",
      serviceCount: 31,
      color: "#06b6d4",
      avgCost: 1450,
    },
  ];

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Categorías de Servicio</h1>
        <p className="text-muted-foreground">
          Administra los tipos de servicios de mantenimiento
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-categories"
          />
        </div>
        <Button data-testid="button-add-category">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Categoría
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((category) => (
          <CategoryCard key={category.id} {...category} />
        ))}
      </div>
    </div>
  );
}
