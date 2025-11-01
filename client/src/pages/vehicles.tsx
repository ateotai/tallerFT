import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard-stats";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleTable } from "@/components/vehicle-table";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { VehicleTypesTable } from "@/components/vehicle-types-table";
import { AddVehicleTypeDialog } from "@/components/add-vehicle-type-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid, List } from "lucide-react";
import type {
  Vehicle,
  VehicleType,
  Report,
  Diagnostic,
  WorkOrder,
  WorkOrderTask,
  WorkOrderMaterial,
  Service,
} from "@shared/schema";

export default function VehiclesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [economicNumber, setEconomicNumber] = useState("");
  const [vin, setVin] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: vehicleTypes = [], isLoading: isLoadingTypes } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

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
      searchEnabled,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (economicNumber.trim()) params.set("economicNumber", economicNumber.trim());
      if (vin.trim()) params.set("vin", vin.trim());
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
      v.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Vehículos</h1>
        <p className="text-muted-foreground">
          Administra toda la información de tu flotilla vehicular
        </p>
      </div>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehículos</TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-vehicle-types">Tipos de Vehículos</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-vehicle-history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          <DashboardStats />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vehículos..."
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
              <AddVehicleDialog />
            </div>
          </div>

          {isLoadingVehicles ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando vehículos...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No se encontraron vehículos" : "No hay vehículos registrados"}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <VehicleTable vehicles={filteredVehicles} />
          )}
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Historial de Vehículo</h2>
              <p className="text-muted-foreground mt-1">
                Consulta por número económico o número de serie (VIN)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                  setSearchEnabled(true);
                  refetchHistory();
                }}
              >
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEconomicNumber("");
                  setVin("");
                  setSearchEnabled(false);
                }}
              >
                Limpiar
              </Button>
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
            <div className="space-y-6">
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold">Vehículo</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Marca:</span> {history.vehicle.brand}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modelo:</span> {history.vehicle.model}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Placa:</span> {history.vehicle.plate}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Número económico:</span> {history.vehicle.economicNumber}
                  </div>
                  <div>
                    <span className="text-muted-foreground">VIN:</span> {history.vehicle.vin}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold">Reportes iniciales</h3>
                {history.reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin reportes</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {history.reports.map((r) => (
                      <li key={r.id} className="border rounded-md p-2">
                        <div className="flex justify-between">
                          <span className="font-medium">#{r.id}</span>
                          <span className="text-muted-foreground">{new Date(r.createdAt as unknown as string).toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground">{r.description}</div>
                        <div className="text-xs">Estado: {r.status}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold">Diagnósticos</h3>
                {history.diagnostics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin diagnósticos</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {history.diagnostics.map((d) => (
                      <li key={d.id} className="border rounded-md p-2">
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

              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold">Órdenes de trabajo</h3>
                {history.workOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin órdenes de trabajo</p>
                ) : (
                  <ul className="mt-2 space-y-3 text-sm">
                    {history.workOrders.map((wo) => (
                      <li key={wo.id} className="border rounded-md p-3">
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
                            <h4 className="font-semibold">Trabajos realizados</h4>
                            {wo.tasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin tareas</p>
                            ) : (
                              <ul className="mt-1 space-y-1">
                                {wo.tasks.map((t) => (
                                  <li key={t.id} className="text-xs">
                                    <span className="font-medium">Tarea #{t.id}:</span> {t.notes || t.estimatedTime || "Trabajo"}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">Materiales usados</h4>
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

              <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold">Servicios</h3>
                {history.services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin servicios</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {history.services.map((s) => (
                      <li key={s.id} className="border rounded-md p-2">
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
    </div>
  );
}
