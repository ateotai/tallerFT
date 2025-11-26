import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AddChecklistDialog } from "@/components/add-checklist-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Checklist, Vehicle } from "@shared/schema";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardPlus } from "lucide-react";
import { Grid, List } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Printer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChecklistsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [economicSearch, setEconomicSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists", { type: typeFilter, economicNumber: economicSearch, start: startDate, end: endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      if (economicSearch) params.set("economicNumber", economicSearch.trim());
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      const res = await fetch(`/api/checklists${params.toString() ? `?${params.toString()}` : ""}`);
      return await res.json();
    },
  });
  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const [location, navigate] = useLocation();

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
    const stateLabel: Record<string, string> = { good: "Bueno", regular: "Regular", bad: "Malo" };
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
          <div><strong>Próximo mantenimiento:</strong> ${nextMaint || ""}</div>
        </div>
        ${checklist.generalObservations ? `<div class="block"><strong>Observaciones:</strong><div class="text">${checklist.generalObservations}</div></div>` : ""}
        ${checklist.recommendations ? `<div class="block"><strong>Recomendaciones:</strong><div class="text">${checklist.recommendations}</div></div>` : ""}
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
            <div><strong>Inspector:</strong> ${checklist.inspectorName || ""}</div>
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
          <Button onClick={() => navigate("/checklists/nuevo")} data-testid="button-create-checklist">
            <ClipboardPlus className="h-4 w-4 mr-2" />
            Crear nuevo checklist
          </Button>
          {location === "/checklists/nuevo" && (
            <AddChecklistDialog
              open={true}
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
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="w-full md:w-1/2">
              <Input value={economicSearch} onChange={(e) => setEconomicSearch(e.target.value)} placeholder="Buscar por número económico" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-1/2 md:justify-end">
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
              <div className="flex border rounded-md">
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
                  <div className="text-sm">Inspector: {c.inspectorName}</div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(c)} data-testid={`button-print-checklist-${c.id}`}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir PDF
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)} data-testid={`button-delete-checklist-${c.id}`}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
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
                    <TableHead>Inspector</TableHead>
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
                        <TableCell>{c.inspectorName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePrint(c)} data-testid={`button-print-checklist-${c.id}`}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} data-testid={`button-delete-checklist-${c.id}`}>
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
    </div>
  );
}
