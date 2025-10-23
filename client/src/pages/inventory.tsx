import { InventoryTable } from "@/components/inventory-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const items = [
    {
      id: "1",
      partNumber: "FLT-001",
      name: "Filtro de Aceite",
      category: "Filtros",
      stock: 45,
      minStock: 20,
      price: 125.50,
      location: "Almacén A-12",
    },
    {
      id: "2",
      partNumber: "BRK-205",
      name: "Pastillas de Freno",
      category: "Frenos",
      stock: 8,
      minStock: 15,
      price: 850.00,
      location: "Almacén B-05",
    },
    {
      id: "3",
      partNumber: "SPK-103",
      name: "Bujías NGK",
      category: "Motor",
      stock: 120,
      minStock: 30,
      price: 85.00,
      location: "Almacén A-08",
    },
    {
      id: "4",
      partNumber: "OIL-500",
      name: "Aceite Motor 10W-40",
      category: "Lubricantes",
      stock: 65,
      minStock: 40,
      price: 185.00,
      location: "Almacén C-01",
    },
    {
      id: "5",
      partNumber: "TIR-001",
      name: "Neumático 205/55R16",
      category: "Neumáticos",
      stock: 12,
      minStock: 16,
      price: 1250.00,
      location: "Almacén D-10",
    },
  ];

  const lowStockCount = items.filter((item) => item.stock <= item.minStock).length;
  const totalValue = items.reduce((sum, item) => sum + item.stock * item.price, 0);
  const totalItems = items.reduce((sum, item) => sum + item.stock, 0);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Inventario de Refacciones</h1>
        <p className="text-muted-foreground">
          Control de stock y gestión de partes y refacciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="stat-total-items">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {items.length} tipos diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor en Stock
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="stat-total-value">
              ${totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valor total del inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas de Stock
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600" data-testid="stat-low-stock">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Items bajo stock mínimo</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar refacciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-inventory"
          />
        </div>
        <Button data-testid="button-add-item">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Refacción
        </Button>
      </div>

      <InventoryTable items={filteredItems} />
    </div>
  );
}
