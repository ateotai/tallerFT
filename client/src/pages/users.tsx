import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AddUserDialog } from "@/components/add-user-dialog";
import { EditUserDialog } from "@/components/edit-user-dialog";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deactivateMutation = useMutation({
    mutationFn: async (user: User) => {
      return await apiRequest("PUT", `/api/users/${user.id}`, { active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuario desactivado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo desactivar", variant: "destructive" });
    },
  });

  const roleColors: Record<string, string> = {
    Administrador: "border-red-600 text-red-600",
    Supervisor: "border-blue-600 text-blue-600",
    Mecánico: "border-green-600 text-green-600",
    Consulta: "border-gray-600 text-gray-600",
    user: "border-gray-600 text-gray-600",
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Usuarios y Roles</h1>
        <p className="text-muted-foreground">
          Gestión de usuarios y permisos del sistema
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
        <AddUserDialog />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Actividad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium" data-testid={`text-name-${user.id}`}>{user.fullName}</span>
                  </div>
                </TableCell>
                <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={roleColors[user.role] || "border-gray-600 text-gray-600"}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={user.active ? "border-green-600 text-green-600" : "border-gray-600 text-gray-600"}
                  >
                    {user.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {/* createdAt no se muestra como última actividad, pero puede servir */}
                  {user.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : ""}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingUser(user); setEditOpen(true); }}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingUser(user); setEditOpen(true); }}>Cambiar Rol</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingUser(user); setEditOpen(true); }}>Restablecer Contraseña</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deactivateMutation.mutate(user)}>
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EditUserDialog user={editingUser} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
