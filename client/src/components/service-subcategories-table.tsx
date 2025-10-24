import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ServiceSubcategory, ServiceCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EditServiceSubcategoryDialog } from "./edit-service-subcategory-dialog";
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

interface ServiceSubcategoriesTableProps {
  subcategories: ServiceSubcategory[];
}

export function ServiceSubcategoriesTable({ subcategories }: ServiceSubcategoriesTableProps) {
  const { toast } = useToast();
  const [editingSubcategory, setEditingSubcategory] = useState<ServiceSubcategory | null>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<ServiceSubcategory | null>(null);

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || `ID ${categoryId}`;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/service-subcategories/${id}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Error al eliminar subcategoría");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-subcategories"] });
      toast({
        title: "Subcategoría eliminada",
        description: "La subcategoría ha sido eliminada exitosamente.",
      });
      setDeletingSubcategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la subcategoría",
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
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subcategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay subcategorías registradas
                </TableCell>
              </TableRow>
            ) : (
              subcategories.map((subcategory) => (
                <TableRow key={subcategory.id} data-testid={`row-subcategory-${subcategory.id}`}>
                  <TableCell className="font-medium">{subcategory.id}</TableCell>
                  <TableCell data-testid={`text-subcategory-name-${subcategory.id}`}>
                    {subcategory.name}
                  </TableCell>
                  <TableCell data-testid={`text-subcategory-category-${subcategory.id}`}>
                    {getCategoryName(subcategory.categoryId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subcategory.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={subcategory.active ? "default" : "secondary"}
                      data-testid={`badge-status-${subcategory.id}`}
                    >
                      {subcategory.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSubcategory(subcategory)}
                        data-testid={`button-edit-subcategory-${subcategory.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingSubcategory(subcategory)}
                        data-testid={`button-delete-subcategory-${subcategory.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingSubcategory && (
        <EditServiceSubcategoryDialog
          subcategory={editingSubcategory}
          open={!!editingSubcategory}
          onOpenChange={(open) => !open && setEditingSubcategory(null)}
        />
      )}

      <AlertDialog open={!!deletingSubcategory} onOpenChange={(open: boolean) => !open && setDeletingSubcategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la subcategoría "{deletingSubcategory?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSubcategory && deleteMutation.mutate(deletingSubcategory.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
