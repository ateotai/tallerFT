import { useQuery } from "@tanstack/react-query";
import { AddWorkshopDialog } from "@/components/add-workshop-dialog";
import { WorkshopsTable } from "@/components/workshops-table";
import type { Workshop } from "@shared/schema";

export default function WorkshopsPage() {
  const { data: workshops = [], isLoading } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Talleres</h1>
        <p className="text-muted-foreground">
          Gestión de talleres donde se realiza el mantenimiento
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Talleres Registrados</h2>
            <p className="text-muted-foreground mt-1">
              Administra los talleres de mantenimiento
            </p>
          </div>
          <AddWorkshopDialog />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando talleres...
          </div>
        ) : workshops.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay talleres registrados
          </div>
        ) : (
          <WorkshopsTable workshops={workshops} />
        )}
      </div>
    </div>
  );
}
