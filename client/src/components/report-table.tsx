import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportTableProps {
  title: string;
  data: {
    id: string;
    vehicle: string;
    plate: string;
    services: number;
    totalCost: number;
    avgCost: number;
    lastService: string;
  }[];
}

export function ReportTable({ title, data }: ReportTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-right">Costo Total</TableHead>
                <TableHead className="text-right">Costo Promedio</TableHead>
                <TableHead>Último Servicio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.vehicle}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{row.plate}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{row.services}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${row.totalCost.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${row.avgCost.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.lastService}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
