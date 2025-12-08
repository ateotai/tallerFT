import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { AddChecklistDialog } from "@/components/add-checklist-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Checklist, Vehicle } from "@shared/schema";
import { VehicleSearchCombobox } from "@/components/vehicle-search-combobox";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardPlus } from "lucide-react";
import { Grid, List } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Printer, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ChecklistsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [economicSearch, setEconomicSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [vehicleFilter, setVehicleFilter] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<Checklist | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists", { type: typeFilter, economicNumber: economicSearch, start: startDate, end: endDate, vehicleId: vehicleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      if (economicSearch) params.set("economicNumber", economicSearch.trim());
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      if (vehicleFilter) params.set("vehicleId", String(vehicleFilter));
      const res = await fetch(`/api/checklists${params.toString() ? `?${params.toString()}` : ""}`);
      return await res.json();
    },
  });
  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: roleTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist-templates/by-role", user?.role || "", "all"],
    queryFn: async () => {
      if (!user?.role) return [];
      const res = await fetch(`/api/checklist-templates/by-role/${encodeURIComponent(user.role || "")}/all`, { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user?.role,
  });
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist-templates", { activeOnly: true, unique: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/checklist-templates?activeOnly=true&unique=true");
      return await res.json();
    },
  });
  const [location, navigate] = useLocation();

  const templateOptions = useMemo(() => {
    const seen = new Set<number>();
    const list: any[] = [];
    for (const t of roleTemplates) {
      if (!seen.has(t.id)) { seen.add(t.id); list.push(t); }
    }
    for (const t of templates) {
      if (!seen.has(t.id)) { seen.add(t.id); list.push(t); }
    }
    return list;
  }, [roleTemplates, templates]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/checklists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      toast({ title: "Checklist eliminado", description: "El registro fue eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar el checklist", variant: "destructive" });
    },
  });

  function handleDelete(id: number) {
    deleteMutation.mutate(id);
  }

  function handlePrint(checklist: Checklist) {
    const w = window.open("", "_blank");
    if (!w) return;
    const dateStr = checklist.inspectedAt ? new Date(checklist.inspectedAt as any).toLocaleString() : "";
    const v = vehicles.find((vv) => vv.id === checklist.vehicleId);
    const vehicleStr = v ? `${v.economicNumber || v.plate} · ${v.brand} ${v.model}` : vehicleLabel(checklist.vehicleId);
    const stateLabel: Record<string, string> = { good: "Bueno", regular: "Regular", bad: "Malo", yes: "Sí", no: "No" };
    const priorityLabel: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" } as any;
    const nextMaint = checklist.nextMaintenanceDate ? new Date(checklist.nextMaintenanceDate as any).toLocaleDateString() : "";
    const sections = Object.entries((checklist.results || {}) as any)
      .map(([title, items]: [string, any]) => {
        const rows = Object.entries(items || {})
          .map(([name, val]: [string, any]) => {
            const st = stateLabel[String(val?.state || "")] || String(val?.state || "");
            const obs = String(val?.obs || "");
            return `<tr><td class="cell name">${name}</td><td class="cell state">${st}</td><td class="cell obs">${obs}</td></tr>`;
          })
          .join("");
        if (!rows) return "";
        return `
          <div class="section">
            <h2>${title}</h2>
            <table class="items">
              <thead>
                <tr><th class="head name">Actividad</th><th class="head state">Estado</th><th class="head obs">Observaciones</th></tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      })
      .join("");
    const general = `
      <div class="section">
        <h2>Resumen</h2>
        <div class="grid2">
          <div><strong>Prioridad:</strong> ${priorityLabel[String(checklist.priority || "")] || (checklist.priority || "")}</div>
        </div>
        ${checklist.generalObservations ? `<div class="block"><strong>Observaciones:</strong><div class="text">${checklist.generalObservations}</div></div>` : ""}
      </div>
    `;
    const vehicleDetails = v ? `
      <div class="section">
        <h2>Datos del vehículo</h2>
        <div class="grid2">
          <div><strong>Núm. económico:</strong> ${v.economicNumber || ""}</div>
          <div><strong>Placas:</strong> ${v.plate || ""}</div>
          <div><strong>Marca:</strong> ${v.brand || ""}</div>
          <div><strong>Modelo:</strong> ${v.model || ""}</div>
          <div><strong>Año:</strong> ${v.year || ""}</div>
          <div><strong>Kilometraje:</strong> ${v.mileage ?? ""}</div>
          <div><strong>Combustible:</strong> ${v.fuelType || ""}</div>
        </div>
      </div>
    ` : "";
    const html = `
      <html>
        <head>
          <title>Checklist ${checklist.folio || checklist.id}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            h2 { font-size: 16px; margin: 18px 0 8px; }
            .muted { color: #666; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .section { margin-top: 14px; }
            .items { width: 100%; border-collapse: collapse; margin-top: 6px; }
            .items th, .items td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            .items th { background: #f5f5f5; text-align: left; }
            .head.name { width: 40%; }
            .head.state { width: 20%; }
            .head.obs { width: 40%; }
            .block { margin-top: 8px; }
            .text { margin-top: 4px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Checklist ${checklist.folio || checklist.id}</h1>
          <div class="muted">${dateStr}</div>
          <div class="section grid">
            <div><strong>Vehículo:</strong> ${vehicleStr}</div>
            <div><strong>Tipo:</strong> ${checklist.type || ""}</div>
            <div><strong>Conductor:</strong> ${checklist.driverName || ""}</div>
          </div>
          ${vehicleDetails}
          ${sections}
          ${general}
        </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  function vehicleLabel(id?: number | null) {
    const v = vehicles.find((vv) => vv.id === id);
    if (!v) return "-";
    return `${v.economicNumber || v.plate} · ${v.brand} ${v.model}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Checklists</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedTemplateId ? String(selectedTemplateId) : ""} onValueChange={(v) => setSelectedTemplateId(v ? Number(v) : null)}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Plantilla" /></SelectTrigger>
            <SelectContent>
              {templateOptions.map((t: any) => (
                <SelectItem key={`tpl-${t.id}`} value={String(t.id)}>{t.name} · {t.type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/checklists/nuevo")} disabled={!selectedTemplateId} data-testid="button-create-checklist">
            <ClipboardPlus className="h-4 w-4 mr-2" />
            Crear nuevo checklist
          </Button>
          {location === "/checklists/nuevo" && (
            <AddChecklistDialog
              open={true}
              selectedTemplateId={selectedTemplateId}
              onOpenChange={(o) => {
                if (!o) navigate("/checklists");
              }}
            />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revisiones registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[240px]">
              <Input value={economicSearch} onChange={(e) => setEconomicSearch(e.target.value)} placeholder="Buscar por número económico" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <VehicleSearchCombobox value={vehicleFilter} onValueChange={setVehicleFilter} placeholder="Filtrar por vehículo" />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            <Button variant="ghost" onClick={() => { setTypeFilter("all"); setEconomicSearch(""); setStartDate(""); setEndDate(""); setVehicleFilter(null); }}>Limpiar</Button>
            <div className="ml-auto flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid-checklists"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list-checklists"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checklists.map((c) => (
                <div key={c.id} className="border rounded-md p-4">
                  <div className="font-medium">Folio: {c.folio || c.id}</div>
                  <div className="text-sm text-muted-foreground">{new Date(c.inspectedAt as any).toLocaleString()}</div>
                  <div className="mt-2">{vehicleLabel(c.vehicleId)}</div>
                  <div className="text-sm">Tipo: {c.type}</div>
                  <div className="text-sm">Conductor: {c.driverName}</div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ver detalles"
                      onClick={() => setViewingChecklist(c)}
                      data-testid={`button-view-checklist-${c.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Imprimir PDF"
                      onClick={() => handlePrint(c)}
                      data-testid={`button-print-checklist-${c.id}`}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      title="Eliminar"
                      onClick={() => handleDelete(c.id)}
                      data-testid={`button-delete-checklist-${c.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conductor</TableHead>
                    
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {economicSearch || startDate || endDate || (typeFilter && typeFilter !== "all") ? "No se encontraron checklists" : "No hay checklists registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    checklists.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.folio || c.id}</TableCell>
                        <TableCell>{new Date(c.inspectedAt as any).toLocaleString()}</TableCell>
                        <TableCell>{vehicleLabel(c.vehicleId)}</TableCell>
                        <TableCell>{c.type}</TableCell>
                        <TableCell>{c.driverName}</TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Ver" onClick={() => setViewingChecklist(c)} data-testid={`button-view-checklist-${c.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" title="Imprimir" onClick={() => handlePrint(c)} data-testid={`button-print-checklist-${c.id}`}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => handleDelete(c.id)} data-testid={`button-delete-checklist-${c.id}`}>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingChecklist} onOpenChange={(o) => !o && setViewingChecklist(null)}>
        <DialogContent className="max-w-3xl">
          {viewingChecklist && (
            <>
              <DialogHeader>
                <DialogTitle>Checklist {viewingChecklist.folio || viewingChecklist.id}</DialogTitle>
                <DialogDescription>{new Date(viewingChecklist.inspectedAt as any).toLocaleString()}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><strong>Vehículo:</strong> {vehicleLabel(viewingChecklist.vehicleId)}</div>
                  <div><strong>Tipo:</strong> {viewingChecklist.type}</div>
                  <div><strong>Conductor:</strong> {viewingChecklist.driverName}</div>
                </div>
                <div className="mt-4 space-y-4">
                  {Object.entries((viewingChecklist.results || {}) as any).map(([title, items]: [string, any]) => {
                    const entries = Object.entries(items || {}) as [string, any][];
                    if (entries.length === 0) return null;
                    return (
                      <div key={title}>
                        <h3 className="font-semibold">{title}</h3>
                        <div className="rounded-md border mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Actividad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Observaciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entries.map(([name, val]) => (
                                <TableRow key={name}>
                                  <TableCell className="w-[40%]">{name}</TableCell>
                                  <TableCell className="w-[20%]">{({ good: "Bueno", regular: "Regular", bad: "Malo", yes: "Sí", no: "No" } as any)[String(val?.state || "")] || String(val?.state || "")}</TableCell>
                                  <TableCell className="w-[40%]">{String(val?.obs || "")}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold">Resumen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><strong>Prioridad:</strong> {({ high: "Alta", medium: "Media", low: "Baja" } as any)[String(viewingChecklist.priority || "")] || (viewingChecklist.priority || "-")}</div>
                  </div>
                  {viewingChecklist.generalObservations && (
                    <div className="space-y-1">
                      <div className="font-medium">Observaciones</div>
                      <div className="text-sm whitespace-pre-wrap">{viewingChecklist.generalObservations}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
