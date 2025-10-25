import { sql } from "drizzle-orm";
import { pgTable, text, serial, varchar, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
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
  nextDueDate: integer("next_due_date", { mode: "timestamp" }).notNull(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
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
  diagnosticId: integer("diagnostic_id").notNull().references(() => diagnostics.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  assignedToEmployeeId: integer("assigned_to_employee_id").references(() => employees.id),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("normal"),
  description: text("description").notNull(),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  startDate: timestamp("start_date"),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
