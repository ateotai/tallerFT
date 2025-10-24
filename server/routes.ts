import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import {
  insertVehicleSchema,
  insertServiceSchema,
  insertScheduledMaintenanceSchema,
  insertServiceCategorySchema,
  insertProviderSchema,
  insertClientSchema,
  insertInventorySchema,
  insertInventoryMovementSchema,
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

  const httpServer = createServer(app);
  return httpServer;
}
