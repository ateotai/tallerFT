import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import ServicesPage from "@/pages/services";
import ScheduledPage from "@/pages/scheduled";
import CategoriesPage from "@/pages/categories";
import ProvidersPage from "@/pages/providers";
import PurchaseQuotesPage from "@/pages/purchase-quotes";
import ClientsPage from "@/pages/clients";
import InventoryPage from "@/pages/inventory";
import ReportsPage from "@/pages/reports";
import IssueReportsPage from "@/pages/issue-reports";
import UsersPage from "@/pages/users";
import EmployeesPage from "@/pages/employees";
import DiagnosticsPage from "@/pages/diagnostics";
import WorkOrdersPage from "@/pages/work-orders";
import TestingValidationPage from "@/pages/testing-validation";
import WorkshopsPage from "@/pages/workshops";
import AreasPage from "@/pages/areas";
import ConfigurationPage from "@/pages/configuration";
import RolesPage from "@/pages/roles";
import PermissionsPage from "@/pages/permissions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/vehiculos" component={VehiclesPage} />
      <Route path="/servicios" component={ServicesPage} />
      <Route path="/programados" component={ScheduledPage} />
      <Route path="/categorias" component={CategoriesPage} />
      <Route path="/proveedores" component={ProvidersPage} />
      <Route path="/cotizaciones" component={PurchaseQuotesPage} />
      <Route path="/talleres" component={WorkshopsPage} />
      <Route path="/areas" component={AreasPage} />
      <Route path="/clientes" component={ClientsPage} />
      <Route path="/inventario" component={InventoryPage} />
      <Route path="/reportes" component={ReportsPage} />
      <Route path="/reportes-fallas" component={IssueReportsPage} />
      <Route path="/diagnosticos" component={DiagnosticsPage} />
      <Route path="/ordenes-trabajo" component={WorkOrdersPage} />
      <Route path="/prueba-validacion" component={TestingValidationPage} />
      <Route path="/empleados" component={EmployeesPage} />
      <Route path="/usuarios" component={UsersPage} />
      <Route path="/roles" component={RolesPage} />
      <Route path="/permisos" component={PermissionsPage} />
      <Route path="/configuracion" component={ConfigurationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <ThemeToggle />
              <UserProfileDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 sm:p-8">
              <Router />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <AppContent />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
