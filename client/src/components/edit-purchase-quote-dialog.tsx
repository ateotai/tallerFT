import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { PurchaseQuote, Provider, InsertPurchaseQuote, InsertPurchaseQuoteItem, PurchaseQuoteItem } from "@shared/schema";
import { insertPurchaseQuoteSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const quoteFormSchema = z.object({
  quoteNumber: z.string().min(1, "El número de cotización es requerido"),
  providerId: z.number().min(1, "Debe seleccionar un proveedor"),
  quoteDate: z.string().min(1, "La fecha es requerida"),
  expirationDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  status: z.string().min(1, "El estado es requerido"),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemDescription: z.string().min(1, "La descripción es requerida"),
    quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
    unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    notes: z.string().optional(),
  })).min(1, "Debe agregar al menos un item"),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface EditPurchaseQuoteDialogProps {
  quote: PurchaseQuote;
  providers: Provider[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPurchaseQuoteDialog({ quote, providers, open, onOpenChange }: EditPurchaseQuoteDialogProps) {
  const { toast } = useToast();
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  const { data: existingItems = [] } = useQuery<PurchaseQuoteItem[]>({
    queryKey: ["/api/purchase-quote-items", quote.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/purchase-quote-items/${quote.id}`);
      return await response.json() as PurchaseQuoteItem[];
    },
    enabled: open,
  });

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      quoteNumber: quote.quoteNumber,
      providerId: quote.providerId,
      quoteDate: new Date(quote.quoteDate).toISOString().split('T')[0],
      expirationDate: new Date(quote.expirationDate).toISOString().split('T')[0],
      status: quote.status,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      notes: quote.notes || "",
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (open && existingItems.length > 0 && isLoadingItems) {
      const mappedItems = existingItems.map(item => ({
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes || "",
      }));
      replace(mappedItems);
      setIsLoadingItems(false);
    }
  }, [open, existingItems, isLoadingItems, replace]);

  useEffect(() => {
    if (!open) {
      setIsLoadingItems(true);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      const quoteData: Partial<InsertPurchaseQuote> = {
        quoteNumber: data.quoteNumber,
        providerId: data.providerId,
        quoteDate: new Date(data.quoteDate + 'T00:00:00Z'),
        expirationDate: new Date(data.expirationDate + 'T00:00:00Z'),
        status: data.status,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        notes: data.notes,
      };

      await apiRequest("PUT", `/api/purchase-quotes/${quote.id}`, quoteData);

      await apiRequest("DELETE", `/api/purchase-quote-items/by-quote/${quote.id}`);

      for (const item of data.items) {
        const itemData: InsertPurchaseQuoteItem = {
          quoteId: quote.id,
          itemDescription: item.itemDescription,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          notes: item.notes || null,
        };
        await apiRequest("POST", "/api/purchase-quote-items", itemData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-quote-items", quote.id] });
      toast({
        title: "Cotización actualizada",
        description: "Los cambios han sido guardados exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cotización",
        variant: "destructive",
      });
    },
  });

  const calculateTotals = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    form.setValue("subtotal", Number(subtotal.toFixed(2)));
    form.setValue("tax", Number(tax.toFixed(2)));
    form.setValue("total", Number(total.toFixed(2)));
  };

  const addItem = () => {
    append({
      itemDescription: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    });
  };

  const onSubmit = (data: QuoteFormValues) => {
    if (data.items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un item a la cotización",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cotización</DialogTitle>
          <DialogDescription>
            Modifica la información de la cotización {quote.quoteNumber}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quoteNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cotización</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-quote-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.filter(p => p.status === "active").map((provider) => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quoteDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Cotización</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-quote-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-expiration-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="sent">Enviada</SelectItem>
                        <SelectItem value="accepted">Aceptada</SelectItem>
                        <SelectItem value="rejected">Rechazada</SelectItem>
                        <SelectItem value="expired">Expirada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Items de Cotización</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>

              {fields.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="w-[100px]">Cantidad</TableHead>
                        <TableHead className="w-[120px]">Precio Unit.</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const quantity = form.watch(`items.${index}.quantity`) || 0;
                        const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
                        const itemTotal = quantity * unitPrice;

                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.itemDescription`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Descripción del item"
                                        data-testid={`input-item-description-${index}`}
                                        onBlur={() => calculateTotals()}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(Number(e.target.value));
                                          calculateTotals();
                                        }}
                                        data-testid={`input-quantity-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(Number(e.target.value));
                                          calculateTotals();
                                        }}
                                        data-testid={`input-unit-price-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ${itemTotal.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  remove(index);
                                  calculateTotals();
                                }}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  No hay items agregados. Haz clic en "Agregar Item" para comenzar.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-lg font-semibold" data-testid="text-subtotal">
                  ${form.watch("subtotal")?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IVA (16%)</p>
                <p className="text-lg font-semibold" data-testid="text-tax">
                  ${form.watch("tax")?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold" data-testid="text-total">
                  ${form.watch("total")?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Observaciones adicionales..."
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
