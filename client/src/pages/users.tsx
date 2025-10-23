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
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const users = [
    {
      id: "1",
      name: "Juan Pérez",
      email: "juan.perez@empresa.com",
      role: "Administrador",
      status: "active",
      lastActive: "Hace 2 horas",
    },
    {
      id: "2",
      name: "María García",
      email: "maria.garcia@empresa.com",
      role: "Supervisor",
      status: "active",
      lastActive: "Hace 5 min",
    },
    {
      id: "3",
      name: "Carlos López",
      email: "carlos.lopez@empresa.com",
      role: "Mecánico",
      status: "active",
      lastActive: "En línea",
    },
    {
      id: "4",
      name: "Ana Martínez",
      email: "ana.martinez@empresa.com",
      role: "Consulta",
      status: "inactive",
      lastActive: "Hace 2 días",
    },
  ];

  const roleColors = {
    Administrador: "border-red-600 text-red-600",
    Supervisor: "border-blue-600 text-blue-600",
    Mecánico: "border-green-600 text-green-600",
    Consulta: "border-gray-600 text-gray-600",
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Usuario
        </Button>
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
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium" data-testid={`text-name-${user.id}`}>{user.name}</span>
                  </div>
                </TableCell>
                <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={roleColors[user.role as keyof typeof roleColors]}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.status === "active"
                        ? "border-green-600 text-green-600"
                        : "border-gray-600 text-gray-600"
                    }
                  >
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastActive}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Cambiar Rol</DropdownMenuItem>
                      <DropdownMenuItem>Restablecer Contraseña</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}
