import { useQuery } from "@tanstack/react-query";
import { ProvidersTable } from "@/components/providers-table";
import { AddProviderDialog } from "@/components/add-provider-dialog";
import type { Provider } from "@shared/schema";

export default function ProvidersPage() {
  const { data: providers = [], isLoading } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Proveedores y Talleres</h1>
        <p className="text-muted-foreground">
          Directorio completo de proveedores de servicio
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Proveedores Registrados</h2>
          <p className="text-muted-foreground mt-1">
            Administra los proveedores y talleres de servicio
          </p>
        </div>
        <AddProviderDialog />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando proveedores...
        </div>
      ) : (
        <ProvidersTable providers={providers} />
      )}
    </div>
  );
}
