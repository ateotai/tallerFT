import { useQuery } from "@tanstack/react-query";
import { AddAreaDialog } from "@/components/add-area-dialog";
import { AreasTable } from "@/components/areas-table";
import type { Area } from "@shared/schema";

export default function AreasPage() {
  const { data: areas = [], isLoading } = useQuery<Area[]>({
    queryKey: ["/api/areas"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Áreas</h1>
        <p className="text-muted-foreground">
          Gestión de áreas operativas de la empresa
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Áreas Registradas</h2>
            <p className="text-muted-foreground mt-1">
              Administra las áreas operativas
            </p>
          </div>
          <AddAreaDialog />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando áreas...
          </div>
        ) : areas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay áreas registradas
          </div>
        ) : (
          <AreasTable areas={areas} />
        )}
      </div>
    </div>
  );
}
