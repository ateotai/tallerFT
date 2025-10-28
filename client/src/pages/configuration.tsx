import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Settings } from "lucide-react";
import { insertCompanyConfigurationSchema } from "@shared/schema";
import type { CompanyConfiguration, InsertCompanyConfiguration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const timezoneOptions = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Cancun", label: "Cancún (GMT-5)" },
  { value: "America/Monterrey", label: "Monterrey (GMT-6)" },
  { value: "America/Tijuana", label: "Tijuana (GMT-8)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
];

const currencyOptions = [
  { value: "MXN", label: "Peso Mexicano" },
  { value: "USD", label: "Dólar Americano" },
];

export default function ConfigurationPage() {
  const { toast } = useToast();

  const { data: configuration, isLoading } = useQuery<CompanyConfiguration | null>({
    queryKey: ["/api/configuration"],
  });

  const form = useForm<InsertCompanyConfiguration>({
    resolver: zodResolver(insertCompanyConfigurationSchema),
    defaultValues: {
      companyName: "",
      taxId: "",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      logo: "",
      timezone: "America/Mexico_City",
      currency: "MXN",
      maintenanceAlertDays: 7,
      inventoryLowStockAlert: true,
    },
  });

  useEffect(() => {
    if (configuration) {
      form.reset({
        companyName: configuration.companyName,
        taxId: configuration.taxId || "",
        companyAddress: configuration.companyAddress || "",
        companyPhone: configuration.companyPhone || "",
        companyEmail: configuration.companyEmail || "",
        logo: configuration.logo || "",
        timezone: configuration.timezone,
        currency: configuration.currency,
        maintenanceAlertDays: configuration.maintenanceAlertDays,
        inventoryLowStockAlert: configuration.inventoryLowStockAlert,
      });
    }
  }, [configuration, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCompanyConfiguration) => {
      if (configuration?.id) {
        return await apiRequest<CompanyConfiguration>(
          "PUT",
          `/api/configuration/${configuration.id}`,
          data
        );
      } else {
        return await apiRequest<CompanyConfiguration>(
          "POST",
          "/api/configuration",
          data
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      toast({
        title: "Configuración guardada",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al guardar configuración",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: InsertCompanyConfiguration) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configuración de la Empresa</h1>
          <p className="text-muted-foreground">
            Ajustes generales del sistema y datos de la empresa
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>
            Configure los datos generales de su empresa y preferencias del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nombre de la Empresa <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-company-name"
                          placeholder="Ej. Taller Automotriz XYZ"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC / Tax ID</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-tax-id"
                          placeholder="Ej. ABC123456DEF"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="textarea-company-address"
                        placeholder="Ingrese la dirección completa de la empresa"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-company-phone"
                          placeholder="Ej. +52 55 1234 5678"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-company-email"
                          type="email"
                          placeholder="contacto@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Logo</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-logo"
                        placeholder="https://ejemplo.com/logo.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      URL de la imagen del logo de la empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Preferencias del Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder="Seleccione zona horaria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezoneOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="Seleccione moneda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField
                    control={form.control}
                    name="maintenanceAlertDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días de alerta para mantenimiento</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-maintenance-alert-days"
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Días de anticipación para alertas de mantenimiento
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inventoryLowStockAlert"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Alertas de inventario bajo
                          </FormLabel>
                          <FormDescription>
                            Recibir notificaciones cuando el inventario esté bajo
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-inventory-alert"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button
                  data-testid="button-save"
                  type="submit"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
