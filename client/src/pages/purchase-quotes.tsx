import { useQuery } from "@tanstack/react-query";
import type { PurchaseQuote, Provider } from "@shared/schema";
import { PurchaseQuotesTable } from "@/components/purchase-quotes-table";

export default function PurchaseQuotesPage() {
  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery<PurchaseQuote[]>({
    queryKey: ["/api/purchase-quotes"],
  });

  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
  });

  const isLoading = isLoadingQuotes || isLoadingProviders;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cotizaciones de Compra</h1>
        <p className="text-muted-foreground">
          Gestiona solicitudes de cotización a proveedores
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando cotizaciones...
        </div>
      ) : (
        <PurchaseQuotesTable quotes={quotes} providers={providers} />
      )}
    </div>
  );
}
