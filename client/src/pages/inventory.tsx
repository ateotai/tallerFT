import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "@/components/inventory-table";
import { AddInventoryDialog } from "@/components/add-inventory-dialog";
import { InventoryCategoriesTable } from "@/components/inventory-categories-table";
import { AddInventoryCategoryDialog } from "@/components/add-inventory-category-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, AlertTriangle, TrendingDown, Upload, FileSpreadsheet, Download } from "lucide-react";
import type { Inventory, InventoryCategory, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("Todos");
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<Inventory[]>({
    queryKey: [
      `/api/inventory${conditionFilter === "Todos" ? "" : `?partCondition=${encodeURIComponent(conditionFilter)}`}`,
    ],
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<InventoryCategory[]>({
    queryKey: ["/api/inventory-categories"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });
  const isAdmin = ((currentUser?.role || "").toLowerCase() === "admin" || (currentUser?.role || "").toLowerCase() === "administrador");

  const [importSummary, setImportSummary] = useState<null | { created: number; updated: number; errors: Array<{ row: number; error: string }> }>(null);
  const [importOpen, setImportOpen] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/inventory/import", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al importar");
      }
      return await res.json();
    },
    onSuccess: (summary) => {
      setImportSummary(summary);
      setImportOpen(true);
      toast({ title: "Importación completada", description: `Creados: ${summary.created} • Actualizados: ${summary.updated}` });
    },
    onError: (error: Error) => {
      toast({ title: "Error de importación", description: error.message, variant: "destructive" });
    },
  });

  const downloadTemplate = async () => {
    const res = await fetch("/api/inventory/template", { credentials: "include" });
    if (!res.ok) {
      toast({ title: "Error", description: "No se pudo descargar la plantilla", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lowStockCount = items.filter((item) => item.quantity <= item.minQuantity).length;
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Inventario de Refacciones</h1>
        <p className="text-muted-foreground">
          Control de stock y gestión de partes y refacciones
        </p>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            Inventario
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            Categorías
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
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
            <div className="flex items-center gap-4">
              <div className="w-56">
                <Select onValueChange={setConditionFilter} value={conditionFilter}>
                  <SelectTrigger data-testid="select-filter-condition">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="En uso">En uso</SelectItem>
                    <SelectItem value="Remanofacturado">Remanofacturado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AddInventoryDialog />
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-md">
              <div className="text-sm text-muted-foreground">
                Importa refacciones desde Excel guardando como CSV. Si el SKU ya existe, se actualiza la cantidad.
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
                  <Download className="h-4 w-4 mr-2" /> Descargar Plantilla
                </Button>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importMutation.mutate(f);
                      e.currentTarget.value = "";
                    }}
                    data-testid="input-import-file"
                  />
                  <Button variant="default" disabled={importMutation.isPending} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" /> {importMutation.isPending ? "Importando..." : "Importar CSV"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando inventario...
            </div>
          ) : (
            <InventoryTable items={filteredItems} />
          )}

          <AlertDialog open={importOpen} onOpenChange={(open) => setImportOpen(open)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resultado de importación</AlertDialogTitle>
                <AlertDialogDescription>
                  {importSummary ? (
                    <div className="space-y-2">
                      <div>Creados: {importSummary.created}</div>
                      <div>Actualizados: {importSummary.updated}</div>
                      {importSummary.errors.length > 0 ? (
                        <div className="mt-2">
                          <div className="font-medium">Errores:</div>
                          <ul className="text-sm max-h-40 overflow-y-auto list-disc ml-5">
                            {importSummary.errors.map((e, idx) => (
                              <li key={idx}>Fila {e.row}: {e.error}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Sin errores.</div>
                      )}
                    </div>
                  ) : (
                    <span>Sin datos</span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cerrar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setImportOpen(false); queryClient.invalidateQueries({ queryKey: ["/api/inventory"] }); }}>Aceptar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Categorías de Inventario</h2>
              <p className="text-muted-foreground mt-1">
                Administra las categorías para organizar el inventario
              </p>
            </div>
            <AddInventoryCategoryDialog />
          </div>

          {isLoadingCategories ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando categorías...
            </div>
          ) : (
            <InventoryCategoriesTable />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
