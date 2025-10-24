import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryTable } from "@/components/inventory-table";
import { AddInventoryDialog } from "@/components/add-inventory-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, AlertTriangle, TrendingDown } from "lucide-react";
import type { Inventory } from "@shared/schema";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const lowStockCount = items.filter((item) => item.quantity <= item.minQuantity).length;
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
            <div className="text-4xl font-bold text-red-600 dark:text-red-400" data-testid="stat-low-stock">
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
        <AddInventoryDialog />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando inventario...
        </div>
      ) : (
        <InventoryTable items={filteredItems} />
      )}
    </div>
  );
}
