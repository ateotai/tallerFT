import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProvidersTable } from "@/components/providers-table";
import { AddProviderDialog } from "@/components/add-provider-dialog";
import { ProviderTypesTable } from "@/components/provider-types-table";
import { AddProviderTypeDialog } from "@/components/add-provider-type-dialog";
import type { Provider, ProviderType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Rows, Filter } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function ProvidersPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [importStage, setImportStage] = useState<"idle" | "uploading" | "done">("idle");
  const [importSummary, setImportSummary] = useState<{ inserted: number; updated: number; total: number } | null>(null);
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
  });

  const { data: providerTypes = [], isLoading: isLoadingTypes } = useQuery<ProviderType[]>({
    queryKey: ["/api/provider-types"],
  });

  const handleDownloadTemplate = () => {
    window.open("/api/providers/template", "_blank");
  };

  const handleClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setImportOpen(true);
      setImportStage("uploading");
      const res = await fetch("/api/providers/upload", { method: "POST", body: formData, credentials: "include" });
      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          const j = JSON.parse(text);
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg || "Error al importar proveedores");
      }
      let inserted = 0;
      let updated = 0;
      let total = 0;
      try {
        const j = JSON.parse(text);
        inserted = j?.inserted ?? 0;
        updated = j?.updated ?? 0;
        total = j?.total ?? 0;
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setImportSummary({ inserted, updated, total });
      setImportStage("done");
      toast({ title: "Importación completada", description: `Insertados: ${inserted} · Actualizados: ${updated}` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "No se pudo importar", variant: "destructive" });
      setImportStage("done");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProviders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = (p: Provider) => {
      const inType = typeFilter === "all" || (p.type || "").toLowerCase() === typeFilter.toLowerCase();
      if (!q) return inType;
      const haystack = [p.name, p.tradeName, p.code, p.rfc, p.phone, p.email].map((s) => (s || "").toLowerCase());
      return inType && haystack.some((s) => s.includes(q));
    };
    return providers.filter(matches);
  }, [providers, searchQuery, typeFilter]);

  const numPages = Math.max(1, Math.ceil(filteredProviders.length / pageSize));
  const safePage = Math.min(page, numPages);
  const pagedProviders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProviders.slice(start, start + pageSize);
  }, [filteredProviders, safePage, pageSize]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Proveedores y Talleres</h1>
        <p className="text-muted-foreground">
          Directorio completo de proveedores de servicio
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers" data-testid="tab-providers">
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-provider-types">
            Tipos de Proveedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Proveedores Registrados</h2>
              <p className="text-muted-foreground mt-1">
                Administra los proveedores y talleres de servicio
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="outline" onClick={handleDownloadTemplate} data-testid="button-download-providers-template">
                Descargar plantilla
              </Button>
              <Button variant="outline" onClick={handleClickImport} data-testid="button-import-providers-csv">
                Importar CSV
              </Button>
              <AddProviderDialog />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proveedor…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                  data-testid="input-search-providers"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[220px]" data-testid="select-type-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo de servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {providerTypes.map((t) => (
                    <SelectItem key={t.id} value={(t.name || "").toLowerCase()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button variant={viewMode === "table" ? "default" : "outline"} size="icon" onClick={() => setViewMode("table")} data-testid="toggle-view-table">
                  <Rows className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "cards" ? "default" : "outline"} size="icon" onClick={() => setViewMode("cards")} data-testid="toggle-view-cards">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoadingProviders ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando proveedores...
            </div>
          ) : (
            <>
              <ProvidersTable providers={pagedProviders} view={viewMode} />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                <div className="text-sm text-muted-foreground">Mostrando {pagedProviders.length} de {filteredProviders.length} resultados</div>
                <div className="flex items-center gap-2">
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-[120px]" data-testid="select-page-size">
                      <SelectValue placeholder="Tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} data-testid="button-prev">Anterior</Button>
                    <span className="text-sm">Página {safePage} / {numPages}</span>
                    <Button variant="outline" onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={safePage >= numPages} data-testid="button-next">Siguiente</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Tipos de Proveedores</h2>
              <p className="text-muted-foreground mt-1">
                Administra las categorías de servicios de proveedores
              </p>
            </div>
            <AddProviderTypeDialog />
          </div>

          {isLoadingTypes ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando tipos...
            </div>
          ) : (
            <ProviderTypesTable providerTypes={providerTypes} />
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={importOpen} onOpenChange={(o) => setImportOpen(o)}>
        <DialogContent className="sm:max-w-md">
          {importStage !== "done" ? (
            <>
              <DialogHeader>
                <DialogTitle>Importando proveedores</DialogTitle>
                <DialogDescription>Estamos subiendo y procesando el archivo CSV…</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Importación completada</DialogTitle>
                <DialogDescription>Resumen de resultados</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2 text-sm">
                <div>Insertados: <span className="font-medium">{importSummary?.inserted ?? 0}</span></div>
                <div>Actualizados: <span className="font-medium">{importSummary?.updated ?? 0}</span></div>
                <div>Total en sistema: <span className="font-medium">{importSummary?.total ?? 0}</span></div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setImportOpen(false); setImportStage("idle"); setImportSummary(null); }}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
