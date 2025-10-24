import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProvidersTable } from "@/components/providers-table";
import { AddProviderDialog } from "@/components/add-provider-dialog";
import { ProviderTypesTable } from "@/components/provider-types-table";
import { AddProviderTypeDialog } from "@/components/add-provider-type-dialog";
import type { Provider, ProviderType } from "@shared/schema";

export default function ProvidersPage() {
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
  });

  const { data: providerTypes = [], isLoading: isLoadingTypes } = useQuery<ProviderType[]>({
    queryKey: ["/api/provider-types"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Proveedores y Talleres</h1>
        <p className="text-muted-foreground">
          Directorio completo de proveedores de servicio
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers" data-testid="tab-providers">
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-provider-types">
            Tipos de Proveedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Proveedores Registrados</h2>
              <p className="text-muted-foreground mt-1">
                Administra los proveedores y talleres de servicio
              </p>
            </div>
            <AddProviderDialog />
          </div>

          {isLoadingProviders ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando proveedores...
            </div>
          ) : (
            <ProvidersTable providers={providers} />
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Tipos de Proveedores</h2>
              <p className="text-muted-foreground mt-1">
                Administra las categorías de servicios de proveedores
              </p>
            </div>
            <AddProviderTypeDialog />
          </div>

          {isLoadingTypes ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando tipos...
            </div>
          ) : (
            <ProviderTypesTable providerTypes={providerTypes} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
