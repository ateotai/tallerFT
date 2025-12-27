import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, authenticateUser, hashPassword } from "./authMiddleware";
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
  insertClientBranchSchema,
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
  insertRoleSchema,
  insertPermissionSchema,
  insertRolePermissionSchema,
  insertPurchaseQuoteSchema,
  insertPurchaseQuoteItemSchema,
  insertChecklistSchema,
  insertChecklistTemplateSchema,
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
  // Ensure essential permissions for newly added modules exist
  try {
    const existing = await storage.getPermissions();
    const key = (p: any) => `${(p.name||'').trim()}|${(p.module||'').trim()}`;
    const existingKeys = new Set(existing.map(key));
    const required = [
      { name: "Ver checklists", module: "Checklists", description: "Listado y visualización de checklists" },
      { name: "Crear checklist", module: "Checklists", description: "Registro de nuevos checklists" },
      { name: "Ver historial de checklists", module: "Checklists", description: "Historial y búsqueda de checklists" },
      { name: "Administrar plantillas", module: "Checklists", description: "Crear, editar y activar/desactivar plantillas" },
      { name: "Ver consulta de historial", module: "Consulta de historial", description: "Acceder y operar la consulta de historial" },
    ];
    for (const r of required) {
      if (!existingKeys.has(`${r.name}|${r.module}`)) {
        await storage.createPermission(r as any);
      }
    }
  } catch (err) {
    console.error("ensure permissions error:", err);
  }
  // Configure multer for company logo uploads
  const uploadsDir = path.resolve(import.meta.dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const storageEngine = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const ts = Date.now();
      const match = req.path.match(/\/api\/vehicles\/(\d+)\/image/);
      if (match) {
        const vid = match[1];
        cb(null, `vehicle-${vid}-${ts}${ext}`);
      } else if (req.path.startsWith("/api/checklists/upload")) {
        cb(null, `checklist-evidence-${ts}${ext}`);
      } else {
        cb(null, `company-logo-${ts}${ext}`);
      }
    },
  });
  const upload = multer({
    storage: storageEngine,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const baseAllowed = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
      ];
      const extraAllowed = ["application/pdf"];
      const allowed = req.path.startsWith("/api/checklists/upload") ? [...baseAllowed, ...extraAllowed] : baseAllowed;
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Tipo de archivo no permitido"));
    },
  });

  // Multer for inventory import (CSV from Excel)
  const importUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/octet-stream",
      ];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Formato no soportado. Usa CSV exportado desde Excel"));
    },
  });
  // Login endpoint
  const loginSchema = z.object({
    username: z.string().min(1, "Usuario requerido"),
    password: z.string().min(1, "Contraseña requerida"),
  });

  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { username, password } = validatedData;

      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Error al iniciar sesión" });
        }

        req.session.userId = user.id;
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Error saving session:", saveErr);
            return res.status(500).json({ message: "Error al iniciar sesión" });
          }

          res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            canViewAllVehicles: user.canViewAllVehicles,
          });
        });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error during login:", error);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV || "development" });
  });

  // Current user endpoint
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        canViewAllVehicles: user.canViewAllVehicles,
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Error al obtener usuario actual" });
    }
  });
  
  // Protect all other API routes with authentication
  app.use('/api/*', (req, res, next) => {
    // Skip protection for auth-related endpoints
    if (req.path === '/api/login' || 
        req.path === '/api/logout' ||
        req.path === '/api/auth/user' ||
        req.path === '/api/health') {
      return next();
    }
    // Apply authentication middleware to all other API routes
    return isAuthenticated(req, res, next);
  });

  // All routes below this point are protected
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

  // Vehículos: plantilla CSV para importación masiva (solo admin)
  app.get("/api/vehicles/template", async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) return res.status(403).json({ error: "No autorizado" });

      const header = [
        "plate",
        "brand",
        "model",
        "year",
        "vin",
        "economicNumber",
        "color",
        "mileage",
        "fuelType",
        "status",
        "clientName",
        "branchName",
        "vehicleTypeName",
        "assignedArea",
        "serie",
        "engineNumber",
        "vehicleValue",
        "policyNumber",
        "insurer",
        "policyStart",
        "policyEnd",
      ];
      const explanation = [
        "Placa única (obligatorio)",
        "Marca (obligatorio)",
        "Modelo (obligatorio)",
        "Año numérico (obligatorio)",
        "VIN (opcional)",
        "Número económico (obligatorio)",
        "Color (opcional)",
        "Kilometraje numérico (obligatorio)",
        "Tipo de combustible (obligatorio)",
        "Estatus (opcional, ej. active)",
        "Nombre del cliente (opcional)",
        "Nombre de la sucursal (opcional)",
        "Nombre del tipo de vehículo (opcional)",
        "Área asignada (opcional)",
        "Serie (opcional)",
        "Número de motor (opcional)",
        "Valor vehicular numérico (opcional)",
        "Número de póliza (opcional)",
        "Aseguradora (opcional)",
        "Fecha inicio póliza (opcional, formato YYYY-MM-DD)",
        "Fecha vencimiento póliza (opcional, formato YYYY-MM-DD)",
      ];
      const sep = ";";
      const bom = "\ufeff";
      const csv = bom + [header.join(sep), explanation.join(sep)].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=plantilla_vehiculos.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error generating vehicles template:", error);
      res.status(500).json({ error: "Error al generar plantilla" });
    }
  });

  // Vehículos: importación masiva desde CSV (solo admin)
  app.post("/api/vehicles/import", importUpload.single("file"), async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) return res.status(403).json({ error: "No autorizado" });

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Archivo no recibido" });
      }

      let content = req.file.buffer.toString("utf-8");
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
      const lines = content.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return res.status(400).json({ error: "CSV sin datos" });
      const detectedSep = lines[0].includes(";") ? ";" : ",";
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (ch === detectedSep && !inQuotes) {
            result.push(cur); cur = "";
          } else {
            cur += ch;
          }
        }
        result.push(cur);
        return result.map((v) => v.trim());
      };

      const header = parseCsvLine(lines[0]).map((h) => h.trim());
      const expected = [
        "plate","brand","model","year","vin","economicNumber","color","mileage","fuelType","status","clientName","branchName","vehicleTypeName","assignedArea","serie","engineNumber","vehicleValue","policyNumber","insurer","policyStart","policyEnd"
      ];
      const matchesHeader = expected.every((e, idx) => (header[idx] || "").toLowerCase() === e.toLowerCase());
      const startIdx = matchesHeader ? 1 : 0;
      // Skip explanation row if present (non-numeric in year/mileage)
      let dataStart = startIdx;
      if (lines[dataStart]) {
        const cols = parseCsvLine(lines[dataStart]);
        if (cols[3] && isNaN(Number(cols[3]))) dataStart++;
      }

      const clients = await storage.getClients();
      const branches = await storage.getClientBranches();
      const vehicleTypes = await storage.getVehicleTypes();

      const summary = { created: 0, updated: 0, errors: [] as Array<{ row: number; error: string }> };

      for (let li = dataStart; li < lines.length; li++) {
        const row = parseCsvLine(lines[li]);
        if (row.length === 1 && row[0] === "") continue;
        const [plate, brand, model, yearStr, vin, economicNumber, color, mileageStr, fuelType, status, clientName, branchName, vehicleTypeName, assignedArea, serie, engineNumber, vehicleValueStr, policyNumber, insurer, policyStartStr, policyEndStr] = row;
        const rowNum = li + 1;
        if (!plate) { summary.errors.push({ row: rowNum, error: "Falta placa" }); continue; }
        if (!brand) { summary.errors.push({ row: rowNum, error: "Falta marca" }); continue; }
        if (!model) { summary.errors.push({ row: rowNum, error: "Falta modelo" }); continue; }
        if (!economicNumber) { summary.errors.push({ row: rowNum, error: "Falta número económico" }); continue; }
        const year = Number(yearStr ?? "");
        if (!Number.isFinite(year)) { summary.errors.push({ row: rowNum, error: "Año inválido" }); continue; }
        const mileage = Number(mileageStr ?? "");
        if (!Number.isFinite(mileage)) { summary.errors.push({ row: rowNum, error: "Kilometraje inválido" }); continue; }
        if (!fuelType) { summary.errors.push({ row: rowNum, error: "Falta tipo de combustible" }); continue; }
        let vehicleValue: number | null = null;
        if ((vehicleValueStr ?? "").trim().length > 0) {
          const vv = Number(vehicleValueStr);
          if (!Number.isFinite(vv)) { summary.errors.push({ row: rowNum, error: "Valor vehicular inválido" }); continue; }
          vehicleValue = vv;
        }
        let policyStart: Date | null = null;
        if ((policyStartStr ?? "").trim().length > 0) {
          const d = new Date(policyStartStr);
          if (isNaN(d.getTime())) { summary.errors.push({ row: rowNum, error: "Fecha inicio póliza inválida" }); continue; }
          policyStart = d;
        }
        let policyEnd: Date | null = null;
        if ((policyEndStr ?? "").trim().length > 0) {
          const d = new Date(policyEndStr);
          if (isNaN(d.getTime())) { summary.errors.push({ row: rowNum, error: "Fecha vencimiento póliza inválida" }); continue; }
          policyEnd = d;
        }
        const clientId = clientName ? (clients.find(c => (c.name || '').toLowerCase() === (clientName||'').toLowerCase())?.id ?? null) : null;
        const branchId = branchName ? (branches.find(b => (b.name || '').toLowerCase() === (branchName||'').toLowerCase())?.id ?? null) : null;
        const vehicleTypeId = vehicleTypeName ? (vehicleTypes.find(t => (t.name || '').toLowerCase() === (vehicleTypeName||'').toLowerCase())?.id ?? null) : null;

        const existing = await storage.getVehicleByPlate(plate);
        if (existing) {
          const updated = await storage.updateVehicle(existing.id, {
            brand,
            model,
            year,
            vin: vin || existing.vin,
            economicNumber: economicNumber || existing.economicNumber,
            color: color || existing.color,
            mileage,
            fuelType,
            status: status || existing.status,
            clientId,
            branchId,
            vehicleTypeId,
            assignedArea: assignedArea || existing.assignedArea,
            serie: serie || existing.serie,
            engineNumber: engineNumber || existing.engineNumber,
            vehicleValue: vehicleValue ?? existing.vehicleValue ?? null,
            policyNumber: policyNumber || existing.policyNumber,
            insurer: insurer || existing.insurer,
            policyStart: policyStart ?? existing.policyStart ?? null,
            policyEnd: policyEnd ?? existing.policyEnd ?? null,
          });
          if (updated) summary.updated++;
          else summary.errors.push({ row: rowNum, error: "No se pudo actualizar" });
        } else {
          try {
            const validated = insertVehicleSchema.parse({
              plate,
              brand,
              model,
              year,
              vin: vin || null,
              economicNumber: economicNumber || null,
              color: color || null,
              mileage,
              fuelType,
              status: status || "active",
              clientId,
              branchId,
              vehicleTypeId,
              assignedArea: assignedArea || null,
              serie: (serie ?? "") ? serie : null,
              engineNumber: (engineNumber ?? "") ? engineNumber : null,
              vehicleValue: vehicleValue,
              policyNumber: (policyNumber ?? "") ? policyNumber : null,
              insurer: (insurer ?? "") ? insurer : null,
              policyStart: policyStart,
              policyEnd: policyEnd,
              imageUrl: null,
              assignedEmployeeId: null,
              assignedUserId: null,
            } as any);
            await storage.createVehicle(validated);
            summary.created++;
          } catch (err) {
            const msg = err instanceof ZodError ? "Datos inválidos" : "Error al crear";
            summary.errors.push({ row: rowNum, error: msg });
          }
        }
      }

      return res.json(summary);
    } catch (error) {
      console.error("Error importing vehicles:", error);
      res.status(500).json({ error: "Error al importar vehículos" });
    }
  });

  app.get("/api/vehicles/transfer-history", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const history = await storage.getAllVehicleBranchHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching vehicle branch history:", error);
      res.status(500).json({ error: "Error al obtener historial de transferencias" });
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

  app.post("/api/vehicles/clear", async (req, res) => {
    try {
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!currentUser || !isAdmin) {
        return res.status(403).json({ error: "Solo el administrador puede limpiar vehículos" });
      }

      await storage.clearVehicles();
      res.json({ ok: true });
    } catch (error) {
      console.error("Error clearing vehicles:", error);
      res.status(500).json({ error: "Error al limpiar vehículos" });
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

  app.post("/api/vehicles/:id/transfer", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const schema = z.object({
        toBranchId: z.number(),
        reason: z.string().min(1, "El motivo es requerido"),
      });

      const { toBranchId, reason } = schema.parse(req.body);

      const vehicle = await storage.transferVehicleBranch(id, toBranchId, reason, userId);
      
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error transferring vehicle:", error);
      res.status(500).json({ error: "Error al transferir vehículo" });
    }
  });

  app.get("/api/vehicles/:id/transfer-history", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const history = await storage.getVehicleBranchHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching vehicle branch history:", error);
      res.status(500).json({ error: "Error al obtener historial de transferencias del vehículo" });
    }
  });

  app.post("/api/vehicles/:id/image", upload.single("image"), async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "Archivo requerido" });
      }
      const publicUrl = `/uploads/${file.filename}`;
      const vehicle = await storage.updateVehicle(id, { imageUrl: publicUrl });
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.json({ url: publicUrl, vehicle });
    } catch (error) {
      console.error("Error uploading vehicle image:", error);
      res.status(500).json({ error: "Error al subir imagen" });
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

  // Checklists module
  app.get("/api/checklists", async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });

      const all = await storage.getChecklists();
      let filtered = all;

      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) {
        const assignedVehicle = await storage.getVehicleAssignedToUser(currentUser.id);
        const lowerName = (currentUser.fullName || "").toLowerCase();
        filtered = all.filter((c) => {
          const byAssignedVehicle = assignedVehicle ? c.vehicleId === assignedVehicle.id : false;
          const byDriverName = (String(c.driverName || "").toLowerCase().includes(lowerName));
          const byHandoverUser = c.handoverUserId === currentUser.id;
          const byInspectorName = (String(c.inspectorName || "").toLowerCase().includes(lowerName));
          return byAssignedVehicle || byDriverName || byInspectorName || byHandoverUser;
        });
      }

      const status = typeof req.query.status === "string" ? String(req.query.status).toLowerCase() : "";
      if (status === "operando" || status === "operando_con_falla") {
        filtered = filtered.filter((c) => (String((c as any).status || "").toLowerCase()) === status);
      }

      const vehicleIdParam = typeof req.query.vehicleId === "string" ? Number(req.query.vehicleId) : undefined;
      if (vehicleIdParam && Number.isFinite(vehicleIdParam)) {
        filtered = filtered.filter((c) => c.vehicleId === vehicleIdParam);
      }

      const economicNumber = typeof req.query.economicNumber === "string" ? String(req.query.economicNumber).trim().toLowerCase() : "";
      if (economicNumber) {
        filtered = filtered.filter((c) => String(c.economicNumber || "").toLowerCase().includes(economicNumber));
      }

      const startParam = typeof req.query.start === "string" ? req.query.start : undefined;
      const endParam = typeof req.query.end === "string" ? req.query.end : undefined;
      const startDate = startParam ? new Date(startParam) : undefined;
      const endDate = endParam ? new Date(endParam) : undefined;
      if (endDate) endDate.setHours(23,59,59,999);
      if (startDate || endDate) {
        filtered = filtered.filter((c) => {
          const created = c.createdAt ? new Date(c.createdAt as unknown as string) : undefined;
          if (!created) return false;
          const after = startDate ? created >= startDate : true;
          const before = endDate ? created <= endDate : true;
          return after && before;
        });
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ error: "Error al obtener checklists" });
    }
  });

  app.post("/api/checklists/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "Archivo requerido" });
      }
      const publicUrl = `/uploads/${file.filename}`;
      res.status(201).json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading checklist evidence:", error);
      res.status(500).json({ error: "Error al subir archivo" });
    }
  });

  app.get("/api/checklists/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const checklist = await storage.getChecklist(id);
      if (!checklist) {
        return res.status(404).json({ error: "Checklist no encontrado" });
      }
      res.json(checklist);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      res.status(500).json({ error: "Error al obtener checklist" });
    }
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      const validatedData = insertChecklistSchema.parse(req.body);
      const userId = req.session.userId;
      const user = userId ? await storage.getUser(userId) : undefined;
      if (!user) return res.status(401).json({ error: "No autenticado" });
      if (validatedData.type === "completo" && user.role !== "admin") {
        return res.status(403).json({ error: "Solo administradores pueden crear checklist completo" });
      }
      // Crear con estado base; recalcular usando resultados guardados para máxima confiabilidad
      const payload = { ...validatedData, status: "operando", createdByUserId: user.id } as any;
      let checklist = await storage.createChecklist(payload);
      const savedResults = (checklist as any).results || {};
      const hasFailure = (() => {
        const hasNoDeep = (node: any): boolean => {
          if (node == null) return false;
          if (typeof node !== "object") {
            const v = String(node).toLowerCase();
            return v === "no";
          }
          if (Array.isArray(node)) {
            for (const it of node) { if (hasNoDeep(it)) return true; }
            return false;
          }
          if (typeof node === "object") {
            for (const [k, v] of Object.entries(node)) {
              if (String(k).toLowerCase() === "state" && String(v).toLowerCase() === "no") return true;
              if (hasNoDeep(v)) return true;
            }
            return false;
          }
          return false;
        };
        // Preferir resultados guardados; si están vacíos, usar los del payload
        return hasNoDeep(savedResults) || hasNoDeep((validatedData as any).results || {});
      })();
      const desiredStatus = hasFailure ? "operando_con_falla" : "operando";
      if ((checklist as any).status !== desiredStatus) {
        const updated = await storage.updateChecklist(checklist.id, { status: desiredStatus } as any);
        if (updated) checklist = updated;
      }
      // Asignar folio si no viene
      if (!checklist.folio) {
        const withFolio = await storage.updateChecklist(checklist.id, { folio: `CL-${checklist.id}` });
        res.status(201).json(withFolio ?? checklist);
      } else {
        res.status(201).json(checklist);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating checklist:", error);
      res.status(500).json({ error: "Error al crear checklist" });
    }
  });

  app.put("/api/checklists/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertChecklistSchema.partial().parse(req.body);
      const userId = req.session.userId;
      const user = userId ? await storage.getUser(userId) : undefined;
      if (!user) return res.status(401).json({ error: "No autenticado" });
      const existing = await storage.getChecklist(id);
      if (!existing) return res.status(404).json({ error: "Checklist no encontrado" });
      const roleText = (user.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      const creatorId = (existing as any).createdByUserId as number | undefined;
      const isCreator = creatorId != null && creatorId === user.id;
      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: "No autorizado para editar esta revisión" });
      }
      if (validatedData.type === "completo" && user.role !== "admin") {
        return res.status(403).json({ error: "Solo administradores pueden asignar checklist completo" });
      }
      // Determinar resultados efectivos (si el body trajo resultados, usar esos; si no, usar los actuales)
      const nextResults = (validatedData.results ?? (existing as any).results ?? {}) as Record<string, any>;
      const hasFailureBodyAware = (() => {
        const hasNoDeep = (node: any): boolean => {
          if (node == null) return false;
          if (typeof node !== "object") {
            const v = String(node).toLowerCase();
            return v === "no";
          }
          if (Array.isArray(node)) {
            for (const it of node) { if (hasNoDeep(it)) return true; }
            return false;
          }
          if (typeof node === "object") {
            for (const [k, v] of Object.entries(node)) {
              if (String(k).toLowerCase() === "state" && String(v).toLowerCase() === "no") return true;
              if (hasNoDeep(v)) return true;
            }
            return false;
          }
          return false;
        };
        return hasNoDeep(nextResults);
      })();
      // Aplicar actualización incluyendo status calculado
      const updateData: any = { ...validatedData, status: hasFailureBodyAware ? "operando_con_falla" : "operando" };
      const updatedChecklist = await storage.updateChecklist(id, updateData);
      if (!updatedChecklist) {
        return res.status(404).json({ error: "Checklist no encontrado" });
      }
      res.json(updatedChecklist);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating checklist:", error);
      res.status(500).json({ error: "Error al actualizar checklist" });
    }
  });

  // Assigned vehicle for current user
  app.get("/api/users/me/assigned-vehicle", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "No autenticado" });
      const vehicle = await storage.getVehicleAssignedToUser(userId);
      if (!vehicle) return res.status(404).json({ error: "Sin vehículo asignado" });
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching assigned vehicle:", error);
      res.status(500).json({ error: "Error al obtener vehículo asignado" });
    }
  });

  app.delete("/api/checklists/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteChecklist(id);
      if (!deleted) {
        return res.status(404).json({ error: "Checklist no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting checklist:", error);
      res.status(500).json({ error: "Error al eliminar checklist" });
    }
  });

  // Checklist Templates
  app.get("/api/checklist-templates", async (req, res) => {
    try {
      const list = await storage.getChecklistTemplates();
      const activeOnly = req.query.activeOnly === "true";
      const unique = req.query.unique === "true";

      let filtered = activeOnly ? list.filter((t) => t.active) : list;

      if (unique) {
        const pickMap = new Map<string, typeof filtered[number]>();
        for (const t of filtered) {
          const key = `${t.name}|${t.type}`;
          const current = pickMap.get(key);
          if (!current) {
            pickMap.set(key, t);
            continue;
          }
          const currActive = !!current.active;
          const tActive = !!t.active;
          const currUpdated = current.updatedAt ? new Date(current.updatedAt as unknown as string).getTime() : 0;
          const tUpdated = t.updatedAt ? new Date(t.updatedAt as unknown as string).getTime() : 0;
          const preferT = (!currActive && tActive) || (currActive === tActive && tUpdated > currUpdated);
          if (preferT) pickMap.set(key, t);
        }
        filtered = Array.from(pickMap.values());
      }

      const withRoles = await Promise.all(
        filtered.map(async (tpl) => {
          const roleIds = await storage.getChecklistTemplateRoles(tpl.id as number);
          let roleNames: string[] = [];
          if (!roleIds.length) {
            const allRoles = await storage.getRoles();
            const operario = allRoles.find((r) => (r.name || "").toLowerCase().includes("operario"));
            if (operario) {
              await storage.updateChecklistTemplate(tpl.id as number, {}, [operario.id]);
              roleIds.push(operario.id);
            }
            roleNames = roleIds.map((id) => allRoles.find((r) => r.id === id)?.name).filter(Boolean) as string[];
          } else {
            const allRoles = await storage.getRoles();
            roleNames = roleIds.map((id) => allRoles.find((r) => r.id === id)?.name).filter(Boolean) as string[];
          }
          return { ...tpl, roleIds, roleNames };
        })
      );
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.json(withRoles);
    } catch (error) {
      console.error("Error fetching checklist templates:", error);
      res.status(500).json({ error: "Error al obtener plantillas" });
    }
  });

  app.get("/api/checklist-templates/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) return res.status(400).json({ error: "ID inválido" });
      const tpl = await storage.getChecklistTemplate(id);
      if (!tpl) return res.status(404).json({ error: "Plantilla no encontrada" });
      const roleIds = await storage.getChecklistTemplateRoles(id);
      let roleNames: string[] = [];
      const allRoles = await storage.getRoles();
      if (!roleIds.length) {
        const operario = allRoles.find((r) => (r.name || "").toLowerCase().includes("operario"));
        if (operario) {
          await storage.updateChecklistTemplate(id, {}, [operario.id]);
          roleIds.push(operario.id);
        }
      }
      roleNames = roleIds.map((rid) => allRoles.find((r) => r.id === rid)?.name).filter(Boolean) as string[];
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.json({ ...tpl, roleIds, roleNames });
    } catch (error) {
      console.error("Error fetching checklist template:", error);
      res.status(500).json({ error: "Error al obtener plantilla" });
    }
  });

  app.get("/api/checklist-templates/by-role/:role", async (req, res) => {
    try {
      const role = req.params.role;
      const tpl = await storage.getChecklistTemplateByRole(role);
      if (!tpl) return res.status(404).json({ error: "No hay plantilla para el rol" });
      res.json(tpl);
    } catch (error) {
      console.error("Error fetching checklist template by role:", error);
      res.status(500).json({ error: "Error al obtener plantilla por rol" });
    }
  });

  app.get("/api/checklist-templates/by-role/:role/all", async (req, res) => {
    try {
      const role = req.params.role;
      const tpls = await storage.getChecklistTemplatesByRole(role);
      if (!tpls || tpls.length === 0) return res.status(404).json([]);
      res.json(tpls);
    } catch (error) {
      console.error("Error fetching checklist templates by role:", error);
      res.status(500).json({ error: "Error al obtener plantillas por rol" });
    }
  });

  app.post("/api/checklist-templates", async (req, res) => {
    try {
      const body = req.body as any;
      const roles = Array.isArray(body.roleIds) ? body.roleIds.map((r: any) => Number(r)).filter((n: any) => Number.isInteger(n)) : [];
      const validated = insertChecklistTemplateSchema.parse({
        name: body.name,
        description: body.description,
        type: body.type,
        sections: body.sections,
        active: body.active,
      });
      const created = await storage.createChecklistTemplate(validated, roles);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating checklist template:", error);
      res.status(500).json({ error: "Error al crear plantilla" });
    }
  });

  app.put("/api/checklist-templates/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) return res.status(400).json({ error: "ID inválido" });
      const body = req.body as any;
      const roles = Array.isArray(body.roleIds) ? body.roleIds.map((r: any) => Number(r)).filter((n: any) => Number.isInteger(n)) : undefined;
      const validated = insertChecklistTemplateSchema.partial().parse({
        name: body.name,
        description: body.description,
        type: body.type,
        sections: body.sections,
        active: body.active,
      });
      const updated = await storage.updateChecklistTemplate(id, validated, roles);
      if (!updated) return res.status(404).json({ error: "Plantilla no encontrada" });
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating checklist template:", error);
      res.status(500).json({ error: "Error al actualizar plantilla" });
    }
  });

  app.delete("/api/checklist-templates/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) return res.status(400).json({ error: "ID inválido" });
      const ok = await storage.deleteChecklistTemplate(id);
      if (!ok) return res.status(404).json({ error: "Plantilla no encontrada" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting checklist template:", error);
      res.status(500).json({ error: "Error al eliminar plantilla" });
    }
  });

  // Historial de vehículo por número económico o VIN
  const vehicleHistoryQuerySchema = z.object({
    economicNumber: z.string().min(1).optional(),
    vin: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }).refine((data) => !!data.economicNumber || !!data.vin, {
    message: "Debe proporcionar número económico o VIN",
    path: ["economicNumber"],
  });

  app.get("/api/vehicle-history", async (req, res) => {
    try {
      const params = vehicleHistoryQuerySchema.parse(req.query);
      const { economicNumber, vin, startDate, endDate } = params;

      let vehicle = undefined as Awaited<ReturnType<typeof storage.getVehicle>> | undefined;
      if (economicNumber) {
        vehicle = await storage.getVehicleByEconomicNumber(economicNumber);
      } else if (vin) {
        vehicle = await storage.getVehicleByVin(vin);
      }

      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }

      const vehicleId = vehicle.id;
      let reports = await storage.getReportsByVehicle(vehicleId);
      // Filtrar por rango de fechas si se proporciona
      if (startDate || endDate) {
        reports = reports.filter((r) => {
          const createdAt = r.createdAt ? new Date(r.createdAt as unknown as string) : undefined;
          if (!createdAt) return false;
          const afterStart = startDate ? createdAt >= startDate : true;
          const beforeEnd = endDate ? createdAt <= endDate : true;
          return afterStart && beforeEnd;
        });
      }

      const diagnosticsAll: any[] = [];
      for (const report of reports) {
        const d = await storage.getDiagnosticsByReport(report.id);
        diagnosticsAll.push(...d);
      }

      const workOrders = await storage.getWorkOrdersByVehicle(vehicleId);
      const workOrdersWithDetails = await Promise.all(
        workOrders.map(async (wo) => {
          const tasks = await storage.getWorkOrderTasks(wo.id);
          const materials = await storage.getWorkOrderMaterials(wo.id);
          return { ...wo, tasks, materials };
        })
      );

      const services = await storage.getServicesByVehicle(vehicleId);

      res.json({
        vehicle,
        reports,
        diagnostics: diagnosticsAll,
        workOrders: workOrdersWithDetails,
        services,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Parámetros inválidos", details: error.errors });
      }
      console.error("Error fetching vehicle history:", error);
      res.status(500).json({ error: "Error al obtener historial de vehículo" });
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
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || "").toLowerCase();
      const isPrivileged = ["admin", "administrador", "supervisor"].includes(roleText);

      const items = vehicleId
        ? await storage.getScheduledMaintenanceByVehicle(vehicleId)
        : await storage.getScheduledMaintenance();

      if (!isPrivileged && currentUser) {
        const filtered = items.filter((it) => Number(it.assignedUserId || NaN) === Number(currentUser.id));
        return res.json(filtered);
      }

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
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || "").toLowerCase();
      const isPrivileged = ["admin", "administrador", "supervisor"].includes(roleText);
      if (!isPrivileged && currentUser && Number(item.assignedUserId || NaN) !== Number(currentUser.id)) {
        return res.status(403).json({ error: "No autorizado" });
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

  // Providers: CSV template download
  app.get("/api/providers/template", async (_req, res) => {
    const headers = [
      "Nombre",
      "Tipo",
      "Teléfono",
      "Email",
      "Dirección",
      "Código",
      "RFC",
      "Régimen",
      "Nombre comercial",
    ];
    const csv = "\uFEFF" + "sep=,\n" + headers.join(",") + "\n";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=plantilla_proveedores.csv");
    res.send(csv);
  });

  // Providers: import from CSV
  app.post("/api/providers/upload", (req, res) => {
    importUpload.single("file")(req as any, res as any, async (err: any) => {
      if (err) {
        const msg = err?.message || "Error al procesar archivo";
        return res.status(400).json({ error: msg });
      }
      try {
        if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
        const content = (req.file as any).buffer.toString("utf-8");
        const rawLines = content.split(/\r?\n/).filter((l: string) => l.length);
        if (rawLines.length < 2) return res.status(400).json({ error: "CSV sin datos" });
        const hasSep = rawLines[0].toLowerCase().startsWith("sep=");
        const startIndex = hasSep ? 1 : 0;
        const header = rawLines[startIndex];
        const delimiter = header.includes(";") && !header.includes(",") ? ";" : ",";
        const parseLine = (line: string): string[] => {
          const out: string[] = [];
          let cur = ""; let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQ && line[i+1] === '"') { cur += '"'; i++; }
              else inQ = !inQ;
            } else if (ch === delimiter && !inQ) {
              out.push(cur); cur = "";
            } else {
              cur += ch;
            }
          }
          out.push(cur);
          return out.map((s) => s.trim());
        };

        const headers = parseLine(header).map((h) => h.toLowerCase());
        const idx = (name: string) => headers.findIndex((h) => h.includes(name.toLowerCase()));

        const iNombre = idx("nombre");
        const iTipo = idx("tipo");
        const iTel = idx("tel") !== -1 ? idx("tel") : idx("teléfono");
        const iEmail = idx("email");
        const iDir = idx("dirección") !== -1 ? idx("dirección") : idx("direccion");
        const iCodigo = idx("código") !== -1 ? idx("código") : idx("codigo");
        const iRfc = idx("rfc");
        const iRegimen = idx("régimen") !== -1 ? idx("régimen") : idx("regimen");
        const iTrade = idx("nombre comercial");

        const entries: import("@shared/schema").InsertProvider[] = [];
        for (let li = startIndex + 1; li < rawLines.length; li++) {
          const cols = parseLine(rawLines[li]);
          const status = "active";
          const entry: import("@shared/schema").InsertProvider = {
            name: iNombre !== -1 ? cols[iNombre] : "",
            type: iTipo !== -1 ? cols[iTipo] : "",
            phone: iTel !== -1 ? cols[iTel] : "",
            email: iEmail !== -1 ? cols[iEmail] : "",
            address: iDir !== -1 ? cols[iDir] : "",
            status,
            rating: 0,
            code: iCodigo !== -1 ? cols[iCodigo] : "",
            rfc: iRfc !== -1 ? cols[iRfc] : "",
            regimen: iRegimen !== -1 ? cols[iRegimen] : "",
            tradeName: iTrade !== -1 ? cols[iTrade] : "",
          };
          entries.push(entry);
        }

        let inserted = 0;
        let updated = 0;
        for (const e of entries) {
          const rfc = (e.rfc || "").trim();
          if (rfc) {
            const existing = await storage.getProviderByRFC(rfc);
            if (existing) {
              await storage.updateProvider(existing.id, {
                name: e.name,
                type: e.type,
                phone: e.phone,
                email: e.email,
                address: e.address,
                status: e.status,
                rating: e.rating,
                code: e.code,
                regimen: e.regimen,
                tradeName: e.tradeName,
              });
              updated++;
              continue;
            }
          }
          await storage.createProvider(e);
          inserted++;
        }
        const total = (await storage.getProviders()).length;
        res.json({ inserted, updated, total });
      } catch (error) {
        console.error("Error importing providers:", error);
        res.status(500).json({ error: "Error al importar proveedores" });
      }
    });
  });

  app.get("/api/providers/:id(\\d+)", async (req, res) => {
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

  app.put("/api/providers/:id(\\d+)", async (req, res) => {
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

  app.delete("/api/providers/:id(\\d+)", async (req, res) => {
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
      const msg = (error as any)?.message || String(error);
      if (msg.includes("referenciado")) {
        return res.status(409).json({ error: msg });
      }
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

  // Clientes: plantilla CSV para importación masiva (solo admin)
  app.get("/api/clients/template", async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) return res.status(403).json({ error: "No autorizado" });

      const header = [
        "name",
        "company",
        "phone",
        "email",
        "address",
        "status",
      ];
      const explanation = [
        "Nombre (obligatorio)",
        "Empresa (opcional)",
        "Teléfono (obligatorio)",
        "Email (obligatorio)",
        "Dirección (obligatorio)",
        "Estatus (opcional, ej. active/inactive)",
      ];
      const sep = ";";
      const bom = "\ufeff";
      const csv = bom + [header.join(sep), explanation.join(sep)].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=plantilla_clientes.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error generating clients template:", error);
      res.status(500).json({ error: "Error al generar plantilla" });
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

  // Clientes: importación masiva desde CSV (solo admin)
  app.post("/api/clients/import", importUpload.single("file"), async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) return res.status(403).json({ error: "No autorizado" });

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Archivo no recibido" });
      }

      let content = req.file.buffer.toString("utf-8");
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
      const lines = content.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return res.status(400).json({ error: "CSV sin datos" });
      const detectedSep = lines[0].includes(";") ? ";" : ",";
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (ch === detectedSep && !inQuotes) {
            result.push(cur); cur = "";
          } else {
            cur += ch;
          }
        }
        result.push(cur);
        return result.map((v) => v.trim());
      };

      const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
      const expected = ["name","company","phone","email","address","status"];
      const matchesHeader = expected.every((e, idx) => (header[idx] || "") === e);
      const startIdx = matchesHeader ? 1 : 0;
      let dataStart = startIdx;
      if (lines[dataStart]) {
        const cols = parseCsvLine(lines[dataStart]);
        if (cols[0] && /obligatorio/i.test(cols[0])) dataStart++;
      }

      const existingClients = await storage.getClients();
      const summary = { created: 0, updated: 0, errors: [] as Array<{ row: number; error: string }> };

      for (let li = dataStart; li < lines.length; li++) {
        const row = parseCsvLine(lines[li]);
        if (row.length === 1 && row[0] === "") continue;
        const [name, company, phone, email, address, status] = row;
        const rowNum = li + 1;
        if (!name) { summary.errors.push({ row: rowNum, error: "Falta nombre" }); continue; }
        if (!phone) { summary.errors.push({ row: rowNum, error: "Falta teléfono" }); continue; }
        if (!email) { summary.errors.push({ row: rowNum, error: "Falta email" }); continue; }
        if (!address) { summary.errors.push({ row: rowNum, error: "Falta dirección" }); continue; }

        const matchByEmail = existingClients.find(c => (c.email || '').toLowerCase() === (email || '').toLowerCase());
        const matchByName = existingClients.find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
        const existing = matchByEmail || matchByName;

        if (existing) {
          const updated = await storage.updateClient(existing.id, {
            name,
            company: company || existing.company,
            phone,
            email,
            address,
            status: (status || existing.status || 'active'),
          });
          if (updated) summary.updated++;
          else summary.errors.push({ row: rowNum, error: "No se pudo actualizar" });
        } else {
          try {
            const validated = insertClientSchema.parse({
              name,
              company: company || null,
              phone,
              email,
              address,
              status: status || 'active',
            } as any);
            await storage.createClient(validated);
            summary.created++;
          } catch (err) {
            const msg = err instanceof ZodError ? "Datos inválidos" : "Error al crear";
            summary.errors.push({ row: rowNum, error: msg });
          }
        }
      }

      return res.json(summary);
    } catch (error) {
      console.error("Error importing clients:", error);
      res.status(500).json({ error: "Error al importar clientes" });
    }
  });

  app.get("/api/client-branches", async (req, res) => {
    try {
      const clientIdParam = req.query.clientId as string | undefined;
      if (clientIdParam) {
        const clientId = validateId(clientIdParam);
        if (clientId === null) return res.status(400).json({ error: "clientId inválido" });
        const branches = await storage.getClientBranchesByClient(clientId);
        return res.json(branches);
      }
      const branches = await storage.getClientBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching client branches:", error);
      res.status(500).json({ error: "Error al obtener sucursales" });
    }
  });

  app.get("/api/client-branches/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) return res.status(400).json({ error: "ID inválido" });
      const branch = await storage.getClientBranch(id);
      if (!branch) return res.status(404).json({ error: "Sucursal no encontrada" });
      res.json(branch);
    } catch (error) {
      console.error("Error fetching client branch:", error);
      res.status(500).json({ error: "Error al obtener sucursal" });
    }
  });

  app.post("/api/client-branches", async (req, res) => {
    try {
      const validatedData = insertClientBranchSchema.parse(req.body);
      const branch = await storage.createClientBranch(validatedData);
      res.status(201).json(branch);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating client branch:", error);
      res.status(500).json({ error: "Error al crear sucursal" });
    }
  });

  app.put("/api/client-branches/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) return res.status(400).json({ error: "ID inválido" });
      const validatedData = insertClientBranchSchema.partial().parse(req.body);
      const branch = await storage.updateClientBranch(id, validatedData);
      if (!branch) return res.status(404).json({ error: "Sucursal no encontrada" });
      res.json(branch);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating client branch:", error);
      res.status(500).json({ error: "Error al actualizar sucursal" });
    }
  });

  app.delete("/api/client-branches/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) return res.status(400).json({ error: "ID inválido" });
      const deleted = await storage.deleteClientBranch(id);
      if (!deleted) return res.status(404).json({ error: "Sucursal no encontrada" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client branch:", error);
      res.status(500).json({ error: "Error al eliminar sucursal" });
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
      const partCondition = typeof req.query.partCondition === "string" ? req.query.partCondition : undefined;
      const items = await storage.getInventoryItems(partCondition);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Error al obtener inventario" });
    }
  });

  // Download inventory import template (CSV)
  app.get("/api/inventory/template", async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) return res.status(403).json({ error: "No autorizado" });
      const header = [
        "sku",
        "partNumber",
        "name",
        "partCondition",
        "categoryName",
        "quantity",
        "minQuantity",
        "maxQuantity",
        "unitPrice",
        "location",
        "workshopName",
        "notes",
      ];
      const explanation = [
        "SKU único (obligatorio)",
        "Número de parte (opcional)",
        "Nombre del artículo (obligatorio)",
        "Nuevo|Prestado|Remanofacturado",
        "Nombre de la categoría (opcional)",
        "Cantidad numérica (obligatorio)",
        "Stock mínimo (opcional)",
        "Stock máximo (opcional)",
        "Precio unitario (obligatorio)",
        "Ubicación (opcional)",
        "Nombre del taller (opcional)",
        "Nota (opcional)",
      ];
      const sep = ";";
      const bom = "\ufeff";
      const csv = bom + [header.join(sep), explanation.join(sep)].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=plantilla_inventario.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Error al generar plantilla" });
    }
  });

  // Import inventory from CSV (admin only)
  app.post("/api/inventory/import", importUpload.single("file"), async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!isAdmin) return res.status(403).json({ error: "No autorizado" });

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Archivo no recibido" });
      }

      let content = req.file.buffer.toString("utf-8");
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
      // Simple CSV parsing supporting quotes
      const lines = content.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV sin datos" });
      }
      const detectedSep = lines[0].includes(";") ? ";" : ",";
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (ch === detectedSep && !inQuotes) {
            result.push(cur); cur = "";
          } else {
            cur += ch;
          }
        }
        result.push(cur);
        return result.map((v) => v.trim());
      };

      const header = parseCsvLine(lines[0]).map((h) => h.trim());
      const expected = [
        "sku","partNumber","name","partCondition","categoryName","quantity","minQuantity","maxQuantity","unitPrice","location","workshopName","notes"
      ];
      const matchesHeader = expected.every((e, idx) => (header[idx] || "").toLowerCase() === e.toLowerCase());
      const startIdx = matchesHeader ? 1 : 0; // allow files without header if user removed it
      // Skip explanation row if present (contains non-numeric in quantity column)
      let dataStart = startIdx;
      if (lines[dataStart]) {
        const cols = parseCsvLine(lines[dataStart]);
        if (cols[5] && isNaN(Number(cols[5]))) dataStart++;
      }

      const categories = await storage.getInventoryCategories();
      const workshops = await storage.getWorkshops();

      const summary = { created: 0, updated: 0, errors: [] as Array<{ row: number; error: string }> };

      for (let li = dataStart; li < lines.length; li++) {
        const row = parseCsvLine(lines[li]);
        if (row.length === 1 && row[0] === "") continue;
        const [sku, partNumber, name, partCondition, categoryName, quantityStr, minStr, maxStr, unitPriceStr, location, workshopName, notes] = row;
        const rowNum = li + 1;
        if (!sku) { summary.errors.push({ row: rowNum, error: "Falta sku" }); continue; }
        if (!name) { summary.errors.push({ row: rowNum, error: "Falta nombre" }); continue; }
        const quantity = Number(quantityStr ?? "");
        const unitPrice = Number(unitPriceStr ?? "");
        if (!Number.isFinite(quantity)) { summary.errors.push({ row: rowNum, error: "Cantidad inválida" }); continue; }
        if (!Number.isFinite(unitPrice)) { summary.errors.push({ row: rowNum, error: "Precio inválido" }); continue; }
        const minQuantity = Number(minStr ?? "0");
        const maxQuantity = Number(maxStr ?? "0");
        const categoryId = categoryName ? (categories.find(c => (c.name || '').toLowerCase() === (categoryName||'').toLowerCase())?.id ?? null) : null;
        const workshopId = workshopName ? (workshops.find(w => (w.name || '').toLowerCase() === (workshopName||'').toLowerCase())?.id ?? null) : null;
        const normalizedCondition = (partCondition || "Nuevo").trim();
        const cond = ["Nuevo","Prestado","Remanofacturado"].includes(normalizedCondition) ? normalizedCondition as any : "Nuevo";

        let existing = await storage.getInventoryItemBySKU(sku);
        if (!existing && partNumber) {
          existing = await storage.getInventoryItemByPartNumber(partNumber);
        }
        if (existing) {
          // Only update quantities; keep other fields unless provided
          const updated = await storage.updateInventoryItem(existing.id, {
            quantity,
            minQuantity: Number.isFinite(minQuantity) ? minQuantity : existing.minQuantity,
            maxQuantity: Number.isFinite(maxQuantity) ? maxQuantity : existing.maxQuantity,
          });
          if (updated) summary.updated++;
          else summary.errors.push({ row: rowNum, error: "No se pudo actualizar" });
        } else {
          try {
            const validated = insertInventorySchema.parse({
              name,
              categoryId,
              partNumber,
              sku,
              quantity,
              minQuantity: Number.isFinite(minQuantity) ? minQuantity : 0,
              maxQuantity: Number.isFinite(maxQuantity) ? maxQuantity : 0,
              unitPrice,
              location: location || null,
              providerId: null,
              workshopId,
              partCondition: cond,
              notes: notes || null,
            } as any);
            await storage.createInventoryItem(validated);
            summary.created++;
          } catch (err) {
            const msg = err instanceof ZodError ? "Datos inválidos" : "Error al crear";
            summary.errors.push({ row: rowNum, error: msg });
          }
        }
      }

      return res.json(summary);
    } catch (error) {
      console.error("Error importing inventory:", error);
      res.status(500).json({ error: "Error al importar inventario" });
    }
  });

  // Expense history: CSV template
  app.get("/api/expense-history/template", async (_req, res) => {
    const headers = [
      "Centro de",
      "Proveedor",
      "Vehiculo",
      "Concepto",
      "Descripción Gasto",
      "Fecha",
      "Total",
    ];
    const csv = "\uFEFF" + "sep=,\n" + headers.join(",") + "\n";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=plantilla_historial.csv");
    res.send(csv);
  });

  // Expense history: list
  app.get("/api/expense-history", async (_req, res) => {
    try {
      const rows = await storage.getExpenseHistory();
      res.json(rows);
    } catch (err) {
      console.error("Error fetching expense history:", err);
      res.status(500).json({ error: "Error al obtener historial" });
    }
  });

  // Expense history: import from CSV (Excel export)
  app.post("/api/expense-history/upload", (req, res) => {
    importUpload.single("file")(req as any, res as any, async (err: any) => {
      if (err) {
        const msg = err?.message || "Error al procesar archivo";
        return res.status(400).json({ error: msg });
      }
      try {
        if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
        const allowed = [
          "COMBUSTIBLE",
          "GAS",
          "REPARACIONES",
          "ACEITES Y LUBRICANTES",
          "FLETES",
          "TRASLADOS",
          "LEASING",
        ];
        const rawCategory = String((req.body?.category || "").toString()).trim().toUpperCase();
        if (!allowed.includes(rawCategory)) {
          return res.status(400).json({ error: "Categoría inválida" });
        }
        const content = (req.file as any).buffer.toString("utf-8");
      const rawLines = content.split(/\r?\n/).filter((l: string) => l.length);
      if (rawLines.length < 2) return res.status(400).json({ error: "CSV sin datos" });
      const hasSep = rawLines[0].toLowerCase().startsWith("sep=");
      const startIndex = hasSep ? 1 : 0;
      const header = rawLines[startIndex];
      const delimiter = header.includes(";") && !header.includes(",") ? ";" : ",";
      const parseLine = (line: string): string[] => {
        const out: string[] = [];
        let cur = ""; let inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQ && line[i+1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
          } else if (ch === delimiter && !inQ) {
            out.push(cur); cur = "";
          } else {
            cur += ch;
          }
        }
        out.push(cur);
        return out.map((s) => s.trim());
      };

      const headers = parseLine(header).map((h) => h.toLowerCase());
      const idx = (name: string) => headers.findIndex((h) => h.includes(name.toLowerCase()));
      const iCentro = idx("centro");
      const iProveedor = idx("proveedor");
      const iVehiculo = idx("vehiculo");
      const iCol1 = idx("columna1");
      const iCol2 = idx("column");
      const iConcepto = idx("concepto");
      const iDesc = idx("descripción") !== -1 ? idx("descripción") : idx("descripcion");
      const iUnidad = idx("unidad");
      const iFecha = idx("fecha");
      const iTotal = idx("total");

        const entries: import("@shared/schema").InsertExpenseHistory[] = [];
      for (let li = startIndex + 1; li < rawLines.length; li++) {
        const cols = parseLine(rawLines[li]);
        const rawDate = iFecha !== -1 ? cols[iFecha] : "";
        let date: Date | undefined = undefined;
        if (rawDate) {
          const m = rawDate.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
          if (m) date = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
        }
        const rawTotal = iTotal !== -1 ? cols[iTotal] : "";
        const total = Number(String(rawTotal).replace(/[^\d.-]/g, "")) || 0;
        entries.push({
          costCenter: iCentro !== -1 ? cols[iCentro] : "",
          provider: iProveedor !== -1 ? cols[iProveedor] : "",
          vehicle: iVehiculo !== -1 ? cols[iVehiculo] : "",
          column1: iCol1 !== -1 ? cols[iCol1] : undefined,
          column2: iCol2 !== -1 ? cols[iCol2] : undefined,
          concept: iConcepto !== -1 ? cols[iConcepto] : "",
          category: rawCategory,
          expenseDescription: iDesc !== -1 ? cols[iDesc] : undefined,
          unit: iUnidad !== -1 ? cols[iUnidad] : undefined,
          date,
          total,
        });
      }

      const rows = await storage.createExpenseHistory(entries);
      const total = (await storage.getExpenseHistory()).length;
      res.json({ inserted: rows.length, total, rows });
      } catch (error) {
        console.error("Error importing expense history:", error);
        res.status(500).json({ error: "Error al importar historial" });
      }
    });
  });

  // Expense history: delete by category and date range
  app.post("/api/expense-history/delete", async (req, res) => {
    try {
      const allowed = [
        "COMBUSTIBLE",
        "GAS",
        "REPARACIONES",
        "ACEITES Y LUBRICANTES",
        "FLETES",
        "TRASLADOS",
        "LEASING",
      ];
      const categoryRaw = String((req.body?.category || "").toString()).trim().toUpperCase();
      if (categoryRaw && !allowed.includes(categoryRaw)) {
        return res.status(400).json({ error: "Categoría inválida" });
      }
      const startDate = req.body?.startDate ? new Date(String(req.body.startDate)) : undefined;
      const endDate = req.body?.endDate ? new Date(String(req.body.endDate)) : undefined;
      const deleted = await storage.deleteExpenseHistoryByFilter({ category: categoryRaw || undefined, startDate, endDate });
      res.json({ deleted });
    } catch (err) {
      console.error("Error deleting expense history:", err);
      res.status(500).json({ error: "Error al eliminar historial" });
    }
  });

  // Expense history: clear all
  app.post("/api/expense-history/clear", async (_req, res) => {
    try {
      const count = await storage.clearExpenseHistory();
      res.json({ deleted: count });
    } catch (err) {
      console.error("Error clearing expense history:", err);
      res.status(500).json({ error: "Error al limpiar historial" });
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
      const rawSku = typeof req.body.sku === "string" ? req.body.sku.trim() : req.body.sku;
      const normalizedSku = rawSku && typeof rawSku === "string" && rawSku.length ? rawSku : null;
      const validatedData = insertInventorySchema.parse({ ...req.body, sku: normalizedSku });
      if (validatedData.sku) {
        const existing = await storage.getInventoryItemBySKU(validatedData.sku);
        if (existing) {
          return res.status(409).json({ error: "SKU ya existe" });
        }
      }
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
      const rawSku = typeof req.body.sku === "string" ? req.body.sku.trim() : req.body.sku;
      const normalizedSku = rawSku && typeof rawSku === "string" && rawSku.length ? rawSku : null;
      const validatedData = insertInventorySchema.partial().parse({ ...req.body, sku: normalizedSku });
      if (validatedData.sku) {
        const existing = await storage.getInventoryItemBySKU(validatedData.sku);
        if (existing && existing.id !== id) {
          return res.status(409).json({ error: "SKU ya existe" });
        }
      }
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
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || "").toLowerCase();
      const isAdmin = roleText === "admin" || roleText === "administrador";

      const vehicleId = req.query.vehicleId ? validateId(req.query.vehicleId as string) : null;
      const userId = req.query.userId ? validateId(req.query.userId as string) : null;

      if (req.query.vehicleId && vehicleId === null) {
        return res.status(400).json({ error: "vehicleId inválido" });
      }
      if (req.query.userId && userId === null) {
        return res.status(400).json({ error: "userId inválido" });
      }

      let reports;
      if (isAdmin) {
        if (vehicleId) {
          reports = await storage.getReportsByVehicle(vehicleId);
        } else if (userId) {
          reports = await storage.getReportsByUser(userId);
        } else {
          reports = await storage.getReports();
        }
      } else {
        const own = await storage.getReportsByUser(currentUser!.id);
        const all = await storage.getReports();
        const employees = await storage.getEmployees();

        const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
        const userFull = norm(currentUser!.fullName || "");
        const candidates: Array<{ id: number }> = [];

        for (const e of employees) {
          if (e.userId === currentUser!.id) {
            if (!candidates.some(c => c.id === e.id)) candidates.push({ id: e.id });
            continue;
          }
          const empFull = norm(`${e.firstName || ""} ${e.lastName || ""}`);
          const emailMatch = norm(e.email || "") === norm(currentUser!.email || "");
          const nameExact = empFull === userFull;
          const nameIncludes = empFull.includes(userFull) || userFull.includes(empFull);
          if (emailMatch || nameExact || nameIncludes) {
            if (!candidates.some(c => c.id === e.id)) candidates.push({ id: e.id });
          }
        }

        const assigned = candidates.length
          ? all.filter(r => r.assignedToEmployeeId != null && candidates.some(c => c.id === r.assignedToEmployeeId))
          : [];
        const combined = [...own, ...assigned];
        const deduped = combined.filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i);
        reports = vehicleId ? deduped.filter(r => r.vehicleId === vehicleId) : deduped;
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
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || "").toLowerCase();
      const isAdmin = roleText === "admin" || roleText === "administrador";

      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Reporte no encontrado" });
      }

      if (!isAdmin) {
        if (report.userId !== currentUser!.id) {
          const employees = await storage.getEmployees();
          const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
          const userFull = norm(currentUser!.fullName || "");
          const candidates: Array<{ id: number }> = [];
          for (const e of employees) {
            if (e.userId === currentUser!.id) {
              if (!candidates.some(c => c.id === e.id)) candidates.push({ id: e.id });
              continue;
            }
            const empFull = norm(`${e.firstName || ""} ${e.lastName || ""}`);
            const emailMatch = norm(e.email || "") === norm(currentUser!.email || "");
            const nameExact = empFull === userFull;
            const nameIncludes = empFull.includes(userFull) || userFull.includes(empFull);
            if (emailMatch || nameExact || nameIncludes) {
              if (!candidates.some(c => c.id === e.id)) candidates.push({ id: e.id });
            }
          }
          const authorized = candidates.some(c => c.id === report.assignedToEmployeeId);
          if (!authorized) {
            return res.status(403).json({ error: "No autorizado" });
          }
        }
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
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "No autenticado" });
      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });
      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';

      if (!isAdmin) {
        if (!currentUser.canViewAllVehicles) {
          const assignedVehicle = await storage.getVehicleAssignedToUser(currentUser.id);
          if (!assignedVehicle) {
            return res.status(403).json({ error: "No puedes reportar fallas sin vehículo asignado" });
          }
          if (validatedData.vehicleId !== assignedVehicle.id) {
            return res.status(403).json({ error: "Solo puedes reportar fallas para tu vehículo asignado" });
          }
        }
        validatedData.userId = currentUser.id;
      }

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
        status: z.enum(["nuevo", "preliminares", "en_transito/rescate", "resolved", "pending", "in_progress", "asignado", "diagnostico", "validated"]).optional(),
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

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Error al obtener usuario" });
    }
  });

  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const createUserSchema = z.object({
        username: z.string().min(3, "Usuario muy corto"),
        password: z.string().min(6, "Contraseña muy corta"),
        email: z.string().email("Email inválido"),
        fullName: z.string().min(3, "Nombre muy corto"),
        role: z.string().optional().default("user"),
        active: z.boolean().optional().default(true),
      });
      const data = createUserSchema.parse(req.body);

      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        username: data.username,
        passwordHash,
        email: data.email,
        fullName: data.fullName,
        role: data.role ?? "user",
        active: data.active ?? true,
      });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Error al crear usuario" });
    }
  });

  // Update user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const updateUserSchema = z.object({
        username: z.string().min(3).optional(),
        password: z.string().min(6).optional(),
        email: z.string().email().optional(),
        fullName: z.string().min(3).optional(),
        role: z.string().optional(),
        active: z.boolean().optional(),
      });
      const data = updateUserSchema.parse(req.body);

      const updateData: any = {};
      if (data.username !== undefined) updateData.username = data.username;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.fullName !== undefined) updateData.fullName = data.fullName;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.password !== undefined) {
        updateData.passwordHash = await hashPassword(data.password);
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  });

  app.post("/api/reports/:id/assign", async (req, res) => {
    try {
      // Solo administrador puede asignar reportes
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || '').toLowerCase();
      if (!currentUser || (roleText !== 'admin' && roleText !== 'administrador')) {
        return res.status(403).json({ error: "Solo el administrador puede asignar reportes" });
      }

      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const { employeeId } = req.body;
      if (!employeeId || typeof employeeId !== 'number') {
        return res.status(400).json({ error: "Se requiere employeeId válido" });
      }
      console.log('[assign] admin', currentUser.id, 'asignando reporte', id, 'al empleado', employeeId, 'a las', new Date().toISOString());
      const result = await storage.assignReportToEmployee(id, employeeId);
      res.json(result);
    } catch (error) {
      console.error("Error assigning report:", error);
      res.status(500).json({ error: "Error al asignar reporte" });
    }
  });

  app.post("/api/reports/:id/reopen", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const report = await storage.reopenReport(id);
      if (!report) {
        return res.status(404).json({ error: "Reporte no encontrado" });
      }
      
      await storage.createNotification({
        title: "Reporte reabierto",
        message: `El reporte #${id} ha sido reabierto`,
        type: "report",
      });
      
      res.json(report);
    } catch (error) {
      console.error("Error reopening report:", error);
      res.status(500).json({ error: "Error al reabrir reporte" });
    }
  });

  app.post("/api/reports/:id/reject", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      if (!currentUser) return res.status(401).json({ error: "No autenticado" });

      const roleText = (currentUser.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';

      const report = await storage.getReport(id);
      if (!report) return res.status(404).json({ error: "Reporte no encontrado" });

      let authorized = false;
      if (isAdmin) {
        authorized = true;
      } else {
        const employees = await storage.getEmployees();
        const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
        const userFull = norm(currentUser.fullName || "");
        const candidates: Array<{ id: number }> = [];
        for (const e of employees) {
          if (e.userId === currentUser.id) {
            if (!candidates.some(c => c.id === e.id)) candidates.push({ id: e.id });
            continue;
          }
          const empFull = norm(`${e.firstName || ""} ${e.lastName || ""}`);
          const emailMatch = norm(e.email || "") === norm(currentUser.email || "");
          const nameExact = empFull === userFull;
          const nameIncludes = empFull.includes(userFull) || userFull.includes(empFull);
          if (emailMatch || nameExact || nameIncludes) {
            if (!candidates.some(c => c.id === e.id)) candidates.push({ id: e.id });
          }
        }
        authorized = report.assignedToEmployeeId != null && candidates.some(c => c.id === report.assignedToEmployeeId);
      }

      if (!authorized) return res.status(403).json({ error: "No autorizado" });

      const updated = await storage.rejectReport(id);
      if (!updated) return res.status(404).json({ error: "Reporte no encontrado" });

      // Eliminar diagnósticos no aprobados vinculados a este reporte para evitar reingreso automático a diagnóstico
      try {
        const diags = await storage.getDiagnosticsByReport(id);
        for (const d of diags) {
          const isApproved = !!(d as any).approvedAt;
          if (!isApproved) {
            await storage.deleteDiagnostic(d.id);
          }
        }
      } catch (cleanupErr) {
        console.warn("No se pudo limpiar diagnósticos del reporte rechazado", { reportId: id, error: cleanupErr });
      }

      await storage.createNotification({
        type: "report",
        title: "Reporte rechazado",
        message: `El reporte #${id} fue rechazado y regresó a nuevo`,
        read: false,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error rejecting report:", error);
      res.status(500).json({ error: "Error al rechazar reporte" });
    }
  });

  app.post("/api/reports/clear", async (req, res) => {
    try {
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      if (!currentUser || !isAdmin) {
        return res.status(403).json({ error: "Solo el administrador puede limpiar reportes" });
      }

      await storage.clearReports();
      await storage.createNotification({
        type: "report",
        title: "Reportes eliminados",
        message: `El administrador ${currentUser.username || currentUser.fullName || currentUser.id} eliminó todos los reportes`,
        read: false,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error("Error clearing reports:", error);
      res.status(500).json({ error: "Error al eliminar reportes" });
    }
  });

  app.post("/api/reports/migrate-pending-to-nuevo", async (req, res) => {
    try {
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || '').toLowerCase();
      if (!currentUser || (roleText !== 'admin' && roleText !== 'administrador')) {
        return res.status(403).json({ error: "Solo el administrador puede ejecutar la migración" });
      }
      const result = await storage.migratePendingReportsToNuevo();
      await storage.createNotification({
        type: "report",
        title: "Migración de estados",
        message: `Se actualizaron ${result.updated} reportes de Pendiente a Nuevo`,
        read: false,
      });
      res.json(result);
    } catch (error) {
      console.error("Error migrating report statuses:", error);
      res.status(500).json({ error: "Error al migrar estados de reportes" });
    }
  });

  app.get("/api/diagnostics", async (req, res) => {
    try {
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || "").toLowerCase();
      const isPrivileged = ["admin", "administrador", "supervisor"].includes(roleText);
      const includeApproved = (String(req.query.includeApproved || '').toLowerCase() === 'true') || (req.query.includeApproved === '1');

      const reportId = req.query.reportId ? validateId(req.query.reportId as string) : null;
      const employeeId = req.query.employeeId ? validateId(req.query.employeeId as string) : null;

      if (req.query.reportId && reportId === null) {
        return res.status(400).json({ error: "reportId inválido" });
      }
      if (req.query.employeeId && employeeId === null) {
        return res.status(400).json({ error: "employeeId inválido" });
      }

      // Log de contexto
      console.log('[diagnostics:list] context', { userId: currentUserId, role: currentUser?.role, isPrivileged, includeApproved, reportId, employeeId });

      // Si NO es admin/supervisor, devolver diagnósticos vinculados al empleado del usuario
      if (!isPrivileged && currentUser) {
        // Intentar primeramente por vínculo directo userId -> empleado
        let employee = await storage.getEmployeeByUserId(currentUser.id);

        // Fallback: si no hay vínculo por userId, intentar mapear por nombre completo o email
        if (!employee) {
          const employees = await storage.getEmployees();
          const fullName = (currentUser.fullName || "").trim().toLowerCase();
          const [firstCandidate, ...rest] = fullName.split(" ");
          const lastCandidate = rest.join(" ");
          employee = employees.find(e => (
            (e.firstName || "").trim().toLowerCase() === firstCandidate &&
            (e.lastName || "").trim().toLowerCase() === lastCandidate
          )) || employees.find(e => (
            (e.email || "").trim().toLowerCase() === (currentUser.email || "").trim().toLowerCase()
          ));
        }

        if (!employee) {
          return res.json([]);
        }
        const diagnostics = await storage.getDiagnosticsByEmployee(employee.id);
        console.log('[diagnostics:list] non-privileged employee', employee.id, 'rawCount', diagnostics.length);
        // Ocultar diagnósticos ya aprobados para la tabla (pendientes solamente)
        const filtered = diagnostics.filter(d => !d.approvedAt);
        console.log('[diagnostics:list] non-privileged filteredCount', filtered.length);
        return res.json(filtered);
      }

      let diagnostics;
      if (reportId) {
        diagnostics = await storage.getDiagnosticsByReport(reportId);
        console.log('[diagnostics:list] by report', reportId, 'rawCount', diagnostics.length);
      } else if (employeeId) {
        diagnostics = await storage.getDiagnosticsByEmployee(employeeId);
        console.log('[diagnostics:list] by employee', employeeId, 'rawCount', diagnostics.length);
      } else {
        diagnostics = await storage.getDiagnostics();
        console.log('[diagnostics:list] all rawCount', diagnostics.length);
      }
      // Por defecto ocultar aprobados; permitir incluirlos con includeApproved
      const filtered = includeApproved ? diagnostics : diagnostics.filter(d => !d.approvedAt);
      console.log('[diagnostics:list] includeApproved', includeApproved, 'filteredCount', filtered.length);
      res.json(filtered);
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

  // Ruta de depuración: devolver todos los diagnósticos sin filtros
  app.get("/api/diagnostics_debug_all", async (req, res) => {
    try {
      const diagnostics = await storage.getDiagnostics();
      res.json({ count: diagnostics.length, diagnostics });
    } catch (error) {
      console.error("Error fetching diagnostics_debug_all:", error);
      res.status(500).json({ error: "Error al obtener diagnósticos (debug)" });
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

  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = userId ? await storage.getUser(userId) : undefined;
      if (!currentUser) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const period = typeof req.query.period === "string" ? req.query.period : "6months";
      const vehicleParam = typeof req.query.vehicle === "string" ? req.query.vehicle : "all";
      const dateFromParam = typeof req.query.dateFrom === "string" ? req.query.dateFrom : "";
      const dateToParam = typeof req.query.dateTo === "string" ? req.query.dateTo : "";

      const now = new Date();
      let start = new Date(now);
      let end = new Date(now);
      if (period === "custom" && dateFromParam && dateToParam) {
        start = new Date(dateFromParam);
        end = new Date(dateToParam);
      } else {
        if (period === "1week") start.setDate(start.getDate() - 7);
        else if (period === "1month") start.setMonth(start.getMonth() - 1);
        else if (period === "3months") start.setMonth(start.getMonth() - 3);
        else if (period === "6months") start.setMonth(start.getMonth() - 6);
        else if (period === "1year") start.setFullYear(start.getFullYear() - 1);
      }
      end.setHours(23, 59, 59, 999);

      const services = await storage.getServices();
      const vehicles = await storage.getVehicles();
      const categories = await storage.getServiceCategories();
      const providers = await storage.getProviders();
      const workOrders = await storage.getWorkOrders();

      const plateByVehicleId = new Map<number, string>();
      const vehicleMetaById = new Map<number, { name: string; plate: string }>();
      for (const v of vehicles) {
        plateByVehicleId.set(v.id, v.plate || "");
        const name = `${v.brand} ${v.model}`.trim();
        vehicleMetaById.set(v.id, { name, plate: v.plate || "" });
      }
      const categoryNameById = new Map<number, string>();
      for (const c of categories) categoryNameById.set(c.id, c.name || "");
      const providerNameById = new Map<number, string>();
      for (const p of providers) providerNameById.set(p.id, p.name || "");

      const inRangeServices = services.filter((s) => {
        const d = (s.completedDate ?? s.scheduledDate ?? s.createdAt) as Date | null;
        if (!d) return false;
        const t = d.getTime();
        return t >= start.getTime() && t <= end.getTime();
      }).filter((s) => {
        if (vehicleParam === "all") return true;
        const plate = plateByVehicleId.get(s.vehicleId) || "";
        return plate === vehicleParam;
      });

      let totalCost = 0;
      for (const s of inRangeServices) totalCost += Number(s.cost || 0);
      const totalServices = inRangeServices.length;
      const avgCost = totalServices > 0 ? Math.round((totalCost / totalServices) * 100) / 100 : 0;

      const pendingStatuses = new Set(["awaiting_approval", "in_progress", "awaiting_validation"]);
      const inRangeWorkOrders = workOrders.filter((wo) => {
        const d = (wo.completedDate ?? wo.startDate ?? wo.createdAt) as Date | null;
        if (!d) return false;
        const t = d.getTime();
        return t >= start.getTime() && t <= end.getTime();
      }).filter((wo) => {
        if (vehicleParam === "all") return true;
        const plate = plateByVehicleId.get(wo.vehicleId) || "";
        return plate === vehicleParam;
      });
      const pendingServices = inRangeWorkOrders.filter((wo) => pendingStatuses.has((wo.status || "").toLowerCase())).length;

      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const monthlyMapCost = new Map<string, number>();
      const monthlyMapCount = new Map<string, number>();
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const limit = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= limit) {
        const k = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
        monthlyMapCost.set(k, 0);
        monthlyMapCount.set(k, 0);
        cursor.setMonth(cursor.getMonth() + 1);
      }
      for (const s of inRangeServices) {
        const d = (s.completedDate ?? s.scheduledDate ?? s.createdAt) as Date;
        const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthlyMapCost.set(k, (monthlyMapCost.get(k) || 0) + Number(s.cost || 0));
        monthlyMapCount.set(k, (monthlyMapCount.get(k) || 0) + 1);
      }
      const monthlyCost = Array.from(monthlyMapCost.entries()).map(([k, v]) => {
        const parts = k.split("-");
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        return { name: monthNames[m], value: Math.round(v * 100) / 100, y, m };
      }).sort((a, b) => (a.y === b.y ? a.m - b.m : a.y - b.y)).map(({ name, value }) => ({ name, value }));
      const monthlyServices = Array.from(monthlyMapCount.entries()).map(([k, v]) => {
        const parts = k.split("-");
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        return { name: monthNames[m], value: v, y, m };
      }).sort((a, b) => (a.y === b.y ? a.m - b.m : a.y - b.y)).map(({ name, value }) => ({ name, value }));

      const serviceTypeCount = new Map<string, number>();
      for (const s of inRangeServices) {
        const n = categoryNameById.get(s.categoryId) || "Sin categoría";
        serviceTypeCount.set(n, (serviceTypeCount.get(n) || 0) + 1);
      }
      const serviceType = Array.from(serviceTypeCount.entries()).map(([name, count]) => ({ name, value: count }));

      const providerCost = new Map<string, number>();
      for (const s of inRangeServices) {
        const n = s.providerId ? (providerNameById.get(s.providerId) || "Proveedor") : "Sin proveedor";
        providerCost.set(n, (providerCost.get(n) || 0) + Number(s.cost || 0));
      }
      const providersAgg = Array.from(providerCost.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

      const vehicleAgg = new Map<number, { services: number; total: number; last: Date | null }>();
      for (const s of inRangeServices) {
        const prev = vehicleAgg.get(s.vehicleId) || { services: 0, total: 0, last: null };
        const d = (s.completedDate ?? s.scheduledDate ?? s.createdAt) as Date;
        const last = prev.last && prev.last.getTime() > d.getTime() ? prev.last : d;
        vehicleAgg.set(s.vehicleId, { services: prev.services + 1, total: prev.total + Number(s.cost || 0), last });
      }
      const vehicleDetails = Array.from(vehicleAgg.entries()).map(([vid, v]) => {
        const meta = vehicleMetaById.get(vid) || { name: "", plate: "" };
        const avg = v.services > 0 ? Math.round((v.total / v.services) * 100) / 100 : 0;
        const lastStr = v.last ? `${v.last.getDate().toString().padStart(2, "0")} ${monthNames[v.last.getMonth()]} ${v.last.getFullYear()}` : "";
        return { id: String(vid), vehicle: meta.name, plate: meta.plate, services: v.services, totalCost: Math.round(v.total * 100) / 100, avgCost: avg, lastService: lastStr };
      }).sort((a, b) => b.totalCost - a.totalCost);

      let topVehicle = null as null | { vehicle: string; plate: string; totalCost: number };
      if (vehicleDetails.length > 0) {
        const t = vehicleDetails[0];
        topVehicle = { vehicle: t.vehicle, plate: t.plate, totalCost: t.totalCost };
      }
      let mostFrequentService = null as null | { name: string; count: number };
      if (serviceType.length > 0) {
        const s = [...serviceType].sort((a, b) => b.value - a.value)[0];
        mostFrequentService = { name: s.name, count: s.value };
      }
      let mostActiveMonth = null as null | { name: string; value: number };
      if (monthlyCost.length > 0) {
        const m = [...monthlyCost].sort((a, b) => b.value - a.value)[0];
        mostActiveMonth = { name: m.name, value: m.value };
      }

      res.json({
        summary: {
          totalCost: Math.round(totalCost * 100) / 100,
          totalServices,
          avgCost,
          pendingServices,
        },
        charts: {
          monthlyCost,
          monthlyServices,
          serviceType,
          providers: providersAgg,
        },
        table: vehicleDetails,
        highlights: {
          topVehicle,
          mostFrequentService,
          mostActiveMonth,
        },
      });
    } catch (error) {
      console.error("analytics overview error:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });

  app.get("/api/work-orders", async (req, res) => {
    try {
      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || '').toLowerCase();
      const isAdmin = roleText === 'admin' || roleText === 'administrador';
      const isPrivileged = isAdmin || roleText === 'supervisor';

      const vehicleId = req.query.vehicleId ? validateId(req.query.vehicleId as string) : null;
      const employeeId = req.query.employeeId ? validateId(req.query.employeeId as string) : null;

      if (req.query.vehicleId && vehicleId === null) {
        return res.status(400).json({ error: "vehicleId inválido" });
      }
      if (req.query.employeeId && employeeId === null) {
        return res.status(400).json({ error: "employeeId inválido" });
      }

      // Si NO es admin/supervisor, devolver órdenes asignadas al empleado del usuario
      // Se intenta primero por vínculo directo userId -> empleado y se agrega fallback por nombre/email
      if (!isPrivileged && currentUser) {
        let employee = await storage.getEmployeeByUserId(currentUser.id);

        if (!employee) {
          const employees = await storage.getEmployees();
          const fullName = (currentUser.fullName || "").trim().toLowerCase();
          const [firstCandidate, ...rest] = fullName.split(" ");
          const lastCandidate = rest.join(" ");
          employee = employees.find(e => (
            (e.firstName || "").trim().toLowerCase() === firstCandidate &&
            (e.lastName || "").trim().toLowerCase() === lastCandidate
          )) || employees.find(e => (
            (e.email || "").trim().toLowerCase() === (currentUser.email || "").trim().toLowerCase()
          ));
        }

        if (!employee) {
          return res.json([]);
        }
        let workOrders = await storage.getWorkOrdersByEmployee(employee.id);
        // Ocultamos órdenes en validación o validadas para usuarios que no son admin
        if (!isAdmin) {
          workOrders = workOrders.filter(wo => wo.status !== "awaiting_validation" && wo.status !== "validated" && wo.status !== "completed");
        }
        return res.json(workOrders);
      }

      let workOrders;
      if (vehicleId) {
        workOrders = await storage.getWorkOrdersByVehicle(vehicleId);
      } else if (employeeId) {
        workOrders = await storage.getWorkOrdersByEmployee(employeeId);
      } else {
        workOrders = await storage.getWorkOrders();
      }
      // Ocultamos órdenes en validación o validadas para usuarios que no son admin
      if (!isAdmin) {
        workOrders = workOrders.filter(wo => wo.status !== "awaiting_validation" && wo.status !== "validated" && wo.status !== "completed");
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

  // Validar orden de trabajo (solo administrador)
  app.post("/api/work-orders/:id/validate", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const roleText = (currentUser?.role || '').toLowerCase();
      if (!currentUser || (roleText !== 'admin' && roleText !== 'administrador')) {
        return res.status(403).json({ error: "Solo el administrador puede validar órdenes de trabajo" });
      }

      const workOrder = await storage.validateWorkOrder(id, currentUser.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }

      await storage.createNotification({
        title: "Orden de trabajo validada",
        message: `La orden de trabajo #${id} ha sido validada por administración`,
        type: "work_order",
      });

      res.json(workOrder);
    } catch (error) {
      console.error("Error validating work order:", error);
      res.status(500).json({ error: "Error al validar orden de trabajo" });
    }
  });

  app.post("/api/work-orders/:id/activate-vehicle", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const workOrder = await storage.getWorkOrder(id);
      if (!workOrder) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      
      const canActivate = workOrder.status === "validated" || workOrder.status === "temporary_activation";
      if (!canActivate) {
        return res.status(400).json({ error: "La orden de trabajo debe estar validada o en alta temporal para entregar el vehículo" });
      }
      
      const vehicle = await storage.getVehicle(workOrder.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      
      // If work order has a diagnostic, resolve the associated report
      if (workOrder.diagnosticId) {
        const diagnostic = await storage.getDiagnostic(workOrder.diagnosticId);
        if (diagnostic && diagnostic.reportId) {
          await storage.resolveReport(diagnostic.reportId);
        }
      }
      
      const isTemporary = workOrder.status === "temporary_activation";
      await storage.createNotification({
        title: isTemporary ? "Vehículo entregado al operario (alta temporal)" : "Vehículo dado de alta",
        message: isTemporary
          ? `El vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.economicNumber}) ha sido entregado al operario bajo alta temporal`
          : `El vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.economicNumber}) ha sido dado de alta y está listo para uso operativo`,
        type: "vehicle",
      });
      
      res.json({ success: true, message: "Vehículo activado exitosamente" });
    } catch (error) {
      console.error("Error activating vehicle:", error);
      res.status(500).json({ error: "Error al activar el vehículo" });
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

      const currentUserId = req.session.userId;
      const currentUser = currentUserId ? await storage.getUser(currentUserId) : undefined;
      const isPrivileged = currentUser && ["admin", "supervisor"].includes(currentUser.role.toLowerCase());

      let notifications;
      if (!isPrivileged && currentUser) {
        notifications = unreadOnly
          ? await storage.getUnreadNotificationsByUser(currentUser.id)
          : await storage.getNotificationsByUser(currentUser.id);
      } else {
        notifications = unreadOnly 
          ? await storage.getUnreadNotifications() 
          : await storage.getNotifications();
      }

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

  // Upload company logo via multipart/form-data
  app.post("/api/configuration/logo", upload.single("logo"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Archivo de logo requerido" });
      }
      const publicUrl = `/uploads/${file.filename}`;
      // Optionally update current configuration's logo if exists
      const existing = await storage.getCompanyConfiguration();
      if (existing?.id) {
        await storage.updateCompanyConfiguration(existing.id, { logo: publicUrl });
      }
      res.status(201).json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: "Error al subir logo" });
    }
  });

  // Roles routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Error al obtener roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ error: "Error al obtener rol" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Error al crear rol" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertRoleSchema.partial().parse(req.body);
      const role = await storage.updateRole(id, validatedData);
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      res.json(role);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Error al actualizar rol" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteRole(id);
      if (!deleted) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Error al eliminar rol" });
    }
  });

  // Permissions routes
  app.get("/api/permissions", async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Error al obtener permisos" });
    }
  });

  app.get("/api/permissions/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const permission = await storage.getPermission(id);
      if (!permission) {
        return res.status(404).json({ error: "Permiso no encontrado" });
      }
      res.json(permission);
    } catch (error) {
      console.error("Error fetching permission:", error);
      res.status(500).json({ error: "Error al obtener permiso" });
    }
  });

  app.post("/api/permissions", async (req, res) => {
    try {
      const validatedData = insertPermissionSchema.parse(req.body);
      const permission = await storage.createPermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating permission:", error);
      res.status(500).json({ error: "Error al crear permiso" });
    }
  });

  app.put("/api/permissions/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertPermissionSchema.partial().parse(req.body);
      const permission = await storage.updatePermission(id, validatedData);
      if (!permission) {
        return res.status(404).json({ error: "Permiso no encontrado" });
      }
      res.json(permission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Error al actualizar permiso" });
    }
  });

  app.delete("/api/permissions/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deletePermission(id);
      if (!deleted) {
        return res.status(404).json({ error: "Permiso no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ error: "Error al eliminar permiso" });
    }
  });

  // Role Permissions routes
  app.get("/api/role-permissions", async (req, res) => {
    try {
      const rolePermissions = await storage.getAllRolePermissions();
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Error al obtener permisos de roles" });
    }
  });

  app.get("/api/role-permissions/:roleId", async (req, res) => {
    try {
      const roleId = validateId(req.params.roleId);
      if (roleId === null) {
        return res.status(400).json({ error: "ID de rol inválido" });
      }
      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Error al obtener permisos del rol" });
    }
  });

  app.post("/api/role-permissions", async (req, res) => {
    try {
      const validatedData = insertRolePermissionSchema.parse(req.body);
      const rolePermission = await storage.createRolePermission(validatedData);
      res.status(201).json(rolePermission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating role permission:", error);
      res.status(500).json({ error: "Error al asignar permiso a rol" });
    }
  });

  app.delete("/api/role-permissions/:roleId/:permissionId", async (req, res) => {
    try {
      const roleId = validateId(req.params.roleId);
      const permissionId = validateId(req.params.permissionId);
      if (roleId === null || permissionId === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deleteRolePermission(roleId, permissionId);
      if (!deleted) {
        return res.status(404).json({ error: "Permiso de rol no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role permission:", error);
      res.status(500).json({ error: "Error al eliminar permiso de rol" });
    }
  });

  // Purchase Quotes routes
  app.get("/api/purchase-quotes", async (req, res) => {
    try {
      const quotes = await storage.getPurchaseQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching purchase quotes:", error);
      res.status(500).json({ error: "Error al obtener cotizaciones" });
    }
  });

  app.get("/api/purchase-quotes/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const quote = await storage.getPurchaseQuote(id);
      if (!quote) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching purchase quote:", error);
      res.status(500).json({ error: "Error al obtener cotización" });
    }
  });

  app.post("/api/purchase-quotes", async (req, res) => {
    try {
      const validatedData = insertPurchaseQuoteSchema.parse(req.body);
      const quote = await storage.createPurchaseQuote(validatedData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating purchase quote:", error);
      res.status(500).json({ error: "Error al crear cotización" });
    }
  });

  app.put("/api/purchase-quotes/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertPurchaseQuoteSchema.partial().parse(req.body);
      const quote = await storage.updatePurchaseQuote(id, validatedData);
      if (!quote) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
      res.json(quote);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating purchase quote:", error);
      res.status(500).json({ error: "Error al actualizar cotización" });
    }
  });

  app.delete("/api/purchase-quotes/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deletePurchaseQuote(id);
      if (!deleted) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase quote:", error);
      res.status(500).json({ error: "Error al eliminar cotización" });
    }
  });

  // Purchase Quote Items routes
  app.get("/api/purchase-quote-items/:quoteId", async (req, res) => {
    try {
      const quoteId = validateId(req.params.quoteId);
      if (quoteId === null) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }
      const items = await storage.getPurchaseQuoteItems(quoteId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching purchase quote items:", error);
      res.status(500).json({ error: "Error al obtener items de cotización" });
    }
  });

  app.post("/api/purchase-quote-items", async (req, res) => {
    try {
      const validatedData = insertPurchaseQuoteItemSchema.parse(req.body);
      const item = await storage.createPurchaseQuoteItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating purchase quote item:", error);
      res.status(500).json({ error: "Error al crear item de cotización" });
    }
  });

  app.put("/api/purchase-quote-items/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const validatedData = insertPurchaseQuoteItemSchema.partial().parse(req.body);
      const item = await storage.updatePurchaseQuoteItem(id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Item no encontrado" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating purchase quote item:", error);
      res.status(500).json({ error: "Error al actualizar item" });
    }
  });

  app.delete("/api/purchase-quote-items/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido" });
      }
      const deleted = await storage.deletePurchaseQuoteItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "Item no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase quote item:", error);
      res.status(500).json({ error: "Error al eliminar item" });
    }
  });

  app.delete("/api/purchase-quote-items/by-quote/:quoteId", async (req, res) => {
    try {
      const quoteId = validateId(req.params.quoteId);
      if (quoteId === null) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }
      await storage.deletePurchaseQuoteItems(quoteId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase quote items:", error);
      res.status(500).json({ error: "Error al eliminar items" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
