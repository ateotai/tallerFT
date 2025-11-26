import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";

interface ReportFiltersProps {
  onFilterChange?: (filters: any) => void;
  onExport?: (format: string) => void;
}

export function ReportFilters({ onFilterChange, onExport }: ReportFiltersProps) {
  const [period, setPeriod] = useState("6months");
  const [reportType, setReportType] = useState("general");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [topN, setTopN] = useState("all");

  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });

  const handleApplyFilters = () => {
    onFilterChange?.({
      period,
      reportType,
      vehicleFilter,
      dateFrom,
      dateTo,
      topN,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Configuración del Reporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType" data-testid="select-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="costos">Análisis de Costos</SelectItem>
                <SelectItem value="servicios">Historial de Servicios</SelectItem>
                <SelectItem value="vehiculos">Por Vehículo</SelectItem>
                <SelectItem value="proveedores">Por Proveedor</SelectItem>
                <SelectItem value="inventario">Inventario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period" data-testid="select-period">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1week">Última Semana</SelectItem>
                <SelectItem value="1month">Último Mes</SelectItem>
                <SelectItem value="3months">3 Meses</SelectItem>
                <SelectItem value="6months">6 Meses</SelectItem>
                <SelectItem value="1year">1 Año</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehículo</Label>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger id="vehicle" data-testid="select-vehicle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {vehicles
                  .filter((v) => (v.plate || "").trim().length > 0)
                  .map((v) => (
                    <SelectItem key={v.id} value={(v.plate || "").trim()}>
                      {v.brand} {v.model} ({v.plate})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topn">Top N (por costo)</Label>
            <Select value={topN} onValueChange={setTopN}>
              <SelectTrigger id="topn" data-testid="select-topn">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === "custom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Fecha Inicio</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Fecha Fin</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleApplyFilters} data-testid="button-apply-filters">
            Aplicar Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport?.("pdf")}
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport?.("excel")}
            data-testid="button-export-excel"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
