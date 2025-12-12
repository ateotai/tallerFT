import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Pencil, Trash2, AlertTriangle, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { EditInventoryDialog } from "./edit-inventory-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Inventory, InventoryCategory, Workshop } from "@shared/schema";

interface InventoryTableProps {
  items: Inventory[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  const { data: categories = [] } = useQuery<InventoryCategory[]>({
    queryKey: ["/api/inventory-categories"],
  });
  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortCol, setSortCol] = useState<
    | "partNumber"
    | "sku"
    | "name"
    | "partCondition"
    | "category"
    | "borrowedEconomicNumber"
    | "quantity"
    | "minQuantity"
    | "maxQuantity"
    | "unitPrice"
    | "location"
    | "workshop"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (editingItem && !items.find(item => item.id === editingItem.id)) {
      setEditingItem(null);
    }
  }, [items, editingItem]);

  useEffect(() => {
    // Ajustar página si cambia el tamaño o el total
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [items.length, pageSize, page]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Artículo eliminado",
        description: "El artículo ha sido eliminado del inventario exitosamente",
      });
      setDeletingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el artículo",
        variant: "destructive",
      });
    },
  });

  const getCategoryName = (item: Inventory) =>
    item.categoryId ? categories.find((c) => c.id === item.categoryId)?.name ?? "Sin categoría" : "Sin categoría";
  const getWorkshopName = (item: Inventory) =>
    item.workshopId ? workshops.find((w) => w.id === item.workshopId)?.name ?? "Sin asignar" : "Sin asignar";

  const comparator = (a: Inventory, b: Inventory) => {
    const va =
      sortCol === "partNumber" ? (a.partNumber ?? "") :
      sortCol === "sku" ? (a.sku ?? "") :
      sortCol === "name" ? a.name :
      sortCol === "partCondition" ? a.partCondition :
      sortCol === "category" ? getCategoryName(a) :
      sortCol === "borrowedEconomicNumber" ? (a.borrowedEconomicNumber ?? "") :
      sortCol === "quantity" ? a.quantity :
      sortCol === "minQuantity" ? a.minQuantity :
      sortCol === "maxQuantity" ? a.maxQuantity :
      sortCol === "unitPrice" ? a.unitPrice :
      sortCol === "location" ? (a.location ?? "") :
      sortCol === "workshop" ? getWorkshopName(a) : "";
    const vb =
      sortCol === "partNumber" ? (b.partNumber ?? "") :
      sortCol === "sku" ? (b.sku ?? "") :
      sortCol === "name" ? b.name :
      sortCol === "partCondition" ? b.partCondition :
      sortCol === "category" ? getCategoryName(b) :
      sortCol === "borrowedEconomicNumber" ? (b.borrowedEconomicNumber ?? "") :
      sortCol === "quantity" ? b.quantity :
      sortCol === "minQuantity" ? b.minQuantity :
      sortCol === "maxQuantity" ? b.maxQuantity :
      sortCol === "unitPrice" ? b.unitPrice :
      sortCol === "location" ? (b.location ?? "") :
      sortCol === "workshop" ? getWorkshopName(b) : "";
    const isNumber = typeof va === "number" && typeof vb === "number";
    const cmp = isNumber ? va - vb : String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  };

  const sorted = [...items].sort(comparator);
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const pageButtons = () => {
    const maxButtons = 7;
    let startPage = Math.max(1, page - 3);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    const buttons: JSX.Element[] = [];
    if (startPage > 1) {
      buttons.push(
        <Button key={1} variant="outline" size="sm" onClick={() => setPage(1)} data-testid="button-page-1">1</Button>
      );
      if (startPage > 2) buttons.push(<span key="left-ellipsis" className="px-1">…</span>);
    }
    for (let p = startPage; p <= endPage; p++) {
      buttons.push(
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          onClick={() => setPage(p)}
          data-testid={`button-page-${p}`}
        >
          {p}
        </Button>
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push(<span key="right-ellipsis" className="px-1">…</span>);
      buttons.push(
        <Button key={totalPages} variant="outline" size="sm" onClick={() => setPage(totalPages)} data-testid={`button-page-${totalPages}`}>{totalPages}</Button>
      );
    }
    return buttons;
  };

  const exportCsv = () => {
    const header = [
      "Numero de Parte",
      "SKU",
      "Nombre",
      "Tipo",
      "Categoria",
      "Prestado de",
      "Cantidad",
      "Minima",
      "Maxima",
      "Precio Unitario",
      "Ubicacion",
      "Taller",
    ];
    const rows = sorted.map((item) => [
      item.partNumber ?? "",
      item.sku ?? "",
      item.name,
      item.partCondition,
      getCategoryName(item),
      item.partCondition === "Prestado" ? (item.borrowedEconomicNumber ?? "") : "",
      item.quantity.toString(),
      item.minQuantity.toString(),
      item.maxQuantity.toString(),
      item.unitPrice.toFixed(2),
      item.location ?? "",
      getWorkshopName(item),
    ]);
    const escape = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const csv = [header.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
          <TableHead>
            <button className="inline-flex items-center gap-1" onClick={() => handleSort("partNumber")} data-testid="sort-partNumber">
              Número de Parte
              {sortCol === "partNumber" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
            </button>
          </TableHead>
          <TableHead>
            <button className="inline-flex items-center gap-1" onClick={() => handleSort("sku")} data-testid="sort-sku">
              SKU
              {sortCol === "sku" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
            </button>
          </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("name")} data-testid="sort-name">
                  Nombre
                  {sortCol === "name" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("partCondition")} data-testid="sort-partCondition">
                  Tipo
                  {sortCol === "partCondition" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                </button>
              </TableHead>
          <TableHead>
            <button className="inline-flex items-center gap-1" onClick={() => handleSort("category")} data-testid="sort-category">
              Categoría
              {sortCol === "category" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
            </button>
          </TableHead>
          <TableHead>
            <button className="inline-flex items-center gap-1" onClick={() => handleSort("borrowedEconomicNumber")} data-testid="sort-borrowedEconomicNumber">
              Prestado de
              {sortCol === "borrowedEconomicNumber" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
            </button>
          </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("quantity")} data-testid="sort-quantity">
                  Stock
                  {sortCol === "quantity" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                </button>
              </TableHead>
              <TableHead>
                <div className="inline-flex items-center gap-4">
                  <button className="inline-flex items-center gap-1" onClick={() => handleSort("minQuantity")} data-testid="sort-minQuantity">
                    Mín
                    {sortCol === "minQuantity" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                  <button className="inline-flex items-center gap-1" onClick={() => handleSort("maxQuantity")} data-testid="sort-maxQuantity">
                    Máx
                    {sortCol === "maxQuantity" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </div>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("unitPrice")} data-testid="sort-unitPrice">
                  Precio
                  {sortCol === "unitPrice" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("location")} data-testid="sort-location">
                  Ubicación
                  {sortCol === "location" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("workshop")} data-testid="sort-workshop">
                  Taller
                  {sortCol === "workshop" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                </button>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay artículos en el inventario
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => {
                const isLowStock = item.quantity <= item.minQuantity;
                return (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                <TableCell>
                  <span className="font-mono text-sm" data-testid={`text-part-${item.id}`}>
                    {item.partNumber || "N/A"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm" data-testid={`text-sku-${item.id}`}>
                    {item.sku || "N/A"}
                  </span>
                </TableCell>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-name-${item.id}`}>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`text-condition-${item.id}`}>
                        {item.partCondition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getCategoryName(item)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground" data-testid={`text-borrowed-${item.id}`}>
                        {item.partCondition === "Prestado" ? (item.borrowedEconomicNumber || "N/A") : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono ${isLowStock ? "text-red-600 dark:text-red-400" : ""}`}
                          data-testid={`text-stock-${item.id}`}
                        >
                          {item.quantity}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Mín: {item.minQuantity}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Máx: {item.maxQuantity}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">${item.unitPrice.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.location || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground" data-testid={`text-workshop-${item.id}`}>
                        {getWorkshopName(item)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingItem(item)}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {items.length === 0 ? 0 : start + 1}–{Math.min(items.length, start + pageSize)} de {items.length}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} data-testid="button-export-csv">
            Exportar CSV
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev">
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {pageButtons()}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="button-next">
            Siguiente
          </Button>
          <div className="ml-4 flex items-center gap-2">
            <span className="text-sm">Por página:</span>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-background"
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
              data-testid="select-page-size"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {editingItem && (
        <EditInventoryDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el artículo "{deletingItem?.name}" del inventario.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
