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

export default function ReportsPage() {
  const { toast } = useToast();

  const handleExport = (format: string) => {
    //todo: remove mock functionality
    console.log(`Exporting report as ${format}`);
    toast({
      title: "Reporte Exportado",
      description: `El reporte ha sido exportado en formato ${format.toUpperCase()}`,
    });
  };

  const handleFilterChange = (filters: any) => {
    //todo: remove mock functionality
    console.log("Filters applied:", filters);
    toast({
      title: "Filtros Aplicados",
      description: "Los datos del reporte han sido actualizados",
    });
  };

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
    { name: "Preventivo", value: 45 },
    { name: "Correctivo", value: 28 },
    { name: "Aceite", value: 68 },
    { name: "Neumáticos", value: 22 },
    { name: "Frenos", value: 31 },
  ];

  const providerComparisonData = [
    { name: "AutoService Pro", value: 42350 },
    { name: "Taller Central", value: 35200 },
    { name: "Taller Rápido", value: 18900 },
    { name: "Diesel Experts", value: 28450 },
  ];

  const monthlyTrendData = [
    { name: "Ene", value: 145 },
    { name: "Feb", value: 158 },
    { name: "Mar", value: 172 },
    { name: "Abr", value: 149 },
    { name: "May", value: 189 },
    { name: "Jun", value: 176 },
  ];

  const vehicleDetailsData = [
    {
      id: "1",
      vehicle: "Ford Transit",
      plate: "ABC-1234",
      services: 18,
      totalCost: 28500,
      avgCost: 1583,
      lastService: "15 Oct 2024",
    },
    {
      id: "2",
      vehicle: "Toyota Hilux",
      plate: "DEF-5678",
      services: 22,
      totalCost: 35200,
      avgCost: 1600,
      lastService: "20 Oct 2024",
    },
    {
      id: "3",
      vehicle: "Chevrolet Suburban",
      plate: "GHI-9012",
      services: 12,
      totalCost: 18900,
      avgCost: 1575,
      lastService: "10 Oct 2024",
    },
    {
      id: "4",
      vehicle: "Honda Accord",
      plate: "JKL-3456",
      services: 15,
      totalCost: 19200,
      avgCost: 1280,
      lastService: "25 Oct 2024",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reportes y Análisis</h1>
        <p className="text-muted-foreground">
          Análisis completo de costos, servicios y rendimiento operativo
        </p>
      </div>

      <ReportFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportSummaryCard
          title="Costo Total del Período"
          value="$101,800"
          change={{ value: 12, trend: "up" }}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <ReportSummaryCard
          title="Total de Servicios"
          value="194"
          change={{ value: 8, trend: "up" }}
          icon={<Wrench className="h-5 w-5" />}
        />
        <ReportSummaryCard
          title="Costo Promedio/Servicio"
          value="$525"
          change={{ value: -3, trend: "down" }}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <ReportSummaryCard
          title="Servicios Pendientes"
          value="12"
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
        data={vehicleDetailsData}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-md space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Car className="h-4 w-4" />
            <span className="text-sm font-medium">Vehículo Más Costoso</span>
          </div>
          <p className="text-2xl font-bold">Toyota Hilux</p>
          <p className="text-sm text-muted-foreground">$35,200 en 6 meses</p>
        </div>
        <div className="p-6 border rounded-md space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Wrench className="h-4 w-4" />
            <span className="text-sm font-medium">Servicio Más Frecuente</span>
          </div>
          <p className="text-2xl font-bold">Cambio de Aceite</p>
          <p className="text-sm text-muted-foreground">68 servicios realizados</p>
        </div>
        <div className="p-6 border rounded-md space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Mes Más Activo</span>
          </div>
          <p className="text-2xl font-bold">Mayo 2024</p>
          <p className="text-sm text-muted-foreground">$21,400 en gastos</p>
        </div>
      </div>
    </div>
  );
}
