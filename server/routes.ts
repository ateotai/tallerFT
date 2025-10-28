import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError, z } from "zod";
import {
  insertVehicleSchema,
  insertVehicleTypeSchema,
  insertServiceSchema,
  insertScheduledMaintenanceSchema,
  insertServiceCategorySchema,
  insertServiceSubcategorySchema,
  insertProviderSchema,
  insertProviderTypeSchema,
  insertClientSchema,
  insertInventoryCategorySchema,
  insertInventorySchema,
  insertInventoryMovementSchema,
  insertReportSchema,
  insertEmployeeTypeSchema,
  insertEmployeeSchema,
  insertDiagnosticSchema,
  insertWorkOrderSchema,
  insertWorkOrderTaskSchema,
  insertWorkOrderMaterialSchema,
  insertWorkOrderEvidenceSchema,
  insertNotificationSchema,
  insertWorkshopSchema,
  insertAreaSchema,
  insertCompanyConfigurationSchema,
} from "@shared/schema";

function validateId(id: string): number | null {
  const trimmed = id.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const num = Number(trimmed);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/vehicle-types", async (req, res) => {
    try {
      const vehicleTypes = await storage.getVehicleTypes();
      res.json(vehicleTypes);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      res.status(500).json({ error: "Error al obtener tipos de vehículos" });
    }
  });

  app.get("/api/vehicle-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const vehicleType = await storage.getVehicleType(id);
      if (!vehicleType) {
        return res.status(404).json({ error: "Tipo de vehículo no encontrado" });
      }
      res.json(vehicleType);
    } catch (error) {
      console.error("Error fetching vehicle type:", error);
      res.status(500).json({ error: "Error al obtener tipo de vehículo" });
    }
  });

  app.post("/api/vehicle-types", async (req, res) => {
    try {
      const validatedData = insertVehicleTypeSchema.parse(req.body);
      const vehicleType = await storage.createVehicleType(validatedData);
      res.status(201).json(vehicleType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating vehicle type:", error);
      res.status(500).json({ error: "Error al crear tipo de vehículo" });
    }
  });

  app.put("/api/vehicle-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertVehicleTypeSchema.partial().parse(req.body);
      const vehicleType = await storage.updateVehicleType(id, validatedData);
      if (!vehicleType) {
        return res.status(404).json({ error: "Tipo de vehículo no encontrado" });
      }
      res.json(vehicleType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating vehicle type:", error);
      res.status(500).json({ error: "Error al actualizar tipo de vehículo" });
    }
  });

  app.delete("/api/vehicle-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteVehicleType(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tipo de vehículo no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      res.status(500).json({ error: "Error al eliminar tipo de vehículo" });
    }
  });

  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Error al obtener vehículos" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ error: "Error al obtener vehículo" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating vehicle:", error);
      res.status(500).json({ error: "Error al crear vehículo" });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, validatedData);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating vehicle:", error);
      res.status(500).json({ error: "Error al actualizar vehículo" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteVehicle(id);
      if (!deleted) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Error al eliminar vehículo" });
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? validateId(req.query.vehicleId as string) : null;
      if (req.query.vehicleId && vehicleId === null) {
        return res.status(400).json({ error: "vehicleId inválido" });
      }
      const services = vehicleId
        ? await storage.getServicesByVehicle(vehicleId)
        : await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Error al obtener servicios" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ error: "Servicio no encontrado" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ error: "Error al obtener servicio" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating service:", error);
      res.status(500).json({ error: "Error al crear servicio" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, validatedData);
      if (!service) {
        return res.status(404).json({ error: "Servicio no encontrado" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Error al actualizar servicio" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteService(id);
      if (!deleted) {
        return res.status(404).json({ error: "Servicio no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Error al eliminar servicio" });
    }
  });

  app.get("/api/scheduled-maintenance", async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? validateId(req.query.vehicleId as string) : null;
      if (req.query.vehicleId && vehicleId === null) {
        return res.status(400).json({ error: "vehicleId inválido" });
      }
      const items = vehicleId
        ? await storage.getScheduledMaintenanceByVehicle(vehicleId)
        : await storage.getScheduledMaintenance();
      res.json(items);
    } catch (error) {
      console.error("Error fetching scheduled maintenance:", error);
      res.status(500).json({ error: "Error al obtener mantenimientos programados" });
    }
  });

  app.get("/api/scheduled-maintenance/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const item = await storage.getScheduledMaintenanceItem(id);
      if (!item) {
        return res.status(404).json({ error: "Mantenimiento programado no encontrado" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching scheduled maintenance item:", error);
      res.status(500).json({ error: "Error al obtener mantenimiento programado" });
    }
  });

  app.post("/api/scheduled-maintenance", async (req, res) => {
    try {
      const validatedData = insertScheduledMaintenanceSchema.parse(req.body);
      const item = await storage.createScheduledMaintenance(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating scheduled maintenance:", error);
      res.status(500).json({ error: "Error al crear mantenimiento programado" });
    }
  });

  app.put("/api/scheduled-maintenance/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertScheduledMaintenanceSchema.partial().parse(req.body);
      const item = await storage.updateScheduledMaintenance(id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Mantenimiento programado no encontrado" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating scheduled maintenance:", error);
      res.status(500).json({ error: "Error al actualizar mantenimiento programado" });
    }
  });

  app.delete("/api/scheduled-maintenance/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteScheduledMaintenance(id);
      if (!deleted) {
        return res.status(404).json({ error: "Mantenimiento programado no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scheduled maintenance:", error);
      res.status(500).json({ error: "Error al eliminar mantenimiento programado" });
    }
  });

  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ error: "Error al obtener categorías de servicio" });
    }
  });

  app.get("/api/service-categories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const category = await storage.getServiceCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching service category:", error);
      res.status(500).json({ error: "Error al obtener categoría" });
    }
  });

  app.post("/api/service-categories", async (req, res) => {
    try {
      const validatedData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating service category:", error);
      res.status(500).json({ error: "Error al crear categoría" });
    }
  });

  app.put("/api/service-categories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertServiceCategorySchema.partial().parse(req.body);
      const category = await storage.updateServiceCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating service category:", error);
      res.status(500).json({ error: "Error al actualizar categoría" });
    }
  });

  app.delete("/api/service-categories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteServiceCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service category:", error);
      res.status(500).json({ error: "Error al eliminar categoría" });
    }
  });

  app.get("/api/service-subcategories", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? validateId(req.query.categoryId as string) : null;
      if (req.query.categoryId && categoryId === null) {
        return res.status(400).json({ error: "categoryId inválido" });
      }
      const subcategories = categoryId !== null
        ? await storage.getServiceSubcategoriesByCategory(categoryId)
        : await storage.getServiceSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching service subcategories:", error);
      res.status(500).json({ error: "Error al obtener subcategorías de servicio" });
    }
  });

  app.get("/api/service-subcategories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const subcategory = await storage.getServiceSubcategory(id);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategoría no encontrada" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching service subcategory:", error);
      res.status(500).json({ error: "Error al obtener subcategoría" });
    }
  });

  app.post("/api/service-subcategories", async (req, res) => {
    try {
      const validatedData = insertServiceSubcategorySchema.parse(req.body);
      const subcategory = await storage.createServiceSubcategory(validatedData);
      res.status(201).json(subcategory);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating service subcategory:", error);
      res.status(500).json({ error: "Error al crear subcategoría" });
    }
  });

  app.put("/api/service-subcategories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertServiceSubcategorySchema.partial().parse(req.body);
      const subcategory = await storage.updateServiceSubcategory(id, validatedData);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategoría no encontrada" });
      }
      res.json(subcategory);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating service subcategory:", error);
      res.status(500).json({ error: "Error al actualizar subcategoría" });
    }
  });

  app.delete("/api/service-subcategories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteServiceSubcategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Subcategoría no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service subcategory:", error);
      res.status(500).json({ error: "Error al eliminar subcategoría" });
    }
  });

  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Error al obtener proveedores" });
    }
  });

  app.get("/api/providers/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const provider = await storage.getProvider(id);
      if (!provider) {
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ error: "Error al obtener proveedor" });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const validatedData = insertProviderSchema.parse(req.body);
      const provider = await storage.createProvider(validatedData);
      res.status(201).json(provider);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating provider:", error);
      res.status(500).json({ error: "Error al crear proveedor" });
    }
  });

  app.put("/api/providers/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertProviderSchema.partial().parse(req.body);
      const provider = await storage.updateProvider(id, validatedData);
      if (!provider) {
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }
      res.json(provider);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating provider:", error);
      res.status(500).json({ error: "Error al actualizar proveedor" });
    }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteProvider(id);
      if (!deleted) {
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ error: "Error al eliminar proveedor" });
    }
  });

  app.get("/api/provider-types", async (req, res) => {
    try {
      const providerTypes = await storage.getProviderTypes();
      res.json(providerTypes);
    } catch (error) {
      console.error("Error fetching provider types:", error);
      res.status(500).json({ error: "Error al obtener tipos de proveedores" });
    }
  });

  app.get("/api/provider-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const providerType = await storage.getProviderType(id);
      if (!providerType) {
        return res.status(404).json({ error: "Tipo de proveedor no encontrado" });
      }
      res.json(providerType);
    } catch (error) {
      console.error("Error fetching provider type:", error);
      res.status(500).json({ error: "Error al obtener tipo de proveedor" });
    }
  });

  app.post("/api/provider-types", async (req, res) => {
    try {
      const validatedData = insertProviderTypeSchema.parse(req.body);
      const providerType = await storage.createProviderType(validatedData);
      res.status(201).json(providerType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating provider type:", error);
      res.status(500).json({ error: "Error al crear tipo de proveedor" });
    }
  });

  app.put("/api/provider-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertProviderTypeSchema.partial().parse(req.body);
      const providerType = await storage.updateProviderType(id, validatedData);
      if (!providerType) {
        return res.status(404).json({ error: "Tipo de proveedor no encontrado" });
      }
      res.json(providerType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating provider type:", error);
      res.status(500).json({ error: "Error al actualizar tipo de proveedor" });
    }
  });

  app.delete("/api/provider-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteProviderType(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tipo de proveedor no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting provider type:", error);
      res.status(500).json({ error: "Error al eliminar tipo de proveedor" });
    }
  });

  app.get("/api/inventory-categories", async (req, res) => {
    try {
      const categories = await storage.getInventoryCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching inventory categories:", error);
      res.status(500).json({ error: "Error al obtener categorías de inventario" });
    }
  });

  app.get("/api/inventory-categories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const category = await storage.getInventoryCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching inventory category:", error);
      res.status(500).json({ error: "Error al obtener categoría" });
    }
  });

  app.post("/api/inventory-categories", async (req, res) => {
    try {
      const validatedData = insertInventoryCategorySchema.parse(req.body);
      const category = await storage.createInventoryCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating inventory category:", error);
      res.status(500).json({ error: "Error al crear categoría" });
    }
  });

  app.put("/api/inventory-categories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertInventoryCategorySchema.partial().parse(req.body);
      const category = await storage.updateInventoryCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating inventory category:", error);
      res.status(500).json({ error: "Error al actualizar categoría" });
    }
  });

  app.delete("/api/inventory-categories/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteInventoryCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory category:", error);
      res.status(500).json({ error: "Error al eliminar categoría" });
    }
  });

  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Error al obtener clientes" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ error: "Error al obtener cliente" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ error: "Error al crear cliente" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, validatedData);
      if (!client) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ error: "Error al actualizar cliente" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Error al eliminar cliente" });
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Error al obtener inventario" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ error: "Error al obtener artículo" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating inventory item:", error);
      res.status(500).json({ error: "Error al crear artículo" });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Error al actualizar artículo" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteInventoryItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Error al eliminar artículo" });
    }
  });

  app.get("/api/inventory-movements", async (req, res) => {
    try {
      const inventoryId = req.query.inventoryId ? validateId(req.query.inventoryId as string) : null;
      if (req.query.inventoryId && inventoryId === null) {
        return res.status(400).json({ error: "inventoryId inválido" });
      }
      const movements = inventoryId
        ? await storage.getInventoryMovementsByItem(inventoryId)
        : await storage.getInventoryMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      res.status(500).json({ error: "Error al obtener movimientos de inventario" });
    }
  });

  app.post("/api/inventory-movements", async (req, res) => {
    try {
      const validatedData = insertInventoryMovementSchema.parse(req.body);
      const movement = await storage.createInventoryMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating inventory movement:", error);
      res.status(500).json({ error: "Error al crear movimiento de inventario" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? validateId(req.query.vehicleId as string) : null;
      const userId = req.query.userId ? validateId(req.query.userId as string) : null;
      
      if (req.query.vehicleId && vehicleId === null) {
        return res.status(400).json({ error: "vehicleId inválido" });
      }
      if (req.query.userId && userId === null) {
        return res.status(400).json({ error: "userId inválido" });
      }
      
      let reports;
      if (vehicleId) {
        reports = await storage.getReportsByVehicle(vehicleId);
      } else if (userId) {
        reports = await storage.getReportsByUser(userId);
      } else {
        reports = await storage.getReports();
      }
      
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Error al obtener reportes" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Reporte no encontrado" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Error al obtener reporte" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      
      // Create notification for new report
      await storage.createNotification({
        type: "report",
        title: "Nuevo reporte de falla",
        message: `Se ha registrado un nuevo reporte de falla para el vehículo`,
        read: false,
      });
      
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Error al crear reporte" });
    }
  });

  app.put("/api/reports/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const updateSchema = insertReportSchema.partial().extend({
        status: z.enum(["pending", "in_progress", "resolved"]).optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const report = await storage.updateReport(id, validatedData);
      if (!report) {
        return res.status(404).json({ error: "Reporte no encontrado" });
      }
      res.json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Error al actualizar reporte" });
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteReport(id);
      if (!deleted) {
        return res.status(404).json({ error: "Reporte no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: "Error al eliminar reporte" });
    }
  });

  app.get("/api/employee-types", async (req, res) => {
    try {
      const employeeTypes = await storage.getEmployeeTypes();
      res.json(employeeTypes);
    } catch (error) {
      console.error("Error fetching employee types:", error);
      res.status(500).json({ error: "Error al obtener tipos de empleado" });
    }
  });

  app.get("/api/employee-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const employeeType = await storage.getEmployeeType(id);
      if (!employeeType) {
        return res.status(404).json({ error: "Tipo de empleado no encontrado" });
      }
      res.json(employeeType);
    } catch (error) {
      console.error("Error fetching employee type:", error);
      res.status(500).json({ error: "Error al obtener tipo de empleado" });
    }
  });

  app.post("/api/employee-types", async (req, res) => {
    try {
      const validatedData = insertEmployeeTypeSchema.parse(req.body);
      const employeeType = await storage.createEmployeeType(validatedData);
      res.status(201).json(employeeType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating employee type:", error);
      res.status(500).json({ error: "Error al crear tipo de empleado" });
    }
  });

  app.put("/api/employee-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertEmployeeTypeSchema.partial().parse(req.body);
      const employeeType = await storage.updateEmployeeType(id, validatedData);
      if (!employeeType) {
        return res.status(404).json({ error: "Tipo de empleado no encontrado" });
      }
      res.json(employeeType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating employee type:", error);
      res.status(500).json({ error: "Error al actualizar tipo de empleado" });
    }
  });

  app.delete("/api/employee-types/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteEmployeeType(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tipo de empleado no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee type:", error);
      res.status(500).json({ error: "Error al eliminar tipo de empleado" });
    }
  });

  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Error al obtener empleados" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ error: "Error al obtener empleado" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ error: "Error al crear empleado" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      if (!employee) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Error al actualizar empleado" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteEmployee(id);
      if (!deleted) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Error al eliminar empleado" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  });

  app.post("/api/reports/:id/assign", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const { employeeId } = req.body;
      if (!employeeId || typeof employeeId !== 'number') {
        return res.status(400).json({ error: "Se requiere employeeId válido" });
      }
      const result = await storage.assignReportToEmployee(id, employeeId);
      res.json(result);
    } catch (error) {
      console.error("Error assigning report:", error);
      res.status(500).json({ error: "Error al asignar reporte" });
    }
  });

  app.get("/api/diagnostics", async (req, res) => {
    try {
      const reportId = req.query.reportId ? validateId(req.query.reportId as string) : null;
      const employeeId = req.query.employeeId ? validateId(req.query.employeeId as string) : null;
      
      if (req.query.reportId && reportId === null) {
        return res.status(400).json({ error: "reportId inválido" });
      }
      if (req.query.employeeId && employeeId === null) {
        return res.status(400).json({ error: "employeeId inválido" });
      }
      
      let diagnostics;
      if (reportId) {
        diagnostics = await storage.getDiagnosticsByReport(reportId);
      } else if (employeeId) {
        diagnostics = await storage.getDiagnosticsByEmployee(employeeId);
      } else {
        diagnostics = await storage.getDiagnostics();
      }
      res.json(diagnostics);
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
      res.status(500).json({ error: "Error al obtener diagnósticos" });
    }
  });

  app.get("/api/diagnostics/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const diagnostic = await storage.getDiagnostic(id);
      if (!diagnostic) {
        return res.status(404).json({ error: "Diagnóstico no encontrado" });
      }
      res.json(diagnostic);
    } catch (error) {
      console.error("Error fetching diagnostic:", error);
      res.status(500).json({ error: "Error al obtener diagnóstico" });
    }
  });

  app.post("/api/diagnostics", async (req, res) => {
    try {
      const validatedData = insertDiagnosticSchema.parse(req.body);
      const diagnostic = await storage.createDiagnostic(validatedData);
      
      // Create notification for new diagnostic
      await storage.createNotification({
        type: "diagnostic",
        title: "Nuevo diagnóstico creado",
        message: `Se ha creado un diagnóstico profesional para un reporte de falla`,
        read: false,
      });
      
      res.status(201).json(diagnostic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating diagnostic:", error);
      res.status(500).json({ error: "Error al crear diagnóstico" });
    }
  });

  app.put("/api/diagnostics/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertDiagnosticSchema.partial().parse(req.body);
      const diagnostic = await storage.updateDiagnostic(id, validatedData);
      if (!diagnostic) {
        return res.status(404).json({ error: "Diagnóstico no encontrado" });
      }
      res.json(diagnostic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating diagnostic:", error);
      res.status(500).json({ error: "Error al actualizar diagnóstico" });
    }
  });

  app.delete("/api/diagnostics/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteDiagnostic(id);
      if (!deleted) {
        return res.status(404).json({ error: "Diagnóstico no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting diagnostic:", error);
      res.status(500).json({ error: "Error al eliminar diagnóstico" });
    }
  });

  app.post("/api/diagnostics/:id/approve", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const { userId } = req.body;
      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Se requiere userId válido" });
      }
      const result = await storage.approveDiagnostic(id, userId);
      
      // Create notification for approved diagnostic
      await storage.createNotification({
        type: "work_order",
        title: "Diagnóstico aprobado",
        message: `Se ha aprobado un diagnóstico y se ha creado la orden de trabajo automáticamente`,
        read: false,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error approving diagnostic:", error);
      res.status(500).json({ error: "Error al aprobar diagnóstico" });
    }
  });

  app.get("/api/work-orders", async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? validateId(req.query.vehicleId as string) : null;
      const employeeId = req.query.employeeId ? validateId(req.query.employeeId as string) : null;
      
      if (req.query.vehicleId && vehicleId === null) {
        return res.status(400).json({ error: "vehicleId inválido" });
      }
      if (req.query.employeeId && employeeId === null) {
        return res.status(400).json({ error: "employeeId inválido" });
      }
      
      let workOrders;
      if (vehicleId) {
        workOrders = await storage.getWorkOrdersByVehicle(vehicleId);
      } else if (employeeId) {
        workOrders = await storage.getWorkOrdersByEmployee(employeeId);
      } else {
        workOrders = await storage.getWorkOrders();
      }
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ error: "Error al obtener órdenes de trabajo" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const workOrder = await storage.getWorkOrder(id);
      if (!workOrder) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error fetching work order:", error);
      res.status(500).json({ error: "Error al obtener orden de trabajo" });
    }
  });

  app.post("/api/work-orders", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(validatedData);
      
      // Create notification for new work order
      await storage.createNotification({
        type: "work_order",
        title: "Nueva orden de trabajo",
        message: `Se ha creado una nueva orden de trabajo`,
        read: false,
      });
      
      res.status(201).json(workOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating work order:", error);
      res.status(500).json({ error: "Error al crear orden de trabajo" });
    }
  });

  app.put("/api/work-orders/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, validatedData);
      if (!workOrder) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      res.json(workOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating work order:", error);
      res.status(500).json({ error: "Error al actualizar orden de trabajo" });
    }
  });

  app.delete("/api/work-orders/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteWorkOrder(id);
      if (!deleted) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work order:", error);
      res.status(500).json({ error: "Error al eliminar orden de trabajo" });
    }
  });

  app.post("/api/work-orders/:id/approve", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const { userId } = req.body;
      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Se requiere userId válido" });
      }
      
      const workOrder = await storage.approveWorkOrder(id, userId);
      if (!workOrder) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      
      await storage.createNotification({
        title: "Orden de trabajo aprobada",
        message: `La orden de trabajo #${id} ha sido aprobada`,
        type: "work_order",
      });
      
      res.json(workOrder);
    } catch (error) {
      console.error("Error approving work order:", error);
      res.status(500).json({ error: "Error al aprobar orden de trabajo" });
    }
  });

  app.get("/api/work-orders/:workOrderId/tasks", async (req, res) => {
    try {
      const workOrderId = validateId(req.params.workOrderId);
      if (workOrderId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const tasks = await storage.getWorkOrderTasks(workOrderId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching work order tasks:", error);
      res.status(500).json({ error: "Error al obtener tareas" });
    }
  });

  app.post("/api/work-orders/:workOrderId/tasks", async (req, res) => {
    try {
      const workOrderId = validateId(req.params.workOrderId);
      if (workOrderId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkOrderTaskSchema.parse({
        ...req.body,
        workOrderId,
      });
      const task = await storage.createWorkOrderTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating work order task:", error);
      res.status(500).json({ error: "Error al crear tarea" });
    }
  });

  app.put("/api/work-orders/tasks/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkOrderTaskSchema.partial().parse(req.body);
      const task = await storage.updateWorkOrderTask(id, validatedData);
      if (!task) {
        return res.status(404).json({ error: "Tarea no encontrada" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating work order task:", error);
      res.status(500).json({ error: "Error al actualizar tarea" });
    }
  });

  app.delete("/api/work-orders/tasks/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteWorkOrderTask(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tarea no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work order task:", error);
      res.status(500).json({ error: "Error al eliminar tarea" });
    }
  });

  app.get("/api/work-orders/:workOrderId/materials", async (req, res) => {
    try {
      const workOrderId = validateId(req.params.workOrderId);
      if (workOrderId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const materials = await storage.getWorkOrderMaterials(workOrderId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching work order materials:", error);
      res.status(500).json({ error: "Error al obtener materiales" });
    }
  });

  app.post("/api/work-orders/:workOrderId/materials", async (req, res) => {
    try {
      const workOrderId = validateId(req.params.workOrderId);
      if (workOrderId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkOrderMaterialSchema.parse({
        ...req.body,
        workOrderId,
      });
      const material = await storage.createWorkOrderMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating work order material:", error);
      res.status(500).json({ error: "Error al crear material" });
    }
  });

  app.put("/api/work-orders/materials/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkOrderMaterialSchema.partial().parse(req.body);
      const material = await storage.updateWorkOrderMaterial(id, validatedData);
      if (!material) {
        return res.status(404).json({ error: "Material no encontrado" });
      }
      res.json(material);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating work order material:", error);
      res.status(500).json({ error: "Error al actualizar material" });
    }
  });

  app.delete("/api/work-orders/materials/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteWorkOrderMaterial(id);
      if (!deleted) {
        return res.status(404).json({ error: "Material no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work order material:", error);
      res.status(500).json({ error: "Error al eliminar material" });
    }
  });

  app.post("/api/work-orders/materials/:id/approve", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const { userId } = req.body;
      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Se requiere userId válido" });
      }
      
      const material = await storage.approveMaterial(id, userId);
      if (!material) {
        return res.status(404).json({ error: "Material no encontrado" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error approving material:", error);
      res.status(500).json({ error: "Error al aprobar material" });
    }
  });

  app.get("/api/work-orders/:workOrderId/evidence", async (req, res) => {
    try {
      const workOrderId = validateId(req.params.workOrderId);
      if (workOrderId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const evidence = await storage.getWorkOrderEvidence(workOrderId);
      res.json(evidence);
    } catch (error) {
      console.error("Error fetching work order evidence:", error);
      res.status(500).json({ error: "Error al obtener evidencia" });
    }
  });

  app.post("/api/work-orders/:workOrderId/evidence", async (req, res) => {
    try {
      const workOrderId = validateId(req.params.workOrderId);
      if (workOrderId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkOrderEvidenceSchema.parse({
        ...req.body,
        workOrderId,
      });
      const evidence = await storage.createWorkOrderEvidence(validatedData);
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating work order evidence:", error);
      res.status(500).json({ error: "Error al crear evidencia" });
    }
  });

  app.delete("/api/work-orders/evidence/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteWorkOrderEvidence(id);
      if (!deleted) {
        return res.status(404).json({ error: "Evidencia no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work order evidence:", error);
      res.status(500).json({ error: "Error al eliminar evidencia" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const notifications = unreadOnly 
        ? await storage.getUnreadNotifications() 
        : await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Error al obtener notificaciones" });
    }
  });

  app.get("/api/notifications/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const notification = await storage.getNotification(id);
      if (!notification) {
        return res.status(404).json({ error: "Notificación no encontrada" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({ error: "Error al obtener notificación" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Error al crear notificación" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ error: "Notificación no encontrada" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Error al marcar notificación como leída" });
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.status(204).send();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Error al marcar todas las notificaciones como leídas" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteNotification(id);
      if (!deleted) {
        return res.status(404).json({ error: "Notificación no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Error al eliminar notificación" });
    }
  });

  // Workshops routes
  app.get("/api/workshops", async (req, res) => {
    try {
      const workshops = await storage.getWorkshops();
      res.json(workshops);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      res.status(500).json({ error: "Error al obtener talleres" });
    }
  });

  app.get("/api/workshops/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const workshop = await storage.getWorkshop(id);
      if (!workshop) {
        return res.status(404).json({ error: "Taller no encontrado" });
      }
      res.json(workshop);
    } catch (error) {
      console.error("Error fetching workshop:", error);
      res.status(500).json({ error: "Error al obtener taller" });
    }
  });

  app.post("/api/workshops", async (req, res) => {
    try {
      const validatedData = insertWorkshopSchema.parse(req.body);
      const workshop = await storage.createWorkshop(validatedData);
      res.status(201).json(workshop);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating workshop:", error);
      res.status(500).json({ error: "Error al crear taller" });
    }
  });

  app.put("/api/workshops/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertWorkshopSchema.partial().parse(req.body);
      const workshop = await storage.updateWorkshop(id, validatedData);
      if (!workshop) {
        return res.status(404).json({ error: "Taller no encontrado" });
      }
      res.json(workshop);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating workshop:", error);
      res.status(500).json({ error: "Error al actualizar taller" });
    }
  });

  app.delete("/api/workshops/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteWorkshop(id);
      if (!deleted) {
        return res.status(404).json({ error: "Taller no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workshop:", error);
      res.status(500).json({ error: "Error al eliminar taller" });
    }
  });

  // Areas routes
  app.get("/api/areas", async (req, res) => {
    try {
      const areas = await storage.getAreas();
      res.json(areas);
    } catch (error) {
      console.error("Error fetching areas:", error);
      res.status(500).json({ error: "Error al obtener áreas" });
    }
  });

  app.get("/api/areas/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const area = await storage.getArea(id);
      if (!area) {
        return res.status(404).json({ error: "Área no encontrada" });
      }
      res.json(area);
    } catch (error) {
      console.error("Error fetching area:", error);
      res.status(500).json({ error: "Error al obtener área" });
    }
  });

  app.post("/api/areas", async (req, res) => {
    try {
      const validatedData = insertAreaSchema.parse(req.body);
      const area = await storage.createArea(validatedData);
      res.status(201).json(area);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating area:", error);
      res.status(500).json({ error: "Error al crear área" });
    }
  });

  app.put("/api/areas/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertAreaSchema.partial().parse(req.body);
      const area = await storage.updateArea(id, validatedData);
      if (!area) {
        return res.status(404).json({ error: "Área no encontrada" });
      }
      res.json(area);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating area:", error);
      res.status(500).json({ error: "Error al actualizar área" });
    }
  });

  app.delete("/api/areas/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteArea(id);
      if (!deleted) {
        return res.status(404).json({ error: "Área no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting area:", error);
      res.status(500).json({ error: "Error al eliminar área" });
    }
  });

  // Company Configuration routes
  app.get("/api/configuration", async (req, res) => {
    try {
      const configuration = await storage.getCompanyConfiguration();
      res.json(configuration);
    } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({ error: "Error al obtener configuración" });
    }
  });

  app.post("/api/configuration", async (req, res) => {
    try {
      const validatedData = insertCompanyConfigurationSchema.parse(req.body);
      const configuration = await storage.createCompanyConfiguration(validatedData);
      res.status(201).json(configuration);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating configuration:", error);
      res.status(500).json({ error: "Error al crear configuración" });
    }
  });

  app.put("/api/configuration/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertCompanyConfigurationSchema.partial().parse(req.body);
      const configuration = await storage.updateCompanyConfiguration(id, validatedData);
      if (!configuration) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(configuration);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating configuration:", error);
      res.status(500).json({ error: "Error al actualizar configuración" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
