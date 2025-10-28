import { useQuery } from "@tanstack/react-query";
import type { PurchaseQuote, Provider, PurchaseQuoteItem } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface ViewPurchaseQuoteDialogProps {
  quote: PurchaseQuote;
  providers: Provider[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewPurchaseQuoteDialog({ quote, providers, open, onOpenChange }: ViewPurchaseQuoteDialogProps) {
  const { data: items = [] } = useQuery<PurchaseQuoteItem[]>({
    queryKey: ["/api/purchase-quote-items", quote.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/purchase-quote-items/${quote.id}`);
      return await response.json() as PurchaseQuoteItem[];
    },
    enabled: open,
  });

  const provider = providers.find(p => p.id === quote.providerId);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Borrador", variant: "secondary" as const },
      sent: { label: "Enviada", variant: "default" as const },
      accepted: { label: "Aceptada", variant: "default" as const },
      rejected: { label: "Rechazada", variant: "destructive" as const },
      expired: { label: "Expirada", variant: "secondary" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cotización #{quote.quoteNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Proveedor</p>
              <p className="font-medium" data-testid="text-provider-name">
                {provider?.name || "Desconocido"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div data-testid="badge-status">
                {getStatusBadge(quote.status)}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Cotización</p>
              <p className="font-medium" data-testid="text-quote-date">
                {format(new Date(quote.quoteDate), "dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
              <p className="font-medium" data-testid="text-expiration-date">
                {format(new Date(quote.expirationDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Items Solicitados</h3>
            {items.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-[100px]">Cantidad</TableHead>
                      <TableHead className="w-[120px] text-right">Precio Unit.</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell data-testid={`text-item-description-${item.id}`}>
                          {item.itemDescription}
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-unit-price-${item.id}`}>
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium" data-testid={`text-item-total-${item.id}`}>
                          ${item.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground border rounded-md">
                No hay items en esta cotización
              </p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-md">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-lg font-semibold" data-testid="text-subtotal">
                ${quote.subtotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IVA (16%)</p>
              <p className="text-lg font-semibold" data-testid="text-tax">
                ${quote.tax.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold" data-testid="text-total">
                ${quote.total.toFixed(2)}
              </p>
            </div>
          </div>

          {quote.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Notas</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-notes">
                  {quote.notes}
                </p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Contacto del Proveedor</p>
              <p className="font-medium text-foreground">{provider?.phone || "N/A"}</p>
              <p className="font-medium text-foreground">{provider?.email || "N/A"}</p>
            </div>
            <div>
              <p>Dirección</p>
              <p className="font-medium text-foreground">{provider?.address || "N/A"}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
