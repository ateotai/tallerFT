import { useQuery } from "@tanstack/react-query";
import { AddRoleDialog } from "@/components/add-role-dialog";
import { RolesTable } from "@/components/roles-table";
import type { Role } from "@shared/schema";

export default function RolesPage() {
  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Roles</h1>
        <p className="text-muted-foreground">
          Gestión de roles de usuario
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Roles Registrados</h2>
            <p className="text-muted-foreground mt-1">
              Administra los roles del sistema
            </p>
          </div>
          <AddRoleDialog />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay roles registrados
          </div>
        ) : (
          <RolesTable roles={roles} />
        )}
      </div>
    </div>
  );
}
