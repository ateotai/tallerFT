import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Vehicle,
  InsertVehicle,
  VehicleType,
  InsertVehicleType,
  Service,
  InsertService,
  ScheduledMaintenance,
  InsertScheduledMaintenance,
  ServiceCategory,
  InsertServiceCategory,
  ServiceSubcategory,
  InsertServiceSubcategory,
  Provider,
  InsertProvider,
  Client,
  InsertClient,
  Inventory,
  InsertInventory,
  InventoryMovement,
  InsertInventoryMovement,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getVehicleTypes(): Promise<VehicleType[]>;
  getVehicleType(id: number): Promise<VehicleType | undefined>;
  createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: number, vehicleType: Partial<InsertVehicleType>): Promise<VehicleType | undefined>;
  deleteVehicleType(id: number): Promise<boolean>;
  
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServicesByVehicle(vehicleId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  getScheduledMaintenance(): Promise<ScheduledMaintenance[]>;
  getScheduledMaintenanceItem(id: number): Promise<ScheduledMaintenance | undefined>;
  getScheduledMaintenanceByVehicle(vehicleId: number): Promise<ScheduledMaintenance[]>;
  createScheduledMaintenance(item: InsertScheduledMaintenance): Promise<ScheduledMaintenance>;
  updateScheduledMaintenance(id: number, item: Partial<InsertScheduledMaintenance>): Promise<ScheduledMaintenance | undefined>;
  deleteScheduledMaintenance(id: number): Promise<boolean>;
  
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined>;
  deleteServiceCategory(id: number): Promise<boolean>;
  
  getServiceSubcategories(): Promise<ServiceSubcategory[]>;
  getServiceSubcategory(id: number): Promise<ServiceSubcategory | undefined>;
  getServiceSubcategoriesByCategory(categoryId: number): Promise<ServiceSubcategory[]>;
  createServiceSubcategory(subcategory: InsertServiceSubcategory): Promise<ServiceSubcategory>;
  updateServiceSubcategory(id: number, subcategory: Partial<InsertServiceSubcategory>): Promise<ServiceSubcategory | undefined>;
  deleteServiceSubcategory(id: number): Promise<boolean>;
  
  getProviders(): Promise<Provider[]>;
  getProvider(id: number): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider | undefined>;
  deleteProvider(id: number): Promise<boolean>;
  
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  getInventoryItems(): Promise<Inventory[]>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  getInventoryMovements(): Promise<InventoryMovement[]>;
  getInventoryMovementsByItem(inventoryId: number): Promise<InventoryMovement[]>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async getVehicleTypes(): Promise<VehicleType[]> {
    return await db.select().from(schema.vehicleTypes);
  }

  async getVehicleType(id: number): Promise<VehicleType | undefined> {
    const result = await db.select().from(schema.vehicleTypes).where(eq(schema.vehicleTypes.id, id)).limit(1);
    return result[0];
  }

  async createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType> {
    const result = await db.insert(schema.vehicleTypes).values(vehicleType).returning();
    return result[0];
  }

  async updateVehicleType(id: number, vehicleType: Partial<InsertVehicleType>): Promise<VehicleType | undefined> {
    const result = await db.update(schema.vehicleTypes).set(vehicleType).where(eq(schema.vehicleTypes.id, id)).returning();
    return result[0];
  }

  async deleteVehicleType(id: number): Promise<boolean> {
    const result = await db.delete(schema.vehicleTypes).where(eq(schema.vehicleTypes.id, id)).returning();
    return result.length > 0;
  }

  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(schema.vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).limit(1);
    return result[0];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(schema.vehicles).values(vehicle).returning();
    return result[0];
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(schema.vehicles).set(vehicle).where(eq(schema.vehicles.id, id)).returning();
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id)).returning();
    return result.length > 0;
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(schema.services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const result = await db.select().from(schema.services).where(eq(schema.services.id, id)).limit(1);
    return result[0];
  }

  async getServicesByVehicle(vehicleId: number): Promise<Service[]> {
    return await db.select().from(schema.services).where(eq(schema.services.vehicleId, vehicleId));
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await db.insert(schema.services).values(service).returning();
    return result[0];
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db.update(schema.services).set(service).where(eq(schema.services.id, id)).returning();
    return result[0];
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(schema.services).where(eq(schema.services.id, id)).returning();
    return result.length > 0;
  }

  async getScheduledMaintenance(): Promise<ScheduledMaintenance[]> {
    return await db.select().from(schema.scheduledMaintenance);
  }

  async getScheduledMaintenanceItem(id: number): Promise<ScheduledMaintenance | undefined> {
    const result = await db.select().from(schema.scheduledMaintenance).where(eq(schema.scheduledMaintenance.id, id)).limit(1);
    return result[0];
  }

  async getScheduledMaintenanceByVehicle(vehicleId: number): Promise<ScheduledMaintenance[]> {
    return await db.select().from(schema.scheduledMaintenance).where(eq(schema.scheduledMaintenance.vehicleId, vehicleId));
  }

  async createScheduledMaintenance(item: InsertScheduledMaintenance): Promise<ScheduledMaintenance> {
    const result = await db.insert(schema.scheduledMaintenance).values(item).returning();
    return result[0];
  }

  async updateScheduledMaintenance(id: number, item: Partial<InsertScheduledMaintenance>): Promise<ScheduledMaintenance | undefined> {
    const result = await db.update(schema.scheduledMaintenance).set(item).where(eq(schema.scheduledMaintenance.id, id)).returning();
    return result[0];
  }

  async deleteScheduledMaintenance(id: number): Promise<boolean> {
    const result = await db.delete(schema.scheduledMaintenance).where(eq(schema.scheduledMaintenance.id, id)).returning();
    return result.length > 0;
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(schema.serviceCategories);
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const result = await db.select().from(schema.serviceCategories).where(eq(schema.serviceCategories.id, id)).limit(1);
    return result[0];
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const result = await db.insert(schema.serviceCategories).values(category).returning();
    return result[0];
  }

  async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> {
    const result = await db.update(schema.serviceCategories).set(category).where(eq(schema.serviceCategories.id, id)).returning();
    return result[0];
  }

  async deleteServiceCategory(id: number): Promise<boolean> {
    const result = await db.delete(schema.serviceCategories).where(eq(schema.serviceCategories.id, id)).returning();
    return result.length > 0;
  }

  async getServiceSubcategories(): Promise<ServiceSubcategory[]> {
    return await db.select().from(schema.serviceSubcategories);
  }

  async getServiceSubcategory(id: number): Promise<ServiceSubcategory | undefined> {
    const result = await db.select().from(schema.serviceSubcategories).where(eq(schema.serviceSubcategories.id, id)).limit(1);
    return result[0];
  }

  async getServiceSubcategoriesByCategory(categoryId: number): Promise<ServiceSubcategory[]> {
    return await db.select().from(schema.serviceSubcategories).where(eq(schema.serviceSubcategories.categoryId, categoryId));
  }

  async createServiceSubcategory(subcategory: InsertServiceSubcategory): Promise<ServiceSubcategory> {
    const result = await db.insert(schema.serviceSubcategories).values(subcategory).returning();
    return result[0];
  }

  async updateServiceSubcategory(id: number, subcategory: Partial<InsertServiceSubcategory>): Promise<ServiceSubcategory | undefined> {
    const result = await db.update(schema.serviceSubcategories).set(subcategory).where(eq(schema.serviceSubcategories.id, id)).returning();
    return result[0];
  }

  async deleteServiceSubcategory(id: number): Promise<boolean> {
    const result = await db.delete(schema.serviceSubcategories).where(eq(schema.serviceSubcategories.id, id)).returning();
    return result.length > 0;
  }

  async getProviders(): Promise<Provider[]> {
    return await db.select().from(schema.providers);
  }

  async getProvider(id: number): Promise<Provider | undefined> {
    const result = await db.select().from(schema.providers).where(eq(schema.providers.id, id)).limit(1);
    return result[0];
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const result = await db.insert(schema.providers).values(provider).returning();
    return result[0];
  }

  async updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider | undefined> {
    const result = await db.update(schema.providers).set(provider).where(eq(schema.providers.id, id)).returning();
    return result[0];
  }

  async deleteProvider(id: number): Promise<boolean> {
    const result = await db.delete(schema.providers).where(eq(schema.providers.id, id)).returning();
    return result.length > 0;
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(schema.clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(schema.clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(schema.clients).set(client).where(eq(schema.clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(schema.clients).where(eq(schema.clients.id, id)).returning();
    return result.length > 0;
  }

  async getInventoryItems(): Promise<Inventory[]> {
    return await db.select().from(schema.inventory);
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const result = await db.select().from(schema.inventory).where(eq(schema.inventory.id, id)).limit(1);
    return result[0];
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const result = await db.insert(schema.inventory).values(item).returning();
    return result[0];
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const result = await db.update(schema.inventory).set(item).where(eq(schema.inventory.id, id)).returning();
    return result[0];
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(schema.inventory).where(eq(schema.inventory.id, id)).returning();
    return result.length > 0;
  }

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    return await db.select().from(schema.inventoryMovements);
  }

  async getInventoryMovementsByItem(inventoryId: number): Promise<InventoryMovement[]> {
    return await db.select().from(schema.inventoryMovements).where(eq(schema.inventoryMovements.inventoryId, inventoryId));
  }

  async createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement> {
    const result = await db.insert(schema.inventoryMovements).values(movement).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
