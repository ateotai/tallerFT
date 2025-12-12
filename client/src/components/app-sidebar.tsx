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
  ClipboardPlus,
  History,
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Fallas", url: "/reportes-fallas", icon: FileText },
  { title: "Tareas programadas", url: "/programados", icon: Calendar },
  { title: "Categorías de servicios", url: "/categorias", icon: Tag },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Clientes", url: "/clientes", icon: UserCircle },
  { title: "Vehículos", url: "/vehiculos", icon: Car },
  { title: "Proveedores", url: "/proveedores", icon: Users },
  { title: "Cotización de compras", url: "/cotizaciones", icon: ShoppingCart },
  { title: "Informes", url: "/reportes", icon: BarChart3 },
  { title: "Consulta de historial", url: "/consulta-historial", icon: History },
  
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

const checklistsMenuItems = [
  {
    title: "Tareas de Revision",
    url: "/checklists",
    icon: ClipboardCheck,
  },
];

const checklistsSubMenuItems = [
  {
    title: "Historial de Tareas de Revision",
    url: "/checklists/historial",
    icon: History,
  },
  {
    title: "Plantillas",
    url: "/checklists/plantillas",
    icon: FileText,
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
    title: "Empleados",
    url: "/empleados",
    icon: Briefcase,
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
    title: "Usuarios",
    url: "/usuarios",
    icon: Shield,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [checklistsOpen, setChecklistsOpen] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(true);
  const [rolesPermissionsOpen, setRolesPermissionsOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

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
    "Fallas": "Reportes de Fallas",
    "Tareas programadas": "Tareas Programadas",
    "Categorías de servicios": "Categorías",
    "Proveedores": "Proveedores",
    "Cotización de compras": "Cotizaciones de Compra",
    "Clientes": "Clientes",
    "Inventario": "Inventario",
    "Reportes": "Reportes",
    "Informes": "Reportes",
    "Consulta de historial": "Consulta de historial",
    "Reportes de historial": "Reportes",
    "Vehículos": "Vehículos",
    // Servicio y Mantenimiento
    "Evaluación y Diagnóstico": "Evaluación y Diagnóstico",
    "Órdenes de Trabajo": "Órdenes de Trabajo",
    "Prueba y Validación": "Prueba y Validación",
    "Tareas de Revision": "Checklists",
    "Historial de Tareas de Revision": "Checklists",
    "Plantillas": "Checklists",
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

  // Todos los usuarios autenticados pueden ver "Reportes de Fallas" por defecto
  allowedModules.add("Reportes de Fallas");
  // El módulo "Reportes" solo se habilita si el rol tiene permisos explícitos
  // Asegurar acceso de administrador al módulo de Checklists incluso si aún no está en la matriz de permisos
  const roleText = (user?.role || '').toLowerCase();
  if (roleText === 'admin' || roleText === 'administrador') {
    allowedModules.add("Checklists");
  }

  const requiredPermByTitle: Record<string, { name: string; module: string }> = {
    "Historial de Tareas de Revision": { name: "Ver historial de checklists", module: "Checklists" },
    "Plantillas": { name: "Administrar plantillas", module: "Checklists" },
    "Tareas de Revision": { name: "Ver checklists", module: "Checklists" },
    // Reportes
    "Reportes": { name: "Ver reportes", module: "Reportes" },
    "Informes": { name: "Ver reportes", module: "Reportes" },
    "Consulta de historial": { name: "Ver consulta de historial", module: "Consulta de historial" },
    "Reportes de historial": { name: "Ver reportes", module: "Reportes" },
  };

  const hasAccessByTitle = (title: string) => {
    const module = moduleByTitle[title];
    if (!module) return false;
    if (!allowedModules.has(module)) return false;
    const req = requiredPermByTitle[title];
    if (!req) return true;
    const isAdmin = roleText === 'admin' || roleText === 'administrador';
    return isAdmin ? true : hasPermission(req.name, req.module);
  };

  const filterItemsByPermissions = (items: { title: string; url: string; icon: any }[]) =>
    items.filter(item => hasAccessByTitle(item.title));

  const hasPermission = (permName: string, module: string) => {
    if (!permissions.length || !rolePerms.length) return false;
    const perm = permissions.find(p => p.name === permName && p.module === module);
    if (!perm) return false;
    return rolePerms.some(rp => rp.permissionId === perm.id);
  };

  const filterChecklistsByAction = (items: { title: string; url: string; icon: any }[]) =>
    items.filter(item => hasAccessByTitle(item.title));

  const isMaintenanceActive = maintenanceMenuItems.some(item => location === item.url);
  const isChecklistsActive = [
    ...checklistsMenuItems,
    ...checklistsSubMenuItems,
  ].some(item => location === item.url || location.startsWith("/checklists"));
  const isCompanyActive = companyMenuItems.some(item => location === item.url);
  const isRolesPermissionsActive = rolesPermissionsMenuItems.some(item => location === item.url);

  const filteredMain = filterItemsByPermissions(mainMenuItems);
  const filteredChecklistsSub = filterChecklistsByAction(checklistsSubMenuItems);
  const filteredMaintenance = filterItemsByPermissions(maintenanceMenuItems);
  const filteredCompany = filterItemsByPermissions(companyMenuItems);
  const filteredAdmin = filterItemsByPermissions(adminMenuItems);
  const filteredRolesPerm = filterItemsByPermissions(rolesPermissionsMenuItems);
  const isHistoryActive = location === "/consulta-historial" || location === "/consulta-historial/reportes";

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
        {filteredMain.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Módulos Principales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMain
                .filter((item) => item.title !== "Consulta de historial")
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title === "Clientes" ? "Razones Sociales" : item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

              {hasAccessByTitle("Consulta de historial") && (
                <Collapsible
                  open={historyOpen}
                  onOpenChange={setHistoryOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        data-testid="button-history-toggle"
                        isActive={isHistoryActive}
                      >
                        <History className="h-5 w-5" />
                        <span>Consulta de historial</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location === "/consulta-historial"}
                        data-testid={`link-consulta de historial`}
                      >
                        <Link href="/consulta-historial">
                          <History className="h-4 w-4" />
                          <span>Consulta de historial</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {hasAccessByTitle("Reportes de historial") && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location === "/consulta-historial/reportes"}
                          data-testid={`link-reportes de historial`}
                        >
                          <Link href="/consulta-historial/reportes">
                            <BarChart3 className="h-4 w-4" />
                            <span>Reportes de historial</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {/* Checklists debe ir antes de Gestión de servicios según el orden requerido */}
        {filteredChecklistsSub.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Tareas de Revision</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={checklistsOpen}
                onOpenChange={setChecklistsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      data-testid="button-checklists-toggle"
                      isActive={isChecklistsActive}
                    >
                      <ClipboardCheck className="h-5 w-5" />
                      <span>Tareas de Revision</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filteredChecklistsSub.map((item) => (
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
        )}

        {/* Gestión de servicios después de Checklists */}
        {filteredMaintenance.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Gestión de servicios</SidebarGroupLabel>
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
                      <span>Gestión de servicios</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filteredMaintenance.map((item) => (
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
        )}

        {filteredCompany.length > 0 && (
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
                      {filteredCompany.map((item) => (
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
        )}

        {(filteredAdmin.length > 0 || filteredRolesPerm.length > 0) && (
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAdmin.map((item) => (
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
              
              {filteredRolesPerm.length > 0 && (
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
                      {filteredRolesPerm.map((item) => (
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
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
