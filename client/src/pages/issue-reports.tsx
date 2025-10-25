import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { IssueReportsTable } from "@/components/issue-reports-table";
import { AddIssueReportDialog } from "@/components/add-issue-report-dialog";
import type { Report } from "@shared/schema";

export default function IssueReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const inProgressCount = reports.filter((r) => r.status === "in_progress").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filteredReports = reports.filter((report) =>
    report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.notes && report.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reportes de Desperfectos</h1>
        <p className="text-muted-foreground">
          Registro y seguimiento de fallas y servicios vehiculares
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reportes
            </CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="stat-total-reports">
              {reports.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Reportes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400" data-testid="stat-pending-reports">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Esperando atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Proceso
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400" data-testid="stat-in-progress-reports">
              {inProgressCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">En atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resueltos
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400" data-testid="stat-resolved-reports">
              {resolvedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Completados</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar reportes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-issue-reports"
          />
        </div>
        <AddIssueReportDialog />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando reportes...
        </div>
      ) : (
        <IssueReportsTable reports={filteredReports} />
      )}
    </div>
  );
}
