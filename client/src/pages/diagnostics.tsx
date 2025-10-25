import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Stethoscope } from "lucide-react";
import { DiagnosticsTable } from "@/components/diagnostics-table";
import { AddDiagnosticDialog } from "@/components/add-diagnostic-dialog";
import type { Diagnostic } from "@shared/schema";

export default function DiagnosticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const currentUserRole = "admin";

  const { data: diagnostics = [], isLoading } = useQuery<Diagnostic[]>({
    queryKey: ["/api/diagnostics"],
  });

  const filteredDiagnostics = diagnostics.filter((diagnostic) =>
    diagnostic.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (diagnostic.recommendations && diagnostic.recommendations.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Evaluación y Diagnóstico</h1>
        <p className="text-muted-foreground">
          Diagnósticos técnicos de reportes asignados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Diagnósticos
            </CardTitle>
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="stat-total-diagnostics">
              {diagnostics.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Diagnósticos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {currentUserRole === "admin" ? "Todos los Diagnósticos" : "Mis Diagnósticos"}
            </CardTitle>
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-filtered-diagnostics">
              {filteredDiagnostics.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {currentUserRole === "admin" ? "Visibles actualmente" : "Asignados a mí"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar diagnósticos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-diagnostics"
          />
        </div>
        <AddDiagnosticDialog />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando diagnósticos...
        </div>
      ) : (
        <DiagnosticsTable diagnostics={filteredDiagnostics} />
      )}
    </div>
  );
}
