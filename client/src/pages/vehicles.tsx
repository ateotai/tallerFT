import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard-stats";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleTable } from "@/components/vehicle-table";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { VehicleTypesTable } from "@/components/vehicle-types-table";
import VehicleBranchHistoryTable from "@/components/vehicle-branch-history-table";
import { AddVehicleTypeDialog } from "@/components/add-vehicle-type-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Grid, List, Upload, Download, Printer } from "lucide-react";
import type {
  Vehicle,
  VehicleType,
  Report,
  Diagnostic,
  WorkOrder,
  WorkOrderTask,
  WorkOrderMaterial,
  Service,
  CompanyConfiguration,
  Client,
  ClientBranch,
} from "@shared/schema";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import type { User } from "@shared/schema";

export default function VehiclesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [economicNumber, setEconomicNumber] = useState("");
  const [vin, setVin] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("vehicles");
  const [groupBy, setGroupBy] = useState<"none" | "client" | "type" | "branch">("none");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [location, navigate] = useLocation();
  // Capturar el query string actual para que el efecto reaccione cuando cambie
  const urlSearch = typeof window !== "undefined" ? window.location.search : "";

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: vehicleTypes = [], isLoading: isLoadingTypes } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  const { data: configuration } = useQuery<CompanyConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: branches = [] } = useQuery<ClientBranch[]>({ queryKey: ["/api/client-branches"] });

  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const isAdmin = ((currentUser?.role || "").toLowerCase() === "admin" || (currentUser?.role || "").toLowerCase() === "administrador");
  const [importSummary, setImportSummary] = useState<null | { created: number; updated: number; errors: Array<{ row: number; error: string }> }>(null);
  const [importOpen, setImportOpen] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/vehicles/import", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al importar");
      }
      return await res.json();
    },
    onSuccess: async (summary) => {
      setImportSummary(summary);
      setImportOpen(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/client-branches"] });
    },
    onError: (error: Error) => {
      console.error("Error de importación:", error);
      alert("Error de importación: " + error.message);
    },
  });

  const downloadTemplate = async () => {
    const res = await fetch("/api/vehicles/template", { credentials: "include" });
    if (!res.ok) {
      alert("Error: No se pudo descargar la plantilla");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_vehiculos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = [
      "Placa","Marca","Modelo","Año","VIN","Número económico","Color","Kilometraje","Combustible","Estatus","Cliente","Sucursal","Tipo de vehículo","Área asignada","Serie","Número de motor","Valor vehicular","Número de póliza","Aseguradora","Fecha inicio póliza","Fecha vencimiento póliza"
    ];
    const formatDate = (d: unknown): string => {
      if (!d) return "";
      try {
        const dt = typeof d === "string" ? new Date(d) : (d as Date);
        if (!dt || isNaN((dt as Date).getTime())) return "";
        return (dt as Date).toISOString().slice(0, 10);
      } catch {
        return "";
      }
    };
    const rows = filteredVehicles.map((v) => [
      v.plate,
      v.brand,
      v.model,
      String(v.year),
      v.vin ?? "",
      v.economicNumber ?? "",
      v.color ?? "",
      String(v.mileage),
      v.fuelType,
      v.status,
      v.clientId ? (clients.find(c => c.id === v.clientId)?.name ?? "") : "",
      v.branchId ? (branches.find(b => b.id === v.branchId)?.name ?? "") : "",
      v.vehicleTypeId ? (vehicleTypes.find(t => t.id === v.vehicleTypeId)?.name ?? "") : "",
      v.assignedArea ?? "",
      v.serie ?? "",
      v.engineNumber ?? "",
      v.vehicleValue != null ? String(v.vehicleValue) : "",
      v.policyNumber ?? "",
      v.insurer ?? "",
      formatDate(v.policyStart ?? null),
      formatDate(v.policyEnd ?? null),
    ]);
    const escape = (s: string) => '"' + s.replace(/"/g,'""') + '"';
    const sep = ";";
    const bom = "\ufeff";
    const csv = bom + [header.map(escape).join(sep), ...rows.map(r => r.map(escape).join(sep))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehiculos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  type VehicleHistoryResponse = {
    vehicle: Vehicle;
    reports: Report[];
    diagnostics: Diagnostic[];
    workOrders: Array<
      WorkOrder & {
        tasks: WorkOrderTask[];
        materials: WorkOrderMaterial[];
      }
    >;
    services: Service[];
  };

  const {
    data: history,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<VehicleHistoryResponse>({
    queryKey: [
      "/api/vehicle-history",
      economicNumber.trim(),
      vin.trim(),
      startDate.trim(),
      endDate.trim(),
      searchEnabled,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (economicNumber.trim()) params.set("economicNumber", economicNumber.trim());
      if (vin.trim()) params.set("vin", vin.trim());
      if (startDate.trim()) params.set("startDate", startDate.trim());
      if (endDate.trim()) params.set("endDate", endDate.trim());
      const res = await fetch(`/api/vehicle-history?${params.toString()}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al obtener historial");
      }
      return res.json();
    },
    enabled: searchEnabled && (!!economicNumber.trim() || !!vin.trim()),
  });

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.economicNumber
        ? String(v.economicNumber).toLowerCase().includes(searchQuery.toLowerCase())
        : false) ||
      (v.vin ? v.vin.toLowerCase().includes(searchQuery.toLowerCase()) : false)
  );

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageVehicles = filteredVehicles.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, groupBy]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(urlSearch || "");
      const tab = params.get("tab");
      const econ = params.get("economicNumber") || "";
      const v = params.get("vin") || "";
      const sd = params.get("startDate") || "";
      const ed = params.get("endDate") || "";
      if (tab) setActiveTab(tab);
      if (econ) setEconomicNumber(econ);
      if (v) setVin(v);
      if (sd) setStartDate(sd);
      if (ed) setEndDate(ed);
      if (tab === "history" && (econ.trim() || v.trim())) {
        // Habilitar búsqueda; dejar que react-query dispare basado en 'enabled'
        setSearchEnabled(true);
      }
    } catch (e) {
      // Ignorar errores de parseo
    }
  }, [location, urlSearch]);

  // Impresión: helpers para imprimir todo el historial o un solo reporte
  const handlePrintAll = () => {
    const root = document.getElementById("vehicle-history-content");
    if (!root) {
      window.print();
      return;
    }
    root.classList.add("vehicle-print-content");
    const cleanup = () => {
      root.classList.remove("vehicle-print-content");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const handlePrintReport = (reportId: number) => {
    const el = document.getElementById(`report-${reportId}`);
    if (!el) {
      window.print();
      return;
    }
    el.classList.add("vehicle-print-content");
    const cleanup = () => {
      el.classList.remove("vehicle-print-content");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Vehículos</h1>
        <p className="text-muted-foreground">
          Administra toda la información de tu flotilla vehicular
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="no-print">
          <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehículos</TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-vehicle-types">Tipos de Vehículos</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-vehicle-history">Historial</TabsTrigger>
          <TabsTrigger value="transfer-history" data-testid="tab-transfer-history">Transferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          <DashboardStats />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número económico, VIN, placa, marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-vehicles"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger className="w-48" data-testid="select-group-by">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin agrupación</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="type">Tipo de vehículo</SelectItem>
                  <SelectItem value="branch">Sucursal</SelectItem>
                </SelectContent>
              </Select>
              <AddVehicleDialog />
              {isAdmin && (
                <div className="flex items-center gap-2 ml-2">
                  <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-vehicles-template">
                    <Download className="h-4 w-4 mr-2" /> Plantilla
                  </Button>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) importMutation.mutate(f);
                        e.currentTarget.value = "";
                      }}
                      data-testid="input-import-vehicles-file"
                    />
                    <Button variant="default" size="sm" disabled={importMutation.isPending} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" /> {importMutation.isPending ? "Importando..." : "Importar CSV"}
                      </span>
                    </Button>
                  </label>
                  <Button variant="outline" size="sm" onClick={exportCsv} data-testid="button-export-vehicles-csv">
                    <Download className="h-4 w-4 mr-2" /> Exportar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {groupBy === "none" && filteredVehicles.length > 0 && (
            <div className="flex items-center justify-end gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} data-testid="button-prev-page-vehicles">Anterior</Button>
              <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} data-testid="button-next-page-vehicles">Siguiente</Button>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-page-size-vehicles">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingVehicles ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando vehículos...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No se encontraron vehículos" : "No hay vehículos registrados"}
            </div>
          ) : groupBy === "none" ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pageVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <VehicleTable vehicles={pageVehicles} />
            )
          ) : (
            (() => {
              const groups = new Map<string, Vehicle[]>();
              const labelMap = new Map<string, string>();
              if (groupBy === "client") {
                for (const v of filteredVehicles) {
                  const key = String(v.clientId ?? "none");
                  const name = v.clientId ? (clients.find((c) => c.id === v.clientId)?.name || "Cliente") : "Sin cliente";
                  groups.set(key, [...(groups.get(key) || []), v]);
                  labelMap.set(key, name);
                }
              } else if (groupBy === "type") {
                for (const v of filteredVehicles) {
                  const key = String(v.vehicleTypeId ?? "none");
                  const name = v.vehicleTypeId ? (vehicleTypes.find((t) => t.id === v.vehicleTypeId)?.name || "Tipo") : "Sin tipo";
                  groups.set(key, [...(groups.get(key) || []), v]);
                  labelMap.set(key, name);
                }
              } else if (groupBy === "branch") {
                for (const v of filteredVehicles) {
                  const key = String(v.branchId ?? "none");
                  const name = v.branchId ? (branches.find((b) => b.id === v.branchId)?.name || "Sucursal") : "Sin sucursal";
                  groups.set(key, [...(groups.get(key) || []), v]);
                  labelMap.set(key, name);
                }
              }
              const entries = Array.from(groups.entries()).sort((a, b) => (labelMap.get(a[0]) || "").localeCompare(labelMap.get(b[0]) || ""));
              return (
                <div className="space-y-6">
                  {entries.map(([key, list]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{labelMap.get(key)}</h3>
                        <span className="text-sm text-muted-foreground">{list.length} vehículos</span>
                      </div>
                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {list.map((v) => (
                            <VehicleCard key={v.id} vehicle={v} />
                          ))}
                        </div>
                      ) : (
                        <VehicleTable vehicles={list} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </TabsContent>

        <TabsContent value="transfer-history" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Historial de Transferencias</h2>
              <p className="text-muted-foreground mt-1">
                Consulta los movimientos de vehículos entre sucursales
              </p>
            </div>
          </div>
          <VehicleBranchHistoryTable />
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Tipos de Vehículos</h2>
              <p className="text-muted-foreground mt-1">
                Administra los tipos de carrocería disponibles
              </p>
            </div>
            <AddVehicleTypeDialog />
          </div>

          {isLoadingTypes ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando tipos de vehículos...
            </div>
          ) : (
            <VehicleTypesTable vehicleTypes={vehicleTypes} />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h2 className="text-2xl font-semibold">Historial de Vehículo</h2>
              <p className="text-muted-foreground mt-1">
                Consulta por número económico o número de serie (VIN)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end no-print">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="economicNumber">
                Número económico
              </label>
              <Input
                id="economicNumber"
                placeholder="Ej. 12345"
                value={economicNumber}
                onChange={(e) => setEconomicNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vin">
                Número de serie (VIN)
              </label>
              <Input
                id="vin"
                placeholder="Ej. 1HGCM82633A004352"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
              />
            </div>
            <div className="flex gap-2 md:justify-end">
              <Button
                onClick={() => {
                  // Habilitar la búsqueda; react-query ejecutará el query al cumplir 'enabled'
                  setSearchEnabled(true);
                }}
              >
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEconomicNumber("");
                  setVin("");
                  setStartDate("");
                  setEndDate("");
                  setSearchEnabled(false);
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end no-print">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="startDate">
                Fecha inicio del reporte
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="endDate">
                Fecha fin del reporte
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {historyError && (
            <div className="text-red-600 text-sm">
              {(historyError as Error).message || "Error al consultar historial"}
            </div>
          )}

          {isLoadingHistory && searchEnabled ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando historial...
            </div>
          ) : history && searchEnabled ? (
            <div className="space-y-6 print-container" id="vehicle-history-content">
              {/* Estilos de impresión: al imprimir solo se muestra vehicle-print-content */}
              <style>{`
                /* Ocultar encabezado de empresa en pantalla */
                .company-print-header { display: none; }
                @media print {
                  body * { visibility: hidden; }
                  .vehicle-print-content, .vehicle-print-content * { visibility: visible; }
                  .vehicle-print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 12mm; }
                  @page { margin: 12mm; }
                  /* Encabezado sólo para impresión de reporte individual */
                  .report-print-header { display: none; }
                  .vehicle-print-content.report-card .report-print-header {
                    display: block;
                    margin-bottom: 8mm;
                    padding-bottom: 4mm;
                    border-bottom: 1px solid #e5e7eb;
                  }
                  /* Encabezado de empresa optimizado a 2 renglones */
                  .company-print-header {
                    display: block;
                    margin-bottom: 6mm;
                    padding-bottom: 3mm;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 11px;
                    line-height: 1.3;
                  }
                  .company-print-header .row1 {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2px;
                  }
                  .company-print-header .row2 {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  }
                  .company-print-header .brand {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 13px;
                  }
                  .company-print-header img { height: 32px; object-fit: contain; }
                  .company-print-header .contact { color: #374151; }
                  .company-print-header .meta-right { text-align: right; color: #6b7280; }
                }
              `}</style>
              {/* Encabezado de empresa para historial completo */}
              <div className="company-print-header">
                <div className="row1">
                  <div className="brand">
                    {configuration?.logo ? (
                      <img src={configuration.logo} alt="Logo" />
                    ) : (
                      <img src="/logo.png" alt="Logo" />
                    )}
                    {configuration?.companyName || "AutoCare Manager"}
                  </div>
                  <div className="meta-right">
                    <div>Historial completo</div>
                    <div>Impreso: {new Date().toLocaleString()}</div>
                  </div>
                </div>
                <div className="row2">
                  <div className="contact">
                    {[
                      configuration?.companyAddress,
                      configuration?.companyPhone && `Tel: ${configuration.companyPhone}`,
                      configuration?.companyEmail,
                      configuration?.taxId && `RFC: ${configuration.taxId}`
                    ].filter(Boolean).join(" • ")}
                  </div>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold section-title">Vehículo</h3>
                <div className="mt-2 text-sm space-y-1">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span><span className="text-muted-foreground">Marca:</span> {history.vehicle.brand}</span>
                    <span><span className="text-muted-foreground">Modelo:</span> {history.vehicle.model}</span>
                    <span><span className="text-muted-foreground">Placa:</span> {history.vehicle.plate}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span><span className="text-muted-foreground">Número económico:</span> {history.vehicle.economicNumber}</span>
                    <span><span className="text-muted-foreground">VIN:</span> {history.vehicle.vin}</span>
                  </div>
                </div>
              </div>
              {/* Acciones: imprimir */}
              <div className="flex justify-end no-print gap-2">
                <Button variant="outline" size="icon" title="Imprimir historial" onClick={handlePrintAll}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>

              {/* Historial agrupado por reporte */}
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold section-title">Historial agrupado por reporte</h3>
                {history.reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin reportes en el rango seleccionado</p>
                ) : (
                  <ul className="mt-3 space-y-4">
                    {history.reports.map((r) => {
                      const diagnosticsByReport = history.diagnostics.filter((d) => d.reportId === r.id);
                      const workOrdersByReport = history.workOrders.filter((wo) =>
                        diagnosticsByReport.some((d) => wo.diagnosticId === d.id)
                      );
                      return (
                        <li key={r.id} id={`report-${r.id}`} className="border rounded-md p-3 report-card">
                          {/* Encabezado compacto con datos del vehículo, visible solo al imprimir este reporte */}
                          <div className="report-print-header">
                            <div className="text-base font-semibold">Reporte de vehículo</div>
                            <div className="mt-1 text-sm space-y-1">
                              <div className="flex flex-wrap gap-x-6 gap-y-1">
                                <span><span className="text-muted-foreground">Marca:</span> {history.vehicle.brand}</span>
                                <span><span className="text-muted-foreground">Modelo:</span> {history.vehicle.model}</span>
                                <span><span className="text-muted-foreground">Placa:</span> {history.vehicle.plate}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-6 gap-y-1">
                                <span><span className="text-muted-foreground">Número económico:</span> {history.vehicle.economicNumber}</span>
                                <span><span className="text-muted-foreground">VIN:</span> {history.vehicle.vin}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                            <span className="font-medium">Reporte #{r.id}</span>
                            <span className="text-muted-foreground">Fecha: {new Date(r.createdAt as unknown as string).toLocaleString()}</span>
                            <span className="text-xs">Estado: {r.status}</span>
                            {r.resolved && r.resolvedDate && (
                              <span className="text-xs">Alta: {new Date(r.resolvedDate as unknown as string).toLocaleString()}</span>
                            )}
                          </div>
                          {/* Botón para imprimir solo este reporte */}
                          <div className="flex justify-end mt-2 no-print">
                            <Button size="icon" variant="outline" title="Imprimir reporte" onClick={() => handlePrintReport(r.id)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-1 text-muted-foreground">{r.description}</div>

                          <div className="mt-3">
                            <h4 className="font-semibold section-title">Diagnósticos</h4>
                            {diagnosticsByReport.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin diagnósticos</p>
                            ) : (
                              <ul className="mt-1 space-y-2 text-sm print-list">
                                {diagnosticsByReport.map((d) => (
                                  <li key={d.id} className="border rounded-md p-2 subcard">
                                    <div className="flex justify-between">
                                      <span className="font-medium">#{d.id}</span>
                                      <span className="text-muted-foreground">{new Date(d.createdAt as unknown as string).toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs">Severidad: {d.severity}</div>
                                    {d.approvedAt && (
                                      <div className="text-xs">Aprobado: {new Date(d.approvedAt as unknown as string).toLocaleString()}</div>
                                    )}
                                    <div className="text-muted-foreground">{d.technicalRecommendation}</div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="mt-4">
                            <h4 className="font-semibold section-title">Órdenes de trabajo</h4>
                            {workOrdersByReport.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin órdenes de trabajo</p>
                            ) : (
                              <ul className="mt-2 space-y-3 text-sm print-list">
                                {workOrdersByReport.map((wo) => (
                                  <li key={wo.id} className="border rounded-md p-3 subcard">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                                      <span className="font-medium">OT #{wo.id}</span>
                                      {wo.startDate && (
                                        <span className="text-muted-foreground">Inicio: {new Date(wo.startDate as unknown as string).toLocaleString()}</span>
                                      )}
                                      {wo.completedDate && (
                                        <span className="text-muted-foreground">Fin: {new Date(wo.completedDate as unknown as string).toLocaleString()}</span>
                                      )}
                                      <span className="text-xs">Estado: {wo.status}</span>
                                      <span className="text-xs">Prioridad: {wo.priority}</span>
                                    </div>
                                    <div className="mt-1 text-muted-foreground">{wo.description}</div>

                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <h5 className="font-semibold">Trabajos realizados</h5>
                                        {wo.tasks.length === 0 ? (
                                          <p className="text-xs text-muted-foreground">Sin reparaciones</p>
                                        ) : (
                                          <ul className="mt-1 space-y-1">
                                            {wo.tasks.map((t) => (
                                              <li key={t.id} className="text-xs">
                                                <span className="font-medium">Reparación #{t.id}:</span> {t.notes || t.estimatedTime || "Trabajo"}
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                      <div>
                                        <h5 className="font-semibold">Materiales usados</h5>
                                        {wo.materials.length === 0 ? (
                                          <p className="text-xs text-muted-foreground">Sin materiales</p>
                                        ) : (
                                          <ul className="mt-1 space-y-1">
                                            {wo.materials.map((m) => (
                                              <li key={m.id} className="text-xs">
                                                <span className="font-medium">{m.description}</span> — Cantidad: {m.quantityNeeded} — Costo unitario: ${m.unitCost}
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {/* Servicios generales del vehículo (no vinculados a reporte) */}
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold section-title">Servicios generales</h3>
                {history.services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin servicios</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {history.services.map((s) => (
                      <li key={s.id} className="border rounded-md p-2 subcard">
                        <div className="flex justify-between">
                          <span className="font-medium">Servicio #{s.id}</span>
                          {s.completedDate && (
                            <span className="text-muted-foreground">{new Date(s.completedDate as unknown as string).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="text-muted-foreground">{s.description}</div>
                        <div className="text-xs">Costo: ${s.cost}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Ingresa número económico o VIN y presiona "Buscar".
            </div>
          )}
        </TabsContent>
      </Tabs>
      <AlertDialog open={importOpen} onOpenChange={(open) => setImportOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resultado de importación</AlertDialogTitle>
            <AlertDialogDescription>
              {importSummary ? (
                <div className="space-y-2">
                  <div>Creados: {importSummary.created}</div>
                  <div>Actualizados: {importSummary.updated}</div>
                  {importSummary.errors.length > 0 ? (
                    <div className="mt-2">
                      <div className="font-medium">Errores:</div>
                      <ul className="text-sm max-h-40 overflow-y-auto list-disc ml-5">
                        {importSummary.errors.map((e, idx) => (
                          <li key={idx}>Fila {e.row}: {e.error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Sin errores.</div>
                  )}
                </div>
              ) : (
                <span>Sin datos</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setImportOpen(false); }}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
