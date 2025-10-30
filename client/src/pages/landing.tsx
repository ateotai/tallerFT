import { Wrench, LineChart, Bell, Shield, Users, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: Truck,
      title: "Gestión de Flota",
      description: "Administra todos tus vehículos desde un solo lugar. Control completo de marca, modelo, placas y estado.",
    },
    {
      icon: Wrench,
      title: "Mantenimiento Programado",
      description: "Programa y da seguimiento a todos los servicios de mantenimiento. Nunca pierdas una fecha importante.",
    },
    {
      icon: LineChart,
      title: "Reportes y Análisis",
      description: "Visualiza costos, tendencias y estadísticas detalladas. Toma decisiones basadas en datos.",
    },
    {
      icon: Bell,
      title: "Alertas Automáticas",
      description: "Recibe notificaciones sobre servicios próximos, inventario bajo y reportes de fallas.",
    },
    {
      icon: Users,
      title: "Gestión de Personal",
      description: "Administra empleados, técnicos y asignaciones de trabajo. Control completo del equipo.",
    },
    {
      icon: Shield,
      title: "Seguridad y Roles",
      description: "Control de acceso basado en roles. Protege la información sensible de tu empresa.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Sistema Profesional</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground" data-testid="text-main-title">
              Sistema de Gestión de
              <br />
              Mantenimiento Vehicular
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-description">
              Optimiza la gestión de tu flota vehicular con una plataforma integral que te permite 
              controlar mantenimiento, inventario, reportes y mucho más desde un solo lugar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="min-w-48"
                data-testid="button-login"
              >
                Iniciar Sesión
              </Button>
              <p className="text-sm text-muted-foreground">
                Accede con tu cuenta de Replit
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-features-title">
            Características Principales
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todo lo que necesitas para una gestión eficiente de tu flota vehicular
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="hover-elevate"
                data-testid={`card-feature-${index}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="bg-muted/50 border-t">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Listo para optimizar tu gestión vehicular?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comienza a usar el sistema ahora mismo y lleva el control total de tu flota.
            </p>
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="min-w-48"
              data-testid="button-login-footer"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 Sistema de Gestión de Mantenimiento Vehicular</p>
            <p>Desarrollado con Replit</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
