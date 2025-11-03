import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  ProviderType,
  InsertProviderType,
  Client,
  InsertClient,
  InventoryCategory,
  InsertInventoryCategory,
  Inventory,
  InsertInventory,
  InventoryMovement,
  InsertInventoryMovement,
  Report,
  InsertReport,
  EmployeeType,
  InsertEmployeeType,
  Employee,
  InsertEmployee,
  Diagnostic,
  InsertDiagnostic,
  WorkOrder,
  InsertWorkOrder,
  WorkOrderTask,
  InsertWorkOrderTask,
  WorkOrderMaterial,
  InsertWorkOrderMaterial,
  WorkOrderEvidence,
  InsertWorkOrderEvidence,
  Notification,
  InsertNotification,
  Workshop,
  InsertWorkshop,
  Area,
  InsertArea,
  CompanyConfiguration,
  InsertCompanyConfiguration,
  Role,
  InsertRole,
  Permission,
  InsertPermission,
  RolePermission,
  InsertRolePermission,
  PurchaseQuote,
  InsertPurchaseQuote,
  PurchaseQuoteItem,
  InsertPurchaseQuoteItem,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
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
  getVehicleByEconomicNumber(economicNumber: string): Promise<Vehicle | undefined>;
  getVehicleByVin(vin: string): Promise<Vehicle | undefined>;
  
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
  
  getProviderTypes(): Promise<ProviderType[]>;
  getProviderType(id: number): Promise<ProviderType | undefined>;
  createProviderType(providerType: InsertProviderType): Promise<ProviderType>;
  updateProviderType(id: number, providerType: Partial<InsertProviderType>): Promise<ProviderType | undefined>;
  deleteProviderType(id: number): Promise<boolean>;
  
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
  
  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsByVehicle(vehicleId: number): Promise<Report[]>;
  getReportsByUser(userId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;
  resolveReport(id: number): Promise<Report | undefined>;
  reopenReport(id: number): Promise<Report | undefined>;
  
  getEmployeeTypes(): Promise<EmployeeType[]>;
  getEmployeeType(id: number): Promise<EmployeeType | undefined>;
  createEmployeeType(employeeType: InsertEmployeeType): Promise<EmployeeType>;
  updateEmployeeType(id: number, employeeType: Partial<InsertEmployeeType>): Promise<EmployeeType | undefined>;
  deleteEmployeeType(id: number): Promise<boolean>;
  
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  getInventoryCategories(): Promise<InventoryCategory[]>;
  getInventoryCategory(id: number): Promise<InventoryCategory | undefined>;
  createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory>;
  updateInventoryCategory(id: number, category: Partial<InsertInventoryCategory>): Promise<InventoryCategory | undefined>;
  deleteInventoryCategory(id: number): Promise<boolean>;
  
  getDiagnostics(): Promise<Diagnostic[]>;
  getDiagnostic(id: number): Promise<Diagnostic | undefined>;
  getDiagnosticsByReport(reportId: number): Promise<Diagnostic[]>;
  getDiagnosticsByEmployee(employeeId: number): Promise<Diagnostic[]>;
  createDiagnostic(diagnostic: InsertDiagnostic): Promise<Diagnostic>;
  updateDiagnostic(id: number, diagnostic: Partial<InsertDiagnostic>): Promise<Diagnostic | undefined>;
  deleteDiagnostic(id: number): Promise<boolean>;
  approveDiagnostic(diagnosticId: number, userId: number): Promise<{ diagnostic: Diagnostic; workOrder: WorkOrder }>;
  
  assignReportToEmployee(reportId: number, employeeId: number): Promise<{ report: Report; diagnostic: Diagnostic }>;
  getUsers(): Promise<User[]>;
  
  getWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  getWorkOrdersByVehicle(vehicleId: number): Promise<WorkOrder[]>;
  getWorkOrdersByEmployee(employeeId: number): Promise<WorkOrder[]>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: number): Promise<boolean>;
  
  getWorkOrderTasks(workOrderId: number): Promise<WorkOrderTask[]>;
  createWorkOrderTask(task: InsertWorkOrderTask): Promise<WorkOrderTask>;
  updateWorkOrderTask(id: number, task: Partial<InsertWorkOrderTask>): Promise<WorkOrderTask | undefined>;
  deleteWorkOrderTask(id: number): Promise<boolean>;
  
  getWorkOrderMaterials(workOrderId: number): Promise<WorkOrderMaterial[]>;
  createWorkOrderMaterial(material: InsertWorkOrderMaterial): Promise<WorkOrderMaterial>;
  updateWorkOrderMaterial(id: number, material: Partial<InsertWorkOrderMaterial>): Promise<WorkOrderMaterial | undefined>;
  deleteWorkOrderMaterial(id: number): Promise<boolean>;
  approveMaterial(id: number, userId: number): Promise<WorkOrderMaterial | undefined>;
  
  getWorkOrderEvidence(workOrderId: number): Promise<WorkOrderEvidence[]>;
  createWorkOrderEvidence(evidence: InsertWorkOrderEvidence): Promise<WorkOrderEvidence>;
  deleteWorkOrderEvidence(id: number): Promise<boolean>;
  
  getNotifications(): Promise<Notification[]>;
  getUnreadNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  getWorkshops(): Promise<Workshop[]>;
  getWorkshop(id: number): Promise<Workshop | undefined>;
  createWorkshop(workshop: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop | undefined>;
  deleteWorkshop(id: number): Promise<boolean>;
  
  getAreas(): Promise<Area[]>;
  getArea(id: number): Promise<Area | undefined>;
  createArea(area: InsertArea): Promise<Area>;
  updateArea(id: number, area: Partial<InsertArea>): Promise<Area | undefined>;
  deleteArea(id: number): Promise<boolean>;
  
  getCompanyConfiguration(): Promise<CompanyConfiguration | undefined>;
  updateCompanyConfiguration(id: number, config: Partial<InsertCompanyConfiguration>): Promise<CompanyConfiguration | undefined>;
  createCompanyConfiguration(config: InsertCompanyConfiguration): Promise<CompanyConfiguration>;
  
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  getPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;
  
  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  getAllRolePermissions(): Promise<RolePermission[]>;
  createRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission>;
  deleteRolePermission(roleId: number, permissionId: number): Promise<boolean>;
  deleteAllRolePermissions(roleId: number): Promise<boolean>;

  getPurchaseQuotes(): Promise<PurchaseQuote[]>;
  getPurchaseQuote(id: number): Promise<PurchaseQuote | undefined>;
  createPurchaseQuote(quote: InsertPurchaseQuote): Promise<PurchaseQuote>;
  updatePurchaseQuote(id: number, quote: Partial<InsertPurchaseQuote>): Promise<PurchaseQuote | undefined>;
  deletePurchaseQuote(id: number): Promise<boolean>;
  
  getPurchaseQuoteItems(quoteId: number): Promise<PurchaseQuoteItem[]>;
  getPurchaseQuoteItem(id: number): Promise<PurchaseQuoteItem | undefined>;
  createPurchaseQuoteItem(item: InsertPurchaseQuoteItem): Promise<PurchaseQuoteItem>;
  updatePurchaseQuoteItem(id: number, item: Partial<InsertPurchaseQuoteItem>): Promise<PurchaseQuoteItem | undefined>;
  deletePurchaseQuoteItem(id: number): Promise<boolean>;
  deletePurchaseQuoteItems(quoteId: number): Promise<boolean>;
}

export class DbStorage implements IStorage {
  // User operations
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

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
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

  async getVehicleByEconomicNumber(economicNumber: string): Promise<Vehicle | undefined> {
    const result = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.economicNumber, economicNumber))
      .limit(1);
    return result[0];
  }

  async getVehicleByVin(vin: string): Promise<Vehicle | undefined> {
    const result = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.vin, vin))
      .limit(1);
    return result[0];
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

  async getProviderTypes(): Promise<ProviderType[]> {
    return await db.select().from(schema.providerTypes);
  }

  async getProviderType(id: number): Promise<ProviderType | undefined> {
    const result = await db.select().from(schema.providerTypes).where(eq(schema.providerTypes.id, id)).limit(1);
    return result[0];
  }

  async createProviderType(providerType: InsertProviderType): Promise<ProviderType> {
    const result = await db.insert(schema.providerTypes).values(providerType).returning();
    return result[0];
  }

  async updateProviderType(id: number, providerType: Partial<InsertProviderType>): Promise<ProviderType | undefined> {
    const result = await db.update(schema.providerTypes).set(providerType).where(eq(schema.providerTypes.id, id)).returning();
    return result[0];
  }

  async deleteProviderType(id: number): Promise<boolean> {
    const result = await db.delete(schema.providerTypes).where(eq(schema.providerTypes.id, id)).returning();
    return result.length > 0;
  }

  async getInventoryCategories(): Promise<InventoryCategory[]> {
    return await db.select().from(schema.inventoryCategories);
  }

  async getInventoryCategory(id: number): Promise<InventoryCategory | undefined> {
    const result = await db.select().from(schema.inventoryCategories).where(eq(schema.inventoryCategories.id, id)).limit(1);
    return result[0];
  }

  async createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory> {
    const result = await db.insert(schema.inventoryCategories).values(category).returning();
    return result[0];
  }

  async updateInventoryCategory(id: number, category: Partial<InsertInventoryCategory>): Promise<InventoryCategory | undefined> {
    const result = await db.update(schema.inventoryCategories).set(category).where(eq(schema.inventoryCategories.id, id)).returning();
    return result[0];
  }

  async deleteInventoryCategory(id: number): Promise<boolean> {
    const result = await db.delete(schema.inventoryCategories).where(eq(schema.inventoryCategories.id, id)).returning();
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

  async getReports(): Promise<Report[]> {
    return await db.select().from(schema.reports);
  }

  async getReport(id: number): Promise<Report | undefined> {
    const result = await db.select().from(schema.reports).where(eq(schema.reports.id, id)).limit(1);
    return result[0];
  }

  async getReportsByVehicle(vehicleId: number): Promise<Report[]> {
    return await db.select().from(schema.reports).where(eq(schema.reports.vehicleId, vehicleId));
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return await db.select().from(schema.reports).where(eq(schema.reports.userId, userId));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(schema.reports).values(report).returning();
    return result[0];
  }

  async updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined> {
    const result = await db.update(schema.reports).set(report).where(eq(schema.reports.id, id)).returning();
    return result[0];
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(schema.reports).where(eq(schema.reports.id, id)).returning();
    return result.length > 0;
  }

  async resolveReport(id: number): Promise<Report | undefined> {
    const result = await db.update(schema.reports)
      .set({ resolved: true, resolvedDate: new Date() })
      .where(eq(schema.reports.id, id))
      .returning();
    return result[0];
  }

  async reopenReport(id: number): Promise<Report | undefined> {
    const result = await db.update(schema.reports)
      .set({ resolved: false, resolvedDate: null })
      .where(eq(schema.reports.id, id))
      .returning();
    return result[0];
  }

  async getEmployeeTypes(): Promise<EmployeeType[]> {
    return await db.select().from(schema.employeeTypes);
  }

  async getEmployeeType(id: number): Promise<EmployeeType | undefined> {
    const result = await db.select().from(schema.employeeTypes).where(eq(schema.employeeTypes.id, id)).limit(1);
    return result[0];
  }

  async createEmployeeType(employeeType: InsertEmployeeType): Promise<EmployeeType> {
    const result = await db.insert(schema.employeeTypes).values(employeeType).returning();
    return result[0];
  }

  async updateEmployeeType(id: number, employeeType: Partial<InsertEmployeeType>): Promise<EmployeeType | undefined> {
    const result = await db.update(schema.employeeTypes).set(employeeType).where(eq(schema.employeeTypes.id, id)).returning();
    return result[0];
  }

  async deleteEmployeeType(id: number): Promise<boolean> {
    const result = await db.delete(schema.employeeTypes).where(eq(schema.employeeTypes.id, id)).returning();
    return result.length > 0;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(schema.employees);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db.select().from(schema.employees).where(eq(schema.employees.id, id)).limit(1);
    return result[0];
  }

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    const result = await db.select().from(schema.employees).where(eq(schema.employees.userId, userId)).limit(1);
    return result[0];
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(schema.employees).values(employee).returning();
    return result[0];
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await db.update(schema.employees).set(employee).where(eq(schema.employees.id, id)).returning();
    return result[0];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(schema.employees).where(eq(schema.employees.id, id)).returning();
    return result.length > 0;
  }

  async getDiagnostics(): Promise<Diagnostic[]> {
    return await db.select().from(schema.diagnostics);
  }

  async getDiagnostic(id: number): Promise<Diagnostic | undefined> {
    const result = await db.select().from(schema.diagnostics).where(eq(schema.diagnostics.id, id)).limit(1);
    return result[0];
  }

  async getDiagnosticsByReport(reportId: number): Promise<Diagnostic[]> {
    return await db.select().from(schema.diagnostics).where(eq(schema.diagnostics.reportId, reportId));
  }

  async getDiagnosticsByEmployee(employeeId: number): Promise<Diagnostic[]> {
    return await db.select().from(schema.diagnostics).where(eq(schema.diagnostics.employeeId, employeeId));
  }

  async createDiagnostic(diagnostic: InsertDiagnostic): Promise<Diagnostic> {
    const result = await db.insert(schema.diagnostics).values(diagnostic).returning();
    return result[0];
  }

  async updateDiagnostic(id: number, diagnostic: Partial<InsertDiagnostic>): Promise<Diagnostic | undefined> {
    const result = await db.update(schema.diagnostics).set({ ...diagnostic, updatedAt: new Date() }).where(eq(schema.diagnostics.id, id)).returning();
    return result[0];
  }

  async deleteDiagnostic(id: number): Promise<boolean> {
    const result = await db.delete(schema.diagnostics).where(eq(schema.diagnostics.id, id)).returning();
    return result.length > 0;
  }

  async assignReportToEmployee(reportId: number, employeeId: number): Promise<{ report: Report; diagnostic: Diagnostic }> {
    const assignedAt = new Date();
    
    const updatedReport = await db.update(schema.reports)
      .set({
        assignedToEmployeeId: employeeId,
        assignedAt: assignedAt,
        status: "diagnostico"
      })
      .where(eq(schema.reports.id, reportId))
      .returning();

    const diagnostic = await db.insert(schema.diagnostics)
      .values({
        reportId: reportId,
        employeeId: employeeId,
        odometer: 0,
        vehicleCondition: "pendiente de evaluación",
        fuelLevel: "sin evaluar",
        possibleCause: "pendiente de diagnóstico",
        severity: "pendiente",
        technicalRecommendation: "pendiente de evaluación",
        estimatedRepairTime: "por determinar",
        requiredMaterials: "pendiente de evaluación",
        requiresAdditionalTests: false,
      })
      .returning();

    return { report: updatedReport[0], diagnostic: diagnostic[0] };
  }

  async approveDiagnostic(diagnosticId: number, userId: number): Promise<{ diagnostic: Diagnostic; workOrder: WorkOrder }> {
    const approvedAt = new Date();
    
    const updatedDiagnostic = await db.update(schema.diagnostics)
      .set({
        approvedBy: userId,
        approvedAt: approvedAt,
      })
      .where(eq(schema.diagnostics.id, diagnosticId))
      .returning();

    const diagnostic = updatedDiagnostic[0];
    
    const report = await db.select().from(schema.reports).where(eq(schema.reports.id, diagnostic.reportId)).limit(1);
    
    const workOrder = await db.insert(schema.workOrders)
      .values({
        diagnosticId: diagnosticId,
        vehicleId: report[0].vehicleId,
        assignedToEmployeeId: diagnostic.employeeId,
        status: "pending",
        priority: diagnostic.severity === "crítico" ? "high" : diagnostic.severity === "moderado" ? "normal" : "low",
        description: `Orden de trabajo generada del diagnóstico #${diagnosticId}: ${diagnostic.possibleCause}`,
        estimatedCost: undefined,
      })
      .returning();

    return { diagnostic, workOrder: workOrder[0] };
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    return await db.select().from(schema.workOrders);
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const result = await db.select().from(schema.workOrders).where(eq(schema.workOrders.id, id)).limit(1);
    return result[0];
  }

  async getWorkOrdersByVehicle(vehicleId: number): Promise<WorkOrder[]> {
    return await db.select().from(schema.workOrders).where(eq(schema.workOrders.vehicleId, vehicleId));
  }

  async getWorkOrdersByEmployee(employeeId: number): Promise<WorkOrder[]> {
    return await db.select().from(schema.workOrders).where(eq(schema.workOrders.assignedToEmployeeId, employeeId));
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const result = await db.insert(schema.workOrders).values(workOrder).returning();
    return result[0];
  }

  async updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const result = await db.update(schema.workOrders).set({ ...workOrder, updatedAt: new Date() }).where(eq(schema.workOrders.id, id)).returning();
    return result[0];
  }

  async deleteWorkOrder(id: number): Promise<boolean> {
    const result = await db.delete(schema.workOrders).where(eq(schema.workOrders.id, id)).returning();
    return result.length > 0;
  }

  async approveWorkOrder(id: number, userId: number): Promise<WorkOrder | undefined> {
    const approvedAt = new Date();
    const result = await db.update(schema.workOrders)
      .set({ 
        status: "in_progress",
        approvedBy: userId,
        approvedAt: approvedAt,
        startDate: approvedAt,
      })
      .where(eq(schema.workOrders.id, id))
      .returning();
    return result[0];
  }

  async getWorkOrderTasks(workOrderId: number): Promise<WorkOrderTask[]> {
    return await db.select().from(schema.workOrderTasks).where(eq(schema.workOrderTasks.workOrderId, workOrderId));
  }

  async createWorkOrderTask(task: InsertWorkOrderTask): Promise<WorkOrderTask> {
    const result = await db.insert(schema.workOrderTasks).values(task).returning();
    return result[0];
  }

  async updateWorkOrderTask(id: number, task: Partial<InsertWorkOrderTask>): Promise<WorkOrderTask | undefined> {
    const result = await db.update(schema.workOrderTasks).set(task).where(eq(schema.workOrderTasks.id, id)).returning();
    return result[0];
  }

  async deleteWorkOrderTask(id: number): Promise<boolean> {
    const result = await db.delete(schema.workOrderTasks).where(eq(schema.workOrderTasks.id, id)).returning();
    return result.length > 0;
  }

  async getWorkOrderMaterials(workOrderId: number): Promise<WorkOrderMaterial[]> {
    return await db.select().from(schema.workOrderMaterials).where(eq(schema.workOrderMaterials.workOrderId, workOrderId));
  }

  async createWorkOrderMaterial(material: InsertWorkOrderMaterial): Promise<WorkOrderMaterial> {
    const result = await db.insert(schema.workOrderMaterials).values(material).returning();
    return result[0];
  }

  async updateWorkOrderMaterial(id: number, material: Partial<InsertWorkOrderMaterial>): Promise<WorkOrderMaterial | undefined> {
    const result = await db.update(schema.workOrderMaterials).set(material).where(eq(schema.workOrderMaterials.id, id)).returning();
    return result[0];
  }

  async deleteWorkOrderMaterial(id: number): Promise<boolean> {
    const result = await db.delete(schema.workOrderMaterials).where(eq(schema.workOrderMaterials.id, id)).returning();
    return result.length > 0;
  }

  async approveMaterial(id: number, userId: number): Promise<WorkOrderMaterial | undefined> {
    const result = await db.update(schema.workOrderMaterials)
      .set({ 
        approved: true,
        approvedBy: userId,
        approvedAt: new Date(),
      })
      .where(eq(schema.workOrderMaterials.id, id))
      .returning();
    return result[0];
  }

  async getWorkOrderEvidence(workOrderId: number): Promise<WorkOrderEvidence[]> {
    return await db.select().from(schema.workOrderEvidence).where(eq(schema.workOrderEvidence.workOrderId, workOrderId));
  }

  async createWorkOrderEvidence(evidence: InsertWorkOrderEvidence): Promise<WorkOrderEvidence> {
    const result = await db.insert(schema.workOrderEvidence).values(evidence).returning();
    return result[0];
  }

  async deleteWorkOrderEvidence(id: number): Promise<boolean> {
    const result = await db.delete(schema.workOrderEvidence).where(eq(schema.workOrderEvidence.id, id)).returning();
    return result.length > 0;
  }

  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(schema.notifications).orderBy(schema.notifications.createdAt);
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return await db.select().from(schema.notifications).where(eq(schema.notifications.read, false)).orderBy(schema.notifications.createdAt);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(schema.notifications.createdAt);
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.read, false), eq(schema.notifications.userId, userId)))
      .orderBy(schema.notifications.createdAt);
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(schema.notifications).where(eq(schema.notifications.id, id)).limit(1);
    return result[0];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(schema.notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id)).returning();
    return result[0];
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.read, false));
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(schema.notifications).where(eq(schema.notifications.id, id)).returning();
    return result.length > 0;
  }

  async getWorkshops(): Promise<Workshop[]> {
    return await db.select().from(schema.workshops);
  }

  async getWorkshop(id: number): Promise<Workshop | undefined> {
    const result = await db.select().from(schema.workshops).where(eq(schema.workshops.id, id)).limit(1);
    return result[0];
  }

  async createWorkshop(workshop: InsertWorkshop): Promise<Workshop> {
    const result = await db.insert(schema.workshops).values(workshop).returning();
    return result[0];
  }

  async updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    const result = await db.update(schema.workshops).set(workshop).where(eq(schema.workshops.id, id)).returning();
    return result[0];
  }

  async deleteWorkshop(id: number): Promise<boolean> {
    const result = await db.delete(schema.workshops).where(eq(schema.workshops.id, id)).returning();
    return result.length > 0;
  }

  async getAreas(): Promise<Area[]> {
    return await db.select().from(schema.areas);
  }

  async getArea(id: number): Promise<Area | undefined> {
    const result = await db.select().from(schema.areas).where(eq(schema.areas.id, id)).limit(1);
    return result[0];
  }

  async createArea(area: InsertArea): Promise<Area> {
    const result = await db.insert(schema.areas).values(area).returning();
    return result[0];
  }

  async updateArea(id: number, area: Partial<InsertArea>): Promise<Area | undefined> {
    const result = await db.update(schema.areas).set(area).where(eq(schema.areas.id, id)).returning();
    return result[0];
  }

  async deleteArea(id: number): Promise<boolean> {
    const result = await db.delete(schema.areas).where(eq(schema.areas.id, id)).returning();
    return result.length > 0;
  }

  async getCompanyConfiguration(): Promise<CompanyConfiguration | undefined> {
    const result = await db.select().from(schema.companyConfiguration).limit(1);
    return result[0];
  }

  async createCompanyConfiguration(config: InsertCompanyConfiguration): Promise<CompanyConfiguration> {
    const result = await db.insert(schema.companyConfiguration).values(config).returning();
    return result[0];
  }

  async updateCompanyConfiguration(id: number, config: Partial<InsertCompanyConfiguration>): Promise<CompanyConfiguration | undefined> {
    const result = await db.update(schema.companyConfiguration)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(schema.companyConfiguration.id, id))
      .returning();
    return result[0];
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(schema.roles);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const result = await db.select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    return result[0];
  }

  async createRole(role: InsertRole): Promise<Role> {
    const result = await db.insert(schema.roles).values(role).returning();
    return result[0];
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined> {
    const result = await db.update(schema.roles).set(role).where(eq(schema.roles.id, id)).returning();
    return result[0];
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(schema.roles).where(eq(schema.roles.id, id)).returning();
    return result.length > 0;
  }

  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(schema.permissions);
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const result = await db.select().from(schema.permissions).where(eq(schema.permissions.id, id)).limit(1);
    return result[0];
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await db.insert(schema.permissions).values(permission).returning();
    return result[0];
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const result = await db.update(schema.permissions).set(permission).where(eq(schema.permissions.id, id)).returning();
    return result[0];
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await db.delete(schema.permissions).where(eq(schema.permissions.id, id)).returning();
    return result.length > 0;
  }

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    return await db.select().from(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
  }

  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(schema.rolePermissions);
  }

  async createRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const result = await db.insert(schema.rolePermissions).values(rolePermission).returning();
    return result[0];
  }

  async deleteRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db.delete(schema.rolePermissions)
      .where(and(
        eq(schema.rolePermissions.roleId, roleId),
        eq(schema.rolePermissions.permissionId, permissionId)
      ))
      .returning();
    return result.length > 0;
  }

  async deleteAllRolePermissions(roleId: number): Promise<boolean> {
    await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
    return true;
  }

  async getPurchaseQuotes(): Promise<PurchaseQuote[]> {
    return await db.select().from(schema.purchaseQuotes);
  }

  async getPurchaseQuote(id: number): Promise<PurchaseQuote | undefined> {
    const result = await db.select().from(schema.purchaseQuotes).where(eq(schema.purchaseQuotes.id, id)).limit(1);
    return result[0];
  }

  async createPurchaseQuote(quote: InsertPurchaseQuote): Promise<PurchaseQuote> {
    const result = await db.insert(schema.purchaseQuotes).values(quote).returning();
    return result[0];
  }

  async updatePurchaseQuote(id: number, quote: Partial<InsertPurchaseQuote>): Promise<PurchaseQuote | undefined> {
    const result = await db.update(schema.purchaseQuotes).set(quote).where(eq(schema.purchaseQuotes.id, id)).returning();
    return result[0];
  }

  async deletePurchaseQuote(id: number): Promise<boolean> {
    const result = await db.delete(schema.purchaseQuotes).where(eq(schema.purchaseQuotes.id, id)).returning();
    return result.length > 0;
  }

  async getPurchaseQuoteItems(quoteId: number): Promise<PurchaseQuoteItem[]> {
    return await db.select().from(schema.purchaseQuoteItems).where(eq(schema.purchaseQuoteItems.quoteId, quoteId));
  }

  async getPurchaseQuoteItem(id: number): Promise<PurchaseQuoteItem | undefined> {
    const result = await db.select().from(schema.purchaseQuoteItems).where(eq(schema.purchaseQuoteItems.id, id)).limit(1);
    return result[0];
  }

  async createPurchaseQuoteItem(item: InsertPurchaseQuoteItem): Promise<PurchaseQuoteItem> {
    const result = await db.insert(schema.purchaseQuoteItems).values(item).returning();
    return result[0];
  }

  async updatePurchaseQuoteItem(id: number, item: Partial<InsertPurchaseQuoteItem>): Promise<PurchaseQuoteItem | undefined> {
    const result = await db.update(schema.purchaseQuoteItems).set(item).where(eq(schema.purchaseQuoteItems.id, id)).returning();
    return result[0];
  }

  async deletePurchaseQuoteItem(id: number): Promise<boolean> {
    const result = await db.delete(schema.purchaseQuoteItems).where(eq(schema.purchaseQuoteItems.id, id)).returning();
    return result.length > 0;
  }

  async deletePurchaseQuoteItems(quoteId: number): Promise<boolean> {
    await db.delete(schema.purchaseQuoteItems).where(eq(schema.purchaseQuoteItems.quoteId, quoteId));
    return true;
  }
}

export const storage = new DbStorage();
