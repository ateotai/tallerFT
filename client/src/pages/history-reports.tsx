import { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Role, Permission, RolePermission } from "@shared/schema";

export default function HistoryReportsPage() {
  const { user } = useAuth();
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { data: permissions = [] } = useQuery<Permission[]>({ queryKey: ["/api/permissions"] });
  const currentRoleId = roles.find(r => r.name === user?.role)?.id;
  const { data: rolePerms = [] } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions", currentRoleId ?? ""],
    enabled: !!currentRoleId,
  });

  const hasPermission = (permName: string, module: string) => {
    if (!permissions.length || !rolePerms.length) return false;
    const perm = permissions.find(p => p.name === permName && p.module === module);
    if (!perm) return false;
    return rolePerms.some(rp => rp.permissionId === perm.id);
  };

  const roleText = (user?.role || '').toLowerCase();
  const isAdmin = roleText === 'admin' || roleText === 'administrador';
  const canView = isAdmin || hasPermission("Ver reportes", "Reportes");

  if (!canView) {
    return (
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-muted-foreground">No tienes permiso para ver Reportes de historial.</p>
        </div>
      </div>
    );
  }
  const { data: rows = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/expense-history"],
    queryFn: async () => {
      const res = await fetch("/api/expense-history", { credentials: "include" });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (ct.includes("application/json")) {
          const j = await res.json();
          throw new Error(j?.error || j?.message || res.statusText);
        }
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      if (ct.includes("application/json")) return await res.json();
      const txt = await res.text();
      try { return JSON.parse(txt); } catch {
        throw new Error("Respuesta no JSON del servidor al consultar historial");
      }
    },
    retry: false,
  });

  const [repStart, setRepStart] = useState<string>("");
  const [repEnd, setRepEnd] = useState<string>("");
  const [repCategory, setRepCategory] = useState<string>("TODAS");
  const [repCostCenter, setRepCostCenter] = useState<string>("TODOS");
  const costCenters = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const cc = String(r.costCenter || "").trim();
      if (cc) set.add(cc);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const barRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const pieRef = useRef<HTMLDivElement | null>(null);

  const pickChartSvg = (container: HTMLDivElement | null): SVGSVGElement | null => {
    if (!container) return null;
    const preferred = container.querySelector("svg.recharts-surface") as SVGSVGElement | null;
    if (preferred) return preferred;
    const all = Array.from(container.querySelectorAll("svg")) as SVGSVGElement[];
    const candidates = all.filter((el) => !el.closest("button"));
    const withWrapper = candidates.filter((el) => !!el.closest(".recharts-wrapper"));
    const pool = withWrapper.length ? withWrapper : candidates;
    let best: SVGSVGElement | null = null;
    let bestArea = 0;
    for (const el of pool) {
      const r = el.getBoundingClientRect();
      const area = Math.max(0, r.width) * Math.max(0, r.height);
      if (area > bestArea) { bestArea = area; best = el; }
    }
    return best;
  };

  const exportSvgToPng = async (container: HTMLDivElement | null, filename: string, title: string) => {
    if (!container) return;
    let svg = pickChartSvg(container);
    if (!svg) return;
    // Oculta cualquier overlay dentro del contenedor (botón exportar) mientras se mide
    const overlays = Array.from(container.querySelectorAll("button")) as HTMLButtonElement[];
    overlays.forEach((b) => (b.style.visibility = "hidden"));

    // Serializa SVG
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.startsWith("<?xml")) source = `<?xml version="1.0" standalone="no"?>\n` + source;
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });

    // Determina tamaño real del SVG
    const dpr = window.devicePixelRatio || 1;
    const viewBox = (svg as any).viewBox?.baseVal || (svg as any).viewBox || null;
    const widthAttr = (svg as any).width?.baseVal?.value || parseFloat(svg.getAttribute("width") || "0");
    const heightAttr = (svg as any).height?.baseVal?.value || parseFloat(svg.getAttribute("height") || "0");
    const boxW = viewBox ? viewBox.width : 0;
    const boxH = viewBox ? viewBox.height : 0;
    const fallbackW = (container.clientWidth || svg.getBoundingClientRect().width || 800);
    const fallbackH = (container.clientHeight || svg.getBoundingClientRect().height || 400);
    const drawW = Math.max(1, Math.floor(widthAttr || boxW || fallbackW));
    const drawH = Math.max(1, Math.floor(heightAttr || boxH || fallbackH));

    const headerH = 72;
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor((drawW) * dpr);
    canvas.height = Math.floor((drawH + headerH) * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillText(title, 16, 28);
    ctx.font = "14px system-ui, sans-serif";
    const rangeStr = `Rango: ${repStart || "-"} a ${repEnd || "-"}`;
    const catStr = `Categoría: ${repCategory}`;
    const ccStr = `Centro de costo: ${repCostCenter}`;
    ctx.fillText(rangeStr, 16, 50);
    ctx.fillText(catStr, 16, 68);
    const ccX = 16 + Math.min(drawW - 32, Math.max(rangeStr.length, catStr.length) * 7) + 24;
    ctx.fillText(ccStr, ccX > drawW - 200 ? 16 : ccX, 68);
    ctx.drawImage(img, 0, headerH, drawW, drawH);
    URL.revokeObjectURL(url);

    overlays.forEach((b) => (b.style.visibility = ""));

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    a.click();
  };

  const exportChartsToPdf = async () => {
    const imgs: string[] = [];
    for (const ref of [barRef.current, lineRef.current, pieRef.current]) {
      if (!ref) continue;
      const svg = pickChartSvg(ref);
      if (!svg) continue;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svg);
      if (!source.startsWith("<?xml")) source = `<?xml version=\"1.0\" standalone=\"no\"?>\n` + source;
      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });
      const rect = svg.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      imgs.push(canvas.toDataURL("image/png"));
    }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write("<html><head><title>Reportes</title></head><body style='margin:0;padding:16px;font-family:system-ui;'>");
    for (const src of imgs) {
      win.document.write(`<img src='${src}' style='width:100%; margin-bottom:24px; page-break-after:always;'/>`);
    }
    win.document.write("</body></html>");
    win.document.close();
    win.focus();
    win.print();
  };

  const reportData = useMemo(() => {
    const toDate = (s: string) => (s ? new Date(s) : undefined);
    const sD = toDate(repStart);
    const eD = toDate(repEnd);
    const filtered = rows.filter((r) => {
      const withinCat = repCategory === "TODAS" || String(r.category || "").toUpperCase() === repCategory;
      const withinCC = repCostCenter === "TODOS" || String(r.costCenter || "").trim() === repCostCenter;
      const d = r.date ? new Date(r.date) : undefined;
      const afterS = sD ? (d ? d >= sD : false) : true;
      const beforeE = eD ? (d ? d <= eD : false) : true;
      return withinCat && withinCC && afterS && beforeE;
    });
    const byCCMap: Record<string, number> = {};
    const byCatMap: Record<string, number> = {};
    const byDayMap: Record<string, number> = {};
    let grand = 0;
    for (const r of filtered) {
      const cc = String(r.costCenter || "").trim() || "SIN CENTRO";
      const cat = String(r.category || "").trim().toUpperCase() || "SIN CATEGORÍA";
      if (repCostCenter === "TODOS") {
        byCCMap[cc] = (byCCMap[cc] || 0) + Number(r.total || 0);
      } else {
        byCatMap[cat] = (byCatMap[cat] || 0) + Number(r.total || 0);
      }
      const key = r.date ? new Date(r.date).toLocaleDateString() : "Sin fecha";
      byDayMap[key] = (byDayMap[key] || 0) + Number(r.total || 0);
      grand += Number(r.total || 0);
    }
    const byCC = Object.entries(byCCMap).map(([name, total]) => ({ name, total }));
    const byCat = Object.entries(byCatMap).map(([name, total]) => ({ name, total }));
    const byDay = Object.entries(byDayMap).map(([date, total]) => ({ date, total })).sort((a, b) => {
      const pa = Date.parse(a.date);
      const pb = Date.parse(b.date);
      if (Number.isNaN(pa) || Number.isNaN(pb)) return 0;
      return pa - pb;
    });
    const barData = repCostCenter === "TODOS" ? byCC : byCat;
    const barName = repCostCenter === "TODOS" ? "Total por centro de costo" : `Total por categoría (${repCostCenter})`;
    return { grand, byCC, byCat, byDay, barData, barName };
  }, [rows, repStart, repEnd, repCategory, repCostCenter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes de historial</h1>
        <p className="text-muted-foreground">Consulta gráficas y datos por rango de fechas y categorías.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecciona rango y categoría para generar reportes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input type="date" value={repStart} onChange={(e) => setRepStart(e.target.value)} className="w-full md:w-44" />
              <Input type="date" value={repEnd} onChange={(e) => setRepEnd(e.target.value)} className="w-full md:w-44" />
              <Select value={repCategory} onValueChange={(v) => setRepCategory(v)}>
                <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="COMBUSTIBLE">COMBUSTIBLE</SelectItem>
                  <SelectItem value="GAS">GAS</SelectItem>
                  <SelectItem value="REPARACIONES">REPARACIONES</SelectItem>
                  <SelectItem value="ACEITES Y LUBRICANTES">ACEITES Y LUBRICANTES</SelectItem>
                  <SelectItem value="FLETES">FLETES</SelectItem>
                  <SelectItem value="TRASLADOS">TRASLADOS</SelectItem>
                  <SelectItem value="LEASING">LEASING</SelectItem>
                </SelectContent>
              </Select>
              <Select value={repCostCenter} onValueChange={(v) => setRepCostCenter(v)}>
                <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Centro de costo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">Total: ${reportData.grand.toLocaleString()}</div>
          </div>

          {error ? (
            <div className="text-center py-8 text-destructive">Error al cargar historial: {String((error as any)?.message || error)}</div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div ref={barRef} className="relative w-full h-64">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => exportSvgToPng(barRef.current, repCostCenter === "TODOS" ? "resumen-centros" : "resumen-categorias", repCostCenter === "TODOS" ? "Resumen por centros de costo" : `Resumen por categorías · ${repCostCenter}`)}
                  >
                    <Download className="h-4 w-4 mr-2" /> Exportar imagen
                  </Button>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name={reportData.barName} fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div ref={lineRef} className="relative w-full h-64">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => exportSvgToPng(lineRef.current, "totales-por-dia", "Totales por día")}
                  >
                    <Download className="h-4 w-4 mr-2" /> Exportar imagen
                  </Button>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.byDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total por día" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={pieRef} className="relative w-full h-72 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2 z-10"
                  onClick={() => exportSvgToPng(pieRef.current, repCostCenter === "TODOS" ? "distribucion-centros" : "distribucion-categorias", repCostCenter === "TODOS" ? "Distribución por centros de costo" : `Distribución por categorías · ${repCostCenter}`)}
                >
                  <Download className="h-4 w-4 mr-2" /> Exportar imagen
                </Button>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={reportData.barData} dataKey="total" nameKey="name" outerRadius={110} label>
                      {reportData.barData.map((_, i) => (
                        <Cell key={i} fill={["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#22c55e", "#06b6d4", "#fb7185"][i % 8]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" onClick={exportChartsToPdf}>
                  <Download className="h-4 w-4 mr-2" /> Exportar PDF
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
