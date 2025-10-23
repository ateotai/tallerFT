import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Minus, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  location: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número de Parte</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isLowStock = item.stock <= item.minStock;
            return (
              <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                <TableCell>
                  <span className="font-mono text-sm" data-testid={`text-part-${item.id}`}>{item.partNumber}</span>
                </TableCell>
                <TableCell>
                  <div className="font-medium" data-testid={`text-name-${item.id}`}>{item.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${isLowStock ? "text-red-600" : ""}`} data-testid={`text-stock-${item.id}`}>
                      {item.stock}
                    </span>
                    {isLowStock && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono">${item.price.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{item.location}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" data-testid={`button-add-${item.id}`}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-remove-${item.id}`}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
