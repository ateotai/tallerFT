import { ReportChart } from "@/components/report-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const [period, setPeriod] = useState("6months");

  //todo: remove mock functionality
  const costData = [
    { name: "Ene", value: 12500 },
    { name: "Feb", value: 15300 },
    { name: "Mar", value: 18200 },
    { name: "Abr", value: 14800 },
    { name: "May", value: 21400 },
    { name: "Jun", value: 19600 },
  ];

  const serviceTypeData = [
    { name: "Mantenimiento Preventivo", value: 45 },
    { name: "Reparaciones", value: 28 },
    { name: "Cambio de Aceite", value: 68 },
    { name: "Neumáticos", value: 22 },
    { name: "Frenos", value: 31 },
  ];

  const vehicleCostData = [
    { name: "Ford Transit", value: 8500 },
    { name: "Toyota Hilux", value: 12300 },
    { name: "Chevrolet Suburban", value: 6200 },
    { name: "Honda Accord", value: 4800 },
    { name: "Nissan Frontier", value: 9100 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reportes y Análisis</h1>
          <p className="text-muted-foreground">
            Estadísticas y análisis de costos operativos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]" data-testid="select-period">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último Mes</SelectItem>
              <SelectItem value="3months">3 Meses</SelectItem>
              <SelectItem value="6months">6 Meses</SelectItem>
              <SelectItem value="1year">1 Año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <ReportChart
            type="line"
            title="Gastos Mensuales en Mantenimiento"
            data={costData}
            dataKey="value"
            xKey="name"
          />
        </div>

        <ReportChart
          type="pie"
          title="Servicios por Tipo"
          data={serviceTypeData}
          dataKey="value"
          xKey="name"
        />

        <ReportChart
          type="bar"
          title="Costos por Vehículo (Últimos 6 meses)"
          data={vehicleCostData}
          dataKey="value"
          xKey="name"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Ejecutivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Costo Total (6 meses)</p>
              <p className="text-3xl font-bold mt-1" data-testid="text-total-cost">$101,800</p>
              <p className="text-xs text-red-600 mt-1">+12% vs período anterior</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo Promedio por Vehículo</p>
              <p className="text-3xl font-bold mt-1" data-testid="text-avg-cost">$2,166</p>
              <p className="text-xs text-green-600 mt-1">-3% vs período anterior</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Servicios</p>
              <p className="text-3xl font-bold mt-1" data-testid="text-total-services">194</p>
              <p className="text-xs text-green-600 mt-1">+8% vs período anterior</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
