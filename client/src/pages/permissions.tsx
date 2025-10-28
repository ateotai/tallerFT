import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Role, Permission, RolePermission } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function PermissionsPage() {
  const { toast } = useToast();
  const [pendingMutations, setPendingMutations] = useState<Set<string>>(new Set());

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const { data: rolePermissions = [], isLoading: rolePermissionsLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions"],
  });

  const isLoading = rolesLoading || permissionsLoading || rolePermissionsLoading;

  const assignMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return apiRequest("POST", "/api/role-permissions", { roleId, permissionId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      const mutationKey = `${variables.roleId}-${variables.permissionId}`;
      setPendingMutations(prev => {
        const next = new Set(prev);
        next.delete(mutationKey);
        return next;
      });
      toast({
        title: "Permiso asignado",
        description: "El permiso ha sido asignado correctamente al rol",
      });
    },
    onError: (_, variables) => {
      const mutationKey = `${variables.roleId}-${variables.permissionId}`;
      setPendingMutations(prev => {
        const next = new Set(prev);
        next.delete(mutationKey);
        return next;
      });
      toast({
        title: "Error",
        description: "No se pudo asignar el permiso",
        variant: "destructive",
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return apiRequest("DELETE", `/api/role-permissions/${roleId}/${permissionId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      const mutationKey = `${variables.roleId}-${variables.permissionId}`;
      setPendingMutations(prev => {
        const next = new Set(prev);
        next.delete(mutationKey);
        return next;
      });
      toast({
        title: "Permiso removido",
        description: "El permiso ha sido removido correctamente del rol",
      });
    },
    onError: (_, variables) => {
      const mutationKey = `${variables.roleId}-${variables.permissionId}`;
      setPendingMutations(prev => {
        const next = new Set(prev);
        next.delete(mutationKey);
        return next;
      });
      toast({
        title: "Error",
        description: "No se pudo remover el permiso",
        variant: "destructive",
      });
    },
  });

  const groupPermissionsByModule = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  };

  const hasPermission = (roleId: number, permissionId: number): boolean => {
    return rolePermissions.some(
      rp => rp.roleId === roleId && rp.permissionId === permissionId
    );
  };

  const handleCheckboxChange = (roleId: number, permissionId: number, checked: boolean) => {
    const mutationKey = `${roleId}-${permissionId}`;
    setPendingMutations(prev => new Set(prev).add(mutationKey));
    
    if (checked) {
      assignMutation.mutate({ roleId, permissionId });
    } else {
      unassignMutation.mutate({ roleId, permissionId });
    }
  };

  const groupedPermissions = groupPermissionsByModule(permissions);
  const moduleNames = Object.keys(groupedPermissions).sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Asignación de Permisos</h1>
        <p className="text-muted-foreground">
          Gestiona los permisos de cada rol por módulo
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay roles registrados. Crea roles primero para asignar permisos.
        </div>
      ) : permissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay permisos registrados. Crea permisos primero para asignarlos a roles.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md border">
            <div className="p-4 bg-muted/30">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Permiso
                  </h3>
                </div>
                <div className="col-span-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${roles.length}, 1fr)` }}>
                  {roles.map(role => (
                    <div key={role.id} className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {role.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Accordion type="multiple" className="w-full">
              {moduleNames.map(moduleName => (
                <AccordionItem 
                  key={moduleName} 
                  value={moduleName}
                  data-testid={`accordion-module-${moduleName}`}
                >
                  <AccordionTrigger className="px-4 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{moduleName}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({groupedPermissions[moduleName].length} permisos)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableBody>
                        {groupedPermissions[moduleName].map(permission => (
                          <TableRow key={permission.id}>
                            <TableCell className="font-medium w-1/3">
                              <div>
                                <div className="text-sm">{permission.name}</div>
                                {permission.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            {roles.map(role => {
                              const mutationKey = `${role.id}-${permission.id}`;
                              const isPending = pendingMutations.has(mutationKey);
                              const isChecked = hasPermission(role.id, permission.id);
                              
                              return (
                                <TableCell key={role.id} className="text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      data-testid={`checkbox-permission-${permission.id}-role-${role.id}`}
                                      checked={isChecked}
                                      disabled={isPending}
                                      onCheckedChange={(checked) => 
                                        handleCheckboxChange(role.id, permission.id, checked as boolean)
                                      }
                                    />
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
}
