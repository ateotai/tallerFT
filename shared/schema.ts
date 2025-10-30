import { sql } from "drizzle-orm";
import { pgTable, text, serial, varchar, timestamp, integer, real, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Auth tables for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const authUsers = pgTable("auth_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertAuthUser = typeof authUsers.$inferInsert;
export type AuthUser = typeof authUsers.$inferSelect;

// Domain users table (for internal system data and FK relationships)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id").unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const vehicleTypes = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;
export type VehicleType = typeof vehicleTypes.$inferSelect;

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  vehicleTypeId: integer("vehicle_type_id").references(() => vehicleTypes.id),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  plate: text("plate").notNull().unique(),
  vin: text("vin"),
  color: text("color"),
  mileage: integer("mileage").notNull().default(0),
  fuelType: text("fuel_type").notNull(),
  status: text("status").notNull().default("active"),
  assignedArea: text("assigned_area"),
  economicNumber: text("economic_number"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
});
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;

export const serviceSubcategories = pgTable("service_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServiceSubcategorySchema = createInsertSchema(serviceSubcategories).omit({
  id: true,
  createdAt: true,
});
export type InsertServiceSubcategory = z.infer<typeof insertServiceSubcategorySchema>;
export type ServiceSubcategory = typeof serviceSubcategories.$inferSelect;

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  rating: real("rating").default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
});
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providers.$inferSelect;

export const providerTypes = pgTable("provider_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProviderTypeSchema = createInsertSchema(providerTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertProviderType = z.infer<typeof insertProviderTypeSchema>;
export type ProviderType = typeof providerTypes.$inferSelect;

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  providerId: integer("provider_id").references(() => providers.id),
  description: text("description").notNull(),
  cost: real("cost").notNull(),
  mileage: integer("mileage").notNull(),
  status: text("status").notNull().default("completed"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export const scheduledMaintenance = pgTable("scheduled_maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  frequency: text("frequency").notNull(),
  nextDueDate: timestamp("next_due_date").notNull(),
  nextDueMileage: integer("next_due_mileage"),
  estimatedCost: real("estimated_cost"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScheduledMaintenanceSchema = createInsertSchema(scheduledMaintenance).omit({
  id: true,
  createdAt: true,
});
export type InsertScheduledMaintenance = z.infer<typeof insertScheduledMaintenanceSchema>;
export type ScheduledMaintenance = typeof scheduledMaintenance.$inferSelect;

export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryCategorySchema = createInsertSchema(inventoryCategories).omit({
  id: true,
  createdAt: true,
});
export type InsertInventoryCategory = z.infer<typeof insertInventoryCategorySchema>;
export type InventoryCategory = typeof inventoryCategories.$inferSelect;

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => inventoryCategories.id),
  partNumber: text("part_number").unique(),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  maxQuantity: integer("max_quantity").notNull().default(0),
  unitPrice: real("unit_price").notNull(),
  location: text("location"),
  providerId: integer("provider_id").references(() => providers.id),
  workshopId: integer("workshop_id").references(() => workshops.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
});
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  serviceId: integer("service_id").references(() => services.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
});
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  userId: integer("user_id").notNull().references(() => users.id),
  images: jsonb("images").$type<Array<{ url: string; description: string }>>().default([]),
  audioUrl: text("audio_url"),
  description: text("description").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  assignedToEmployeeId: integer("assigned_to_employee_id").references(() => employees.id),
  assignedAt: timestamp("assigned_at"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedDate: timestamp("resolved_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
  resolved: true,
  resolvedDate: true,
}).extend({
  images: z.array(z.object({
    url: z.string(),
    description: z.string().optional().default(""),
  })).optional().default([]),
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const employeeTypes = pgTable("employee_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmployeeTypeSchema = createInsertSchema(employeeTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertEmployeeType = z.infer<typeof insertEmployeeTypeSchema>;
export type EmployeeType = typeof employeeTypes.$inferSelect;

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  employeeTypeId: integer("employee_type_id").notNull().references(() => employeeTypes.id),
  phone: text("phone"),
  email: text("email"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const diagnostics = pgTable("diagnostics", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  odometer: integer("odometer").notNull(),
  vehicleCondition: text("vehicle_condition").notNull(),
  fuelLevel: text("fuel_level").notNull(),
  possibleCause: text("possible_cause").notNull(),
  severity: text("severity").notNull(),
  technicalRecommendation: text("technical_recommendation").notNull(),
  estimatedRepairTime: text("estimated_repair_time").notNull(),
  requiredMaterials: text("required_materials"),
  requiresAdditionalTests: boolean("requires_additional_tests").notNull().default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDiagnosticSchema = createInsertSchema(diagnostics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
});
export type InsertDiagnostic = z.infer<typeof insertDiagnosticSchema>;
export type Diagnostic = typeof diagnostics.$inferSelect;

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  diagnosticId: integer("diagnostic_id").references(() => diagnostics.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  assignedToEmployeeId: integer("assigned_to_employee_id").references(() => employees.id),
  status: text("status").notNull().default("awaiting_approval"),
  priority: text("priority").notNull().default("normal"),
  description: text("description").notNull(),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  startDate: timestamp("start_date"),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
});
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;

export const workOrderTasks = pgTable("work_order_tasks", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  responsibleTechnicianId: integer("responsible_technician_id").references(() => employees.id),
  assignedMechanicId: integer("assigned_mechanic_id").references(() => employees.id),
  serviceCategoryId: integer("service_category_id").references(() => serviceCategories.id),
  serviceSubcategoryId: integer("service_subcategory_id").references(() => serviceSubcategories.id),
  providerId: integer("provider_id").references(() => providers.id),
  workshopArea: text("workshop_area"),
  estimatedTime: text("estimated_time"),
  completionDate: timestamp("completion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkOrderTaskSchema = createInsertSchema(workOrderTasks).omit({
  id: true,
  createdAt: true,
}).extend({
  completionDate: z.coerce.date().optional(),
});
export type InsertWorkOrderTask = z.infer<typeof insertWorkOrderTaskSchema>;
export type WorkOrderTask = typeof workOrderTasks.$inferSelect;

export const workOrderMaterials = pgTable("work_order_materials", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  inventoryId: integer("inventory_id").references(() => inventory.id),
  partNumber: text("part_number"),
  description: text("description").notNull(),
  quantityAvailable: integer("quantity_available").default(0),
  quantityNeeded: integer("quantity_needed").notNull(),
  unitCost: real("unit_cost").notNull(),
  total: real("total").notNull(),
  approved: boolean("approved").notNull().default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkOrderMaterialSchema = createInsertSchema(workOrderMaterials).omit({
  id: true,
  createdAt: true,
  approvedBy: true,
  approvedAt: true,
});
export type InsertWorkOrderMaterial = z.infer<typeof insertWorkOrderMaterialSchema>;
export type WorkOrderMaterial = typeof workOrderMaterials.$inferSelect;

export const workOrderEvidence = pgTable("work_order_evidence", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  description: text("description").notNull(),
  fileType: text("file_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkOrderEvidenceSchema = createInsertSchema(workOrderEvidence).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkOrderEvidence = z.infer<typeof insertWorkOrderEvidenceSchema>;
export type WorkOrderEvidence = typeof workOrderEvidence.$inferSelect;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const workshops = pgTable("workshops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  type: text("type").notNull().default("internal"),
  capacity: integer("capacity"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkshopSchema = createInsertSchema(workshops).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type Workshop = typeof workshops.$inferSelect;

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  responsibleEmployeeId: integer("responsible_employee_id").references(() => employees.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAreaSchema = createInsertSchema(areas).omit({
  id: true,
  createdAt: true,
});
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type Area = typeof areas.$inferSelect;

export const companyConfiguration = pgTable("company_configuration", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  taxId: text("tax_id"),
  logo: text("logo"),
  timezone: text("timezone").notNull().default("America/Mexico_City"),
  currency: text("currency").notNull().default("MXN"),
  maintenanceAlertDays: integer("maintenance_alert_days").notNull().default(7),
  inventoryLowStockAlert: boolean("inventory_low_stock_alert").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanyConfigurationSchema = createInsertSchema(companyConfiguration).omit({
  id: true,
  updatedAt: true,
});
export type InsertCompanyConfiguration = z.infer<typeof insertCompanyConfigurationSchema>;
export type CompanyConfiguration = typeof companyConfiguration.$inferSelect;

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  module: text("module").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export const purchaseQuotes = pgTable("purchase_quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  providerId: integer("provider_id").notNull().references(() => providers.id),
  quoteDate: timestamp("quote_date").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  status: text("status").notNull().default("draft"),
  subtotal: real("subtotal").notNull().default(0),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPurchaseQuoteSchema = createInsertSchema(purchaseQuotes).omit({
  id: true,
  createdAt: true,
}).extend({
  quoteDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
});
export type InsertPurchaseQuote = z.infer<typeof insertPurchaseQuoteSchema>;
export type PurchaseQuote = typeof purchaseQuotes.$inferSelect;

export const purchaseQuoteItems = pgTable("purchase_quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => purchaseQuotes.id),
  partNumber: text("part_number"),
  itemDescription: text("item_description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  notes: text("notes"),
});

export const insertPurchaseQuoteItemSchema = createInsertSchema(purchaseQuoteItems).omit({
  id: true,
});
export type InsertPurchaseQuoteItem = z.infer<typeof insertPurchaseQuoteItemSchema>;
export type PurchaseQuoteItem = typeof purchaseQuoteItems.$inferSelect;
