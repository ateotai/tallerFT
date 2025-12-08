import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PurchaseQuote, Provider } from "@shared/schema";
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
import { Plus, Eye, Printer, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AddPurchaseQuoteDialog } from "./add-purchase-quote-dialog";
import { EditPurchaseQuoteDialog } from "./edit-purchase-quote-dialog";
import { ViewPurchaseQuoteDialog } from "./view-purchase-quote-dialog";
import { PrintPurchaseQuoteDialog } from "./print-purchase-quote-dialog";
import { format } from "date-fns";

interface PurchaseQuotesTableProps {
  quotes: PurchaseQuote[];
  providers: Provider[];
}

export function PurchaseQuotesTable({ quotes, providers }: PurchaseQuotesTableProps) {
  const [editingQuote, setEditingQuote] = useState<PurchaseQuote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<PurchaseQuote | null>(null);
  const [printingQuote, setPrintingQuote] = useState<PurchaseQuote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<PurchaseQuote | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingQuote && !quotes.find(q => q.id === editingQuote.id)) {
      setEditingQuote(null);
    }
  }, [quotes, editingQuote]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/purchase-quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-quotes"] });
      toast({
        title: "Cotización eliminada",
        description: "La cotización ha sido eliminada exitosamente",
      });
      setDeletingQuote(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cotización",
        variant: "destructive",
      });
    },
  });

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
      <Badge variant={statusInfo.variant} data-testid={`badge-status-${status}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getProviderName = (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || "Desconocido";
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Cotizaciones Registradas</h2>
          <p className="text-muted-foreground mt-1">
            Administra las cotizaciones de compra a proveedores
          </p>
        </div>
        <AddPurchaseQuoteDialog providers={providers} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">N° Cotización</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay cotizaciones registradas
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                  <TableCell className="font-medium" data-testid={`text-quote-number-${quote.id}`}>
                    {quote.quoteNumber}
                  </TableCell>
                  <TableCell data-testid={`text-provider-${quote.id}`}>
                    {getProviderName(quote.providerId)}
                  </TableCell>
                  <TableCell data-testid={`text-quote-date-${quote.id}`}>
                    {format(new Date(quote.quoteDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell data-testid={`text-expiration-date-${quote.id}`}>
                    {format(new Date(quote.expirationDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(quote.status)}
                  </TableCell>
                  <TableCell className="text-right font-medium" data-testid={`text-total-${quote.id}`}>
                    ${quote.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewingQuote(quote)}
                        data-testid={`button-view-${quote.id}`}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPrintingQuote(quote)}
                        data-testid={`button-print-${quote.id}`}
                        title="Imprimir"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingQuote(quote)}
                        data-testid={`button-edit-${quote.id}`}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletingQuote(quote)}
                        data-testid={`button-delete-${quote.id}`}
                        title="Eliminar"
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

      {editingQuote && (
        <EditPurchaseQuoteDialog
          quote={editingQuote}
          providers={providers}
          open={!!editingQuote}
          onOpenChange={(open: boolean) => !open && setEditingQuote(null)}
        />
      )}

      {viewingQuote && (
        <ViewPurchaseQuoteDialog
          quote={viewingQuote}
          providers={providers}
          open={!!viewingQuote}
          onOpenChange={(open: boolean) => !open && setViewingQuote(null)}
        />
      )}

      {printingQuote && (
        <PrintPurchaseQuoteDialog
          quote={printingQuote}
          providers={providers}
          open={!!printingQuote}
          onOpenChange={(open: boolean) => !open && setPrintingQuote(null)}
        />
      )}

      <AlertDialog open={!!deletingQuote} onOpenChange={(open: boolean) => !open && setDeletingQuote(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cotización {deletingQuote?.quoteNumber} y todos sus items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel data-testid="button-cancel-delete" className="w-full sm:w-auto h-9 px-4 text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuote && deleteMutation.mutate(deletingQuote.id)}
              data-testid="button-confirm-delete"
              className="w-full sm:w-auto h-9 px-4 text-sm bg-destructive text-destructive-foreground hover-elevate active-elevate-2"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
