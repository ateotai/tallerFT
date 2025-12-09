import { useQuery, useMutation } from "@tanstack/react-query";
import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download, Upload, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Role, Permission, RolePermission } from "@shared/schema";

export default function HistoryConsultPage() {
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
  const canView = isAdmin || hasPermission("Ver consulta de historial", "Consulta de historial");

  if (!canView) {
    return (
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-muted-foreground">No tienes permiso para consultar historial.</p>
        </div>
      </div>
    );
  }
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastImported, setLastImported] = useState<any[]>([]);

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

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [delStart, setDelStart] = useState<string>("");
  const [delEnd, setDelEnd] = useState<string>("");
  const [delCategory, setDelCategory] = useState<string>("");

  const prepared = useMemo(() => {
    const norm = (v: any) => String(v ?? "").toLowerCase();
    const filtered = rows.filter((r) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        norm(r.costCenter).includes(s) ||
        norm(r.provider).includes(s) ||
        norm(r.vehicle).includes(s) ||
        norm(r.column1).includes(s) ||
        norm(r.column2).includes(s) ||
        norm(r.concept).includes(s) ||
        norm(r.expenseDescription).includes(s) ||
        norm(r.unit).includes(s) ||
        norm(r.total).includes(s) ||
        norm(r.date && new Date(r.date).toLocaleDateString()).includes(s)
      );
    });
    const sorted = filtered.slice().sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (db !== da) return db - da; // fecha DESC
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (cb !== ca) return cb - ca; // createdAt DESC
      return (b.id || 0) - (a.id || 0); // id DESC
    });
    const total = sorted.length;
    const start = page * pageSize;
    const end = start + pageSize;
    const slice = sorted.slice(start, end);
    return { total, slice };
  }, [rows, search, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(prepared.total / pageSize));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;


  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("category", selectedCategory);
      const res = await fetch("/api/expense-history/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (ct.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Error al importar archivo");
        }
        const text = await res.text();
        throw new Error(text || "Error al importar archivo");
      }
      if (ct.includes("application/json")) return await res.json();
      const txt = await res.text();
      try { return JSON.parse(txt); } catch { return { message: txt }; }
    },
    onSuccess: (data: any) => {
      toast({ title: "Historial importado", description: "Se agregaron registros" });
      if (data?.rows) setLastImported(data.rows);
      queryClient.invalidateQueries({ queryKey: ["/api/expense-history"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: String(err.message || err), variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (delCategory) payload.category = delCategory;
      if (delStart) payload.startDate = delStart;
      if (delEnd) payload.endDate = delEnd;
      const res = await fetch("/api/expense-history/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Historial limpiado", description: `Se eliminaron ${data?.deleted ?? 0} registros` });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-history"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/expense-history/clear", {
        method: "POST",
        credentials: "include",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Historial limpiado", description: `Se eliminaron ${data?.deleted ?? 0} registros` });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-history"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: String(err?.message || err), variant: "destructive" });
    }
  });

  const handleDeleteFilteredClick = () => {
    clearMutation.mutate();
  };

  const handleClearAllClick = () => {
    const ok = window.confirm("¿Eliminar TODO el historial? Esta acción no se puede deshacer.");
    if (!ok) return;
    clearAllMutation.mutate();
  };

  const downloadTemplate = async () => {
    const headers = [
      "Centro de",
      "Proveedor",
      "Vehiculo",
      "Concepto",
      "Descripción Gasto",
      "Fecha",
      "Total",
    ];
    const csv = "\uFEFF" + "sep=,\n" + headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_historial.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consulta de historial</h1>
        <p className="text-muted-foreground">Sube un archivo CSV exportado de Excel para almacenar y consultar gastos.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Importación</CardTitle>
            <CardDescription>Usa la plantilla para asegurar encabezados compatibles.</CardDescription>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:flex-wrap">
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
              <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COMBUSTIBLE">COMBUSTIBLE</SelectItem>
                <SelectItem value="GAS">GAS</SelectItem>
                <SelectItem value="REPARACIONES">REPARACIONES</SelectItem>
                <SelectItem value="ACEITES Y LUBRICANTES">ACEITES Y LUBRICANTES</SelectItem>
                <SelectItem value="FLETES">FLETES</SelectItem>
                <SelectItem value="TRASLADOS">TRASLADOS</SelectItem>
                <SelectItem value="LEASING">LEASING</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" /> Plantilla
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadMutation.mutate(f);
                e.currentTarget.value = "";
              }}
            />
            <Button size="sm" disabled={uploadMutation.isPending || !selectedCategory} onClick={() => {
              if (!selectedCategory) {
                toast({ title: "Selecciona categoría", description: "Elige una antes de importar", variant: "destructive" });
                return;
              }
              fileInputRef.current?.click();
            }}>
              <Upload className="h-4 w-4 mr-2" /> {uploadMutation.isPending ? "Importando..." : "Importar CSV"}
            </Button>
            <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center md:flex-wrap">
              <Input type="date" value={delStart} onChange={(e) => setDelStart(e.target.value)} className="w-full md:w-40" />
              <Input type="date" value={delEnd} onChange={(e) => setDelEnd(e.target.value)} className="w-full md:w-40" />
              <Select value={delCategory} onValueChange={(v) => setDelCategory(v)}>
                <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Categoría a eliminar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMBUSTIBLE">COMBUSTIBLE</SelectItem>
                  <SelectItem value="GAS">GAS</SelectItem>
                  <SelectItem value="REPARACIONES">REPARACIONES</SelectItem>
                  <SelectItem value="ACEITES Y LUBRICANTES">ACEITES Y LUBRICANTES</SelectItem>
                  <SelectItem value="FLETES">FLETES</SelectItem>
                  <SelectItem value="TRASLADOS">TRASLADOS</SelectItem>
                  <SelectItem value="LEASING">LEASING</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={handleDeleteFilteredClick} disabled={clearMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar por filtros
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearAllClick} disabled={clearAllMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar todo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full sm:w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filas por página</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))} disabled={!canNext}>Siguiente</Button>
              <span className="text-sm text-muted-foreground">Página {Math.min(page + 1, totalPages)} de {totalPages}</span>
            </div>
          </div>
          {error ? (
            <div className="text-center py-8 text-destructive">
              Error al cargar historial: {String((error as any)?.message || error)}
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
          ) : prepared.total === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Sin registros</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Centro de</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="hidden md:table-cell">Vehículo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="hidden md:table-cell">Descripción Gasto</TableHead>
                    <TableHead className="hidden md:table-cell">Unidad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prepared.slice.map((r, idx) => (
                    <TableRow key={r.id ?? idx}>
                      <TableCell>{page * pageSize + idx + 1}</TableCell>
                      <TableCell>{r.costCenter}</TableCell>
                      <TableCell>{r.provider}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.vehicle || ""}</TableCell>
                      <TableCell>{r.concept}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.expenseDescription || ""}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.unit || ""}</TableCell>
                      <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : ""}</TableCell>
                      <TableCell>${Number(r.total).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {lastImported.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Registros importados recientemente</h3>
              <div className="w-full overflow-x-auto mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Centro de</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="hidden md:table-cell">Vehículo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="hidden md:table-cell">Descripción Gasto</TableHead>
                      <TableHead className="hidden md:table-cell">Unidad</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastImported.map((r, idx) => (
                      <TableRow key={r.id ?? idx}>
                        <TableCell>{r.costCenter}</TableCell>
                        <TableCell>{r.provider}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.vehicle || ""}</TableCell>
                        <TableCell>{r.concept}</TableCell>
                        <TableCell>{r.category}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.expenseDescription || ""}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.unit || ""}</TableCell>
                        <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : ""}</TableCell>
                        <TableCell>${Number(r.total).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
