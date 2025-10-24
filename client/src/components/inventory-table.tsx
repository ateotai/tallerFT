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
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { EditInventoryDialog } from "./edit-inventory-dialog";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Inventory } from "@shared/schema";

interface InventoryTableProps {
  items: Inventory[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingItem && !items.find(item => item.id === editingItem.id)) {
      setEditingItem(null);
    }
  }, [items, editingItem]);

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

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número de Parte</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay artículos en el inventario
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isLowStock = item.quantity <= item.minQuantity;
                return (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                    <TableCell>
                      <span className="font-mono text-sm" data-testid={`text-part-${item.id}`}>
                        {item.partNumber || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-name-${item.id}`}>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
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
                      <span className="font-mono">${item.unitPrice.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.location || "N/A"}
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
