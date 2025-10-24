import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCategoriesTable } from "@/components/service-categories-table";
import { AddServiceCategoryDialog } from "@/components/add-service-category-dialog";
import { ServiceSubcategoriesTable } from "@/components/service-subcategories-table";
import { AddServiceSubcategoryDialog } from "@/components/add-service-subcategory-dialog";
import type { ServiceCategory, ServiceSubcategory } from "@shared/schema";

export default function CategoriesPage() {
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const { data: subcategories = [], isLoading: isLoadingSubcategories } = useQuery<ServiceSubcategory[]>({
    queryKey: ["/api/service-subcategories"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Categorías de Servicio</h1>
        <p className="text-muted-foreground">
          Administra las categorías y subcategorías de mantenimiento vehicular
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories" data-testid="tab-categories">Categorías</TabsTrigger>
          <TabsTrigger value="subcategories" data-testid="tab-subcategories">Subcategorías</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Categorías de Servicio</h2>
              <p className="text-muted-foreground mt-1">
                Administra las categorías principales de mantenimiento
              </p>
            </div>
            <AddServiceCategoryDialog />
          </div>

          {isLoadingCategories ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando categorías...
            </div>
          ) : (
            <ServiceCategoriesTable categories={categories} />
          )}
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Subcategorías de Servicio</h2>
              <p className="text-muted-foreground mt-1">
                Administra las subcategorías específicas de cada tipo de servicio
              </p>
            </div>
            <AddServiceSubcategoryDialog />
          </div>

          {isLoadingSubcategories ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando subcategorías...
            </div>
          ) : (
            <ServiceSubcategoriesTable subcategories={subcategories} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
