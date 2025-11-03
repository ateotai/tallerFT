import {
  Car,
  Wrench,
  Calendar,
  Users,
  Package,
  BarChart3,
  Shield,
  Tag,
  UserCircle,
  LayoutDashboard,
  FileText,
  Briefcase,
  Stethoscope,
  ClipboardList,
  ClipboardCheck,
  ChevronDown,
  Building2,
  MapPin,
  Settings,
  UserCog,
  Lock,
  ShoppingCart,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Role, Permission, RolePermission } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Vehículos",
    url: "/vehiculos",
    icon: Car,
  },
  {
    title: "Tareas Programadas",
    url: "/programados",
    icon: Calendar,
  },
  {
    title: "Categorías",
    url: "/categorias",
    icon: Tag,
  },
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Users,
  },
  {
    title: "Cotizaciones de Compra",
    url: "/cotizaciones",
    icon: ShoppingCart,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: UserCircle,
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Package,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
  },
  {
    title: "Reportes de Fallas",
    url: "/reportes-fallas",
    icon: FileText,
  },
];

const maintenanceMenuItems = [
  {
    title: "Evaluación y Diagnóstico",
    url: "/diagnosticos",
    icon: Stethoscope,
  },
  {
    title: "Órdenes de Trabajo",
    url: "/ordenes-trabajo",
    icon: ClipboardList,
  },
  {
    title: "Prueba y Validación",
    url: "/prueba-validacion",
    icon: ClipboardCheck,
  },
];

const companyMenuItems = [
  {
    title: "Talleres",
    url: "/talleres",
    icon: Building2,
  },
  {
    title: "Áreas",
    url: "/areas",
    icon: MapPin,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
];

const rolesPermissionsMenuItems = [
  {
    title: "Roles",
    url: "/roles",
    icon: UserCog,
  },
  {
    title: "Permisos",
    url: "/permisos",
    icon: Lock,
  },
];

const adminMenuItems = [
  {
    title: "Empleados",
    url: "/empleados",
    icon: Briefcase,
  },
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: Shield,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(true);
  const [rolesPermissionsOpen, setRolesPermissionsOpen] = useState(true);

  // Obtener usuario y permisos del rol
  const { user } = useAuth();
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { data: permissions = [] } = useQuery<Permission[]>({ queryKey: ["/api/permissions"] });
  const currentRoleId = roles.find(r => r.name === user?.role)?.id;
  const { data: rolePerms = [] } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions", currentRoleId ?? ""],
    enabled: !!currentRoleId,
  });

  const moduleByTitle: Record<string, string> = {
    // Principales
    "Dashboard": "Dashboard",
    "Vehículos": "Vehículos",
    "Tareas Programadas": "Tareas Programadas",
    "Categorías": "Categorías",
    "Proveedores": "Proveedores",
    "Cotizaciones de Compra": "Cotizaciones de Compra",
    "Clientes": "Clientes",
    "Inventario": "Inventario",
    "Reportes": "Reportes",
    "Reportes de Fallas": "Reportes de Fallas",
    // Servicio y Mantenimiento
    "Evaluación y Diagnóstico": "Evaluación y Diagnóstico",
    "Órdenes de Trabajo": "Órdenes de Trabajo",
    "Prueba y Validación": "Prueba y Validación",
    // Empresa
    "Talleres": "Talleres",
    "Áreas": "Áreas",
    "Configuración": "Configuración",
    // Administración
    "Empleados": "Empleados",
    "Usuarios": "Usuarios",
    // Roles y Permisos
    "Roles": "Roles",
    "Permisos": "Permisos",
  };

  const allowedModules = new Set<string>();
  if (permissions.length && rolePerms.length) {
    for (const rp of rolePerms) {
      const perm = permissions.find(p => p.id === rp.permissionId);
      if (perm?.module) {
        allowedModules.add(perm.module);
      }
    }
  }

  // Todos los usuarios autenticados deben poder ver "Reportes de Fallas"
  // incluso si aún no tienen configurada la matriz de permisos.
  allowedModules.add("Reportes de Fallas");
  // Los mecánicos necesitan consultar el historial por vehículo.
  // Habilitamos también el módulo "Vehículos" para todos los usuarios autenticados.
  allowedModules.add("Vehículos");

  const filterItemsByPermissions = (items: { title: string; url: string; icon: any }[]) =>
    items.filter(item => allowedModules.has(moduleByTitle[item.title]));

  const isMaintenanceActive = maintenanceMenuItems.some(item => location === item.url);
  const isCompanyActive = companyMenuItems.some(item => location === item.url);
  const isRolesPermissionsActive = rolesPermissionsMenuItems.some(item => location === item.url);

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">FleetMaint</h2>
            <p className="text-xs text-muted-foreground">Gestión Vehicular</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos Principales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterItemsByPermissions(mainMenuItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Servicio y Mantenimiento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={maintenanceOpen}
                onOpenChange={setMaintenanceOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      data-testid="button-maintenance-toggle"
                      isActive={isMaintenanceActive}
                    >
                      <Wrench className="h-5 w-5" />
                      <span>Gestión de Servicio</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filterItemsByPermissions(maintenanceMenuItems).map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === item.url}
                            data-testid={`link-${item.title.toLowerCase()}`}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Empresa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={companyOpen}
                onOpenChange={setCompanyOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      data-testid="button-company-toggle"
                      isActive={isCompanyActive}
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Gestión de Empresa</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filterItemsByPermissions(companyMenuItems).map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === item.url}
                            data-testid={`link-${item.title.toLowerCase()}`}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterItemsByPermissions(adminMenuItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <Collapsible
                open={rolesPermissionsOpen}
                onOpenChange={setRolesPermissionsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      data-testid="button-roles-permissions-toggle"
                      isActive={isRolesPermissionsActive}
                    >
                      <UserCog className="h-5 w-5" />
                      <span>Roles y Permisos</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filterItemsByPermissions(rolesPermissionsMenuItems).map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === item.url}
                            data-testid={`link-${item.title.toLowerCase()}`}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
