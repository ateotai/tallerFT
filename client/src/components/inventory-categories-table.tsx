import { useQuery } from "@tanstack/react-query";
import type { InventoryCategory } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { EditInventoryCategoryDialog } from "./edit-inventory-category-dialog";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export function InventoryCategoriesTable() {
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<InventoryCategory | null>(null);

  const { data: categories, isLoading } = useQuery<InventoryCategory[]>({
    queryKey: ["/api/inventory-categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-categories"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se eliminó exitosamente",
      });
      setDeletingCategory(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div data-testid="loading-categories">Cargando categorías...</div>;
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="no-categories">
        No hay categorías registradas
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border" data-testid="categories-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                <TableCell className="font-medium" data-testid={`text-name-${category.id}`}>
                  {category.name}
                </TableCell>
                <TableCell data-testid={`text-description-${category.id}`}>
                  {category.description}
                </TableCell>
                <TableCell data-testid={`text-created-${category.id}`}>
                  {format(category.createdAt, "dd/MM/yyyy", { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingCategory(category)}
                      data-testid={`button-edit-${category.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingCategory(category)}
                      data-testid={`button-delete-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingCategory && (
        <EditInventoryCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open: boolean) => !open && setEditingCategory(null)}
        />
      )}

      <AlertDialog open={!!deletingCategory} onOpenChange={(open: boolean) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría "{deletingCategory?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
