import { useQuery } from "@tanstack/react-query";
import type { PurchaseQuote, Provider, PurchaseQuoteItem } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface PrintPurchaseQuoteDialogProps {
  quote: PurchaseQuote;
  providers: Provider[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintPurchaseQuoteDialog({ quote, providers, open, onOpenChange }: PrintPurchaseQuoteDialogProps) {
  const { data: items = [] } = useQuery<PurchaseQuoteItem[]>({
    queryKey: ["/api/purchase-quote-items", quote.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/purchase-quote-items/${quote.id}`);
      return await response.json() as PurchaseQuoteItem[];
    },
    enabled: open,
  });

  const provider = providers.find(p => p.id === quote.providerId);

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status: string) => {
    const statusMap = {
      draft: "Borrador",
      sent: "Enviada",
      accepted: "Aceptada",
      rejected: "Rechazada",
      expired: "Expirada",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa de Impresión</span>
            <Button
              onClick={handlePrint}
              size="sm"
              data-testid="button-print-now"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="print:p-8">
          <div className="space-y-6">
            <div className="text-center border-b-2 border-primary pb-4">
              <h1 className="text-3xl font-bold" data-testid="text-print-title">COTIZACIÓN DE COMPRA</h1>
              <p className="text-lg mt-2" data-testid="text-print-quote-number">
                N° {quote.quoteNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Proveedor</h3>
                <p className="font-medium" data-testid="text-print-provider-name">{provider?.name || "Desconocido"}</p>
                <p className="text-sm" data-testid="text-print-provider-phone">{provider?.phone || "N/A"}</p>
                <p className="text-sm" data-testid="text-print-provider-email">{provider?.email || "N/A"}</p>
                <p className="text-sm" data-testid="text-print-provider-address">{provider?.address || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Cotización</p>
                  <p className="font-medium" data-testid="text-print-quote-date">
                    {format(new Date(quote.quoteDate), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                  <p className="font-medium" data-testid="text-print-expiration-date">
                    {format(new Date(quote.expirationDate), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium" data-testid="text-print-status">
                    {getStatusLabel(quote.status)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Items Solicitados</h3>
              {items.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="border font-semibold text-foreground">Descripción</TableHead>
                        <TableHead className="border font-semibold text-foreground text-center w-[100px]">Cantidad</TableHead>
                        <TableHead className="border font-semibold text-foreground text-right w-[120px]">Precio Unit.</TableHead>
                        <TableHead className="border font-semibold text-foreground text-right w-[120px]">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="border" data-testid={`text-print-item-description-${index}`}>
                            {item.itemDescription}
                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                            )}
                          </TableCell>
                          <TableCell className="border text-center" data-testid={`text-print-quantity-${index}`}>
                            {item.quantity}
                          </TableCell>
                          <TableCell className="border text-right" data-testid={`text-print-unit-price-${index}`}>
                            ${item.unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-right font-medium" data-testid={`text-print-item-total-${index}`}>
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

            <div className="flex justify-end">
              <div className="w-64 space-y-2 border-t-2 border-primary pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold" data-testid="text-print-subtotal">
                    ${quote.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">IVA (16%):</span>
                  <span className="font-semibold" data-testid="text-print-tax">
                    ${quote.tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 border-primary pt-2">
                  <span className="font-bold text-lg">TOTAL:</span>
                  <span className="font-bold text-lg" data-testid="text-print-total">
                    ${quote.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Notas y Observaciones:</h3>
                <p className="text-sm" data-testid="text-print-notes">{quote.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-8 pt-12 mt-12 border-t">
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2">
                  <p className="font-semibold">Solicitado por</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2">
                  <p className="font-semibold">Autorizado por</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2">
                  <p className="font-semibold">Recibido por</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:p-8, .print\\:p-8 * {
              visibility: visible;
            }
            .print\\:p-8 {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
