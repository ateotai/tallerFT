import { ReportChart } from "@/components/report-chart";
import { ReportFilters } from "@/components/report-filters";
import { ReportSummaryCard } from "@/components/report-summary-card";
import { ReportTable } from "@/components/report-table";
import {
  DollarSign,
  Wrench,
  TrendingUp,
  AlertCircle,
  Car,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useMemo, useState } from "react";
import type { CompanyConfiguration } from "@shared/schema";

export default function ReportsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({ period: "6months", reportType: "general", vehicleFilter: "all", dateFrom: "", dateTo: "" });

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("period", filters.period);
    if (filters.vehicleFilter) p.set("vehicle", filters.vehicleFilter);
    if (filters.period === "custom") {
      if (filters.dateFrom) p.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) p.set("dateTo", filters.dateTo);
    }
    return p.toString();
  }, [filters]);

  const { data: overview } = useQuery<any>({
    queryKey: ["/api/analytics/overview", queryString],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/analytics/overview?${queryString}`);
      return await res.json();
    },
  });

  const { data: configuration } = useQuery<CompanyConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const summaryTotalCost = overview ? `$${Number(overview.summary.totalCost).toLocaleString()}` : "";
  const summaryTotalServices = overview ? `${overview.summary.totalServices}` : "";
  const summaryAvgCost = overview ? `$${Number(overview.summary.avgCost).toLocaleString()}` : "";
  const summaryPending = overview ? `${overview.summary.pendingServices}` : "";

  const costData = overview?.charts?.monthlyCost ?? [];
  const monthlyTrendData = overview?.charts?.monthlyServices ?? [];
  const serviceTypeData = overview?.charts?.serviceType ?? [];
  const providerComparisonData = overview?.charts?.providers ?? [];
  const vehicleDetailsData = overview?.table ?? [];
  const vehicleDetailsView = useMemo(() => {
    const n = String((filters as any).topN || "all");
    if (n === "all") return vehicleDetailsData;
    const limit = Number(n);
    if (!Number.isFinite(limit) || limit <= 0) return vehicleDetailsData;
    return vehicleDetailsData.slice(0, limit);
  }, [vehicleDetailsData, filters]);

  const handleExport = (format: string) => {
    if (format === "excel") {
      const header = ["Vehículo","Placa","Servicios","Costo Total","Costo Promedio","Último Servicio"];
      const rows = vehicleDetailsView.map((r: any) => [r.vehicle, r.plate, String(r.services), String(r.totalCost), String(r.avgCost), r.lastService || ""]);
      const escape = (s: string) => '"' + s.replace(/"/g,'""') + '"';
      const sep = ";";
      const bom = "\ufeff";
      const csv = bom + [header.map(escape).join(sep), ...rows.map((r) => r.map(escape).join(sep))].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte_vehiculos.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Reporte Exportado", description: "El reporte ha sido exportado en CSV" });
      return;
    }
    if (format === "pdf") {
      const w = window.open("", "_blank");
      if (!w) return;
      const title = "Reporte de Vehículos";
      const periodLabel = filters.period === "custom" ? `${filters.dateFrom} a ${filters.dateTo}` : filters.period;
      const logoUrl = configuration?.logo || "";

      const mkBarSvg = (data: Array<{ name: string; value: number }>, opts?: { width?: number; height?: number; title?: string }) => {
        const width = opts?.width ?? 600;
        const height = opts?.height ?? 220;
        const marginLeft = 40;
        const marginBottom = 24;
        const innerW = width - marginLeft - 8;
        const innerH = height - marginBottom - 24;
        const maxVal = Math.max(1, ...data.map(d => Number(d.value) || 0));
        const barW = Math.max(6, Math.floor(innerW / Math.max(1, data.length * 1.5)));
        const gap = Math.max(6, Math.floor((innerW - barW * data.length) / Math.max(1, data.length - 1)));
        let x = marginLeft;
        const bars = data.map((d) => {
          const h = Math.round((Number(d.value) / maxVal) * innerH);
          const y = height - marginBottom - h;
          const rx = x;
          const labelX = rx + barW / 2;
          const el = `<rect x="${rx}" y="${y}" width="${barW}" height="${h}" fill="black" rx="4" />` +
            `<text x="${labelX}" y="${height - 6}" font-size="10" text-anchor="middle" fill="#666">${d.name}</text>`;
          x += barW + gap;
          return el;
        }).join("");
        const axis = `<line x1="${marginLeft}" y1="${height - marginBottom}" x2="${width - 8}" y2="${height - marginBottom}" stroke="#ccc" />` +
          `<line x1="${marginLeft}" y1="${height - marginBottom}" x2="${marginLeft}" y2="${height - marginBottom - innerH}" stroke="#ccc" />`;
        const titleText = opts?.title ? `<text x="${marginLeft}" y="14" font-size="12" font-weight="bold">${opts.title}</text>` : "";
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${titleText}${axis}${bars}</svg>`;
      };

      const mkLineSvg = (data: Array<{ name: string; value: number }>, opts?: { width?: number; height?: number; title?: string }) => {
        const width = opts?.width ?? 600;
        const height = opts?.height ?? 220;
        const marginLeft = 40;
        const marginBottom = 24;
        const innerW = width - marginLeft - 8;
        const innerH = height - marginBottom - 24;
        const maxVal = Math.max(1, ...data.map(d => Number(d.value) || 0));
        const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
        const points = data.map((d, i) => {
          const x = Math.round(marginLeft + i * step);
          const y = Math.round(height - marginBottom - (Number(d.value) / maxVal) * innerH);
          return `${x},${y}`;
        }).join(" ");
        const labels = data.map((d, i) => {
          const x = Math.round(marginLeft + i * step);
          return `<text x="${x}" y="${height - 6}" font-size="10" text-anchor="middle" fill="#666">${d.name}</text>`;
        }).join("");
        const axis = `<line x1="${marginLeft}" y1="${height - marginBottom}" x2="${width - 8}" y2="${height - marginBottom}" stroke="#ccc" />` +
          `<line x1="${marginLeft}" y1="${height - marginBottom}" x2="${marginLeft}" y2="${height - marginBottom - innerH}" stroke="#ccc" />`;
        const titleText = opts?.title ? `<text x="${marginLeft}" y="14" font-size="12" font-weight="bold">${opts.title}</text>` : "";
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${titleText}${axis}<polyline points="${points}" fill="none" stroke="black" stroke-width="2" />${labels}</svg>`;
      };

      const svgMonthlyCost = mkLineSvg(costData, { title: "Tendencia de Gastos Mensuales" });
      const svgMonthlyServices = mkBarSvg(monthlyTrendData, { title: "Servicios por Mes" });
      const svgServiceType = mkBarSvg(serviceTypeData, { title: "Distribución por Tipo de Servicio" });
      const svgProviders = mkBarSvg(providerComparisonData, { title: "Comparación de Costos por Proveedor" });
      const tableRows = vehicleDetailsView
        .map((r: any) => `
          <tr>
            <td class="cell">${r.vehicle}</td>
            <td class="cell mono">${r.plate}</td>
            <td class="cell center">${r.services}</td>
            <td class="cell mono right">$${Number(r.totalCost).toLocaleString()}</td>
            <td class="cell mono right">$${Number(r.avgCost).toLocaleString()}</td>
            <td class="cell muted">${r.lastService || ""}</td>
          </tr>
        `)
        .join("");
      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; }
              header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
              header img { height: 40px; object-fit: contain; }
              h1 { font-size: 20px; margin: 0 0 4px; }
              .sub { color: #666; font-size: 12px; margin-bottom: 16px; }
              .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
              .card { border: 1px solid #ddd; border-radius: 6px; padding: 8px; }
              .label { color: #666; font-size: 11px; }
              .value { font-weight: bold; font-size: 14px; }
              .charts { display: grid; grid-template-columns: 1fr; gap: 16px; margin: 16px 0; }
              table { width: 100%; border-collapse: collapse; }
              th { text-align: left; background: #f8f8f8; font-size: 12px; padding: 8px; border-bottom: 1px solid #ddd; }
              .head-center { text-align: center; }
              .head-right { text-align: right; }
              td.cell { font-size: 12px; padding: 8px; border-bottom: 1px solid #eee; }
              .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .center { text-align: center; }
              .right { text-align: right; }
              .muted { color: #666; }
            </style>
          </head>
          <body>
            <header>
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ""}
              <div>
                <h1>${title}</h1>
                <div class="sub">Periodo: ${periodLabel}</div>
              </div>
            </header>
            <div class="grid">
              <div class="card">
                <div class="label">Costo Total</div>
                <div class="value">$${Number(overview?.summary?.totalCost || 0).toLocaleString()}</div>
              </div>
              <div class="card">
                <div class="label">Total de Servicios</div>
                <div class="value">${overview?.summary?.totalServices || 0}</div>
              </div>
              <div class="card">
                <div class="label">Costo Promedio/Servicio</div>
                <div class="value">$${Number(overview?.summary?.avgCost || 0).toLocaleString()}</div>
              </div>
              <div class="card">
                <div class="label">Servicios Pendientes</div>
                <div class="value">${overview?.summary?.pendingServices || 0}</div>
              </div>
            </div>
            <div class="charts">
              ${svgMonthlyCost}
              ${svgMonthlyServices}
              ${svgServiceType}
              ${svgProviders}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Placa</th>
                  <th class="head-center">Servicios</th>
                  <th class="head-right">Costo Total</th>
                  <th class="head-right">Costo Promedio</th>
                  <th>Último Servicio</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <script>
              window.onload = () => { window.print(); };
            </script>
          </body>
        </html>
      `;
      w.document.open();
      w.document.write(html);
      w.document.close();
      toast({ title: "Reporte Exportado", description: "El reporte ha sido exportado en PDF" });
      return;
    }
    toast({ title: "Reporte Exportado", description: `El reporte ha sido exportado en formato ${format.toUpperCase()}` });
  };

  const handleFilterChange = (f: any) => {
    setFilters(f);
    toast({ title: "Filtros Aplicados", description: "Los datos del reporte han sido actualizados" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reportes y Análisis</h1>
        <p className="text-muted-foreground">
          Análisis completo de costos, servicios y rendimiento operativo
        </p>
      </div>

      <ReportFilters onFilterChange={handleFilterChange} onExport={handleExport} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportSummaryCard title="Costo Total del Período" value={summaryTotalCost} icon={<DollarSign className="h-5 w-5" />} />
        <ReportSummaryCard
          title="Total de Servicios"
          value={summaryTotalServices}
          icon={<Wrench className="h-5 w-5" />}
        />
        <ReportSummaryCard
          title="Costo Promedio/Servicio"
          value={summaryAvgCost}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <ReportSummaryCard
          title="Servicios Pendientes"
          value={summaryPending}
          icon={<AlertCircle className="h-5 w-5" />}
          description="Requieren atención"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="line"
          title="Tendencia de Gastos Mensuales"
          data={costData}
          dataKey="value"
          xKey="name"
        />
        <ReportChart
          type="bar"
          title="Servicios Realizados por Mes"
          data={monthlyTrendData}
          dataKey="value"
          xKey="name"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="pie"
          title="Distribución por Tipo de Servicio"
          data={serviceTypeData}
          dataKey="value"
          xKey="name"
        />
        <ReportChart
          type="bar"
          title="Comparación de Costos por Proveedor"
          data={providerComparisonData}
          dataKey="value"
          xKey="name"
        />
      </div>

      <ReportTable
        title="Detalle por Vehículo - Período Seleccionado"
        data={vehicleDetailsView}
      />

      {overview?.highlights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {overview.highlights.topVehicle && (
            <div className="p-6 border rounded-md space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Car className="h-4 w-4" />
                <span className="text-sm font-medium">Vehículo Más Costoso</span>
              </div>
              <p className="text-2xl font-bold">{overview.highlights.topVehicle.vehicle}</p>
              <p className="text-sm text-muted-foreground">${Number(overview.highlights.topVehicle.totalCost).toLocaleString()} en período</p>
            </div>
          )}
          {overview.highlights.mostFrequentService && (
            <div className="p-6 border rounded-md space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-medium">Servicio Más Frecuente</span>
              </div>
              <p className="text-2xl font-bold">{overview.highlights.mostFrequentService.name}</p>
              <p className="text-sm text-muted-foreground">{overview.highlights.mostFrequentService.count} servicios realizados</p>
            </div>
          )}
          {overview.highlights.mostActiveMonth && (
            <div className="p-6 border rounded-md space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Mes Más Activo</span>
              </div>
              <p className="text-2xl font-bold">{overview.highlights.mostActiveMonth.name}</p>
              <p className="text-sm text-muted-foreground">${Number(overview.highlights.mostActiveMonth.value).toLocaleString()} en gastos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
