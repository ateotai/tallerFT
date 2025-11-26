import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ClientCard } from "@/components/client-card";
import { AddClientDialog, AddClientBranchDialog } from "@/components/add-client-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import type { Client } from "@shared/schema";
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

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active").length;

  const [importSummary, setImportSummary] = useState<null | { created: number; updated: number; errors: Array<{ row: number; error: string }> }>(null);
  const [importOpen, setImportOpen] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/clients/import", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al importar");
      }
      return await res.json();
    },
    onSuccess: async (summary) => {
      setImportSummary(summary);
      setImportOpen(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/client-branches"] });
    },
    onError: (error: Error) => {
      console.error("Error de importación:", error);
      alert("Error de importación: " + error.message);
    },
  });

  const downloadTemplate = async () => {
    const res = await fetch("/api/clients/template", { credentials: "include" });
    if (!res.ok) {
      alert("Error: No se pudo descargar la plantilla");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = ["Nombre","Empresa","Teléfono","Email","Dirección","Estatus"];
    const rows = filteredClients.map((c) => [
      c.name,
      c.company ?? "",
      c.phone,
      c.email,
      c.address,
      c.status,
    ]);
    const escape = (s: string) => '"' + s.replace(/"/g,'""') + '"';
    const sep = ";";
    const bom = "\ufeff";
    const csv = bom + [header.map(escape).join(sep), ...rows.map(r => r.map(escape).join(sep))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Clientes</h1>
        <p className="text-muted-foreground">
          Gestión de clientes y sus vehículos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Total Clientes</p>
          <p className="text-3xl font-bold" data-testid="stat-total-clients">{totalClients}</p>
        </div>
        <div className="p-6 border rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Clientes Activos</p>
          <p className="text-3xl font-bold text-green-600" data-testid="stat-active-clients">
            {activeClients}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-clients"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <AddClientDialog />
          <AddClientBranchDialog />
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importMutation.mutate(f);
              e.currentTarget.value = "";
            }}
          />
          <Button variant="outline" onClick={downloadTemplate}>Plantilla</Button>
          <Button variant="outline" onClick={exportCsv}>Exportar CSV</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando clientes...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

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
