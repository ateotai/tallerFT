import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import ServicesPage from "@/pages/services";
import ScheduledPage from "@/pages/scheduled";
import CategoriesPage from "@/pages/categories";
import ProvidersPage from "@/pages/providers";
import ClientsPage from "@/pages/clients";
import InventoryPage from "@/pages/inventory";
import ReportsPage from "@/pages/reports";
import IssueReportsPage from "@/pages/issue-reports";
import UsersPage from "@/pages/users";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/vehiculos" component={VehiclesPage} />
      <Route path="/servicios" component={ServicesPage} />
      <Route path="/programados" component={ScheduledPage} />
      <Route path="/categorias" component={CategoriesPage} />
      <Route path="/proveedores" component={ProvidersPage} />
      <Route path="/clientes" component={ClientsPage} />
      <Route path="/inventario" component={InventoryPage} />
      <Route path="/reportes" component={ReportsPage} />
      <Route path="/reportes-fallas" component={IssueReportsPage} />
      <Route path="/usuarios" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <div className="max-w-7xl mx-auto p-6 sm:p-8">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
