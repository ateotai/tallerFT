import { db } from "../db";
import { inventory, workshops } from "@shared/schema";
import { asc } from "drizzle-orm";

const inventoryItems = [
  {
    partNumber: "FLT-001",
    name: "Filtro de Aceite",
    categoryId: 1, // Filtros
    quantity: 45,
    minQuantity: 20,
    maxQuantity: 100,
    unitPrice: 125.5,
    location: "Almacén A-12",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "BRK-205",
    name: "Pastillas de Freno",
    categoryId: 2, // Frenos
    quantity: 8,
    minQuantity: 15,
    maxQuantity: 50,
    unitPrice: 850.0,
    location: "Almacén B-05",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "SPK-103",
    name: "Bujías NGK",
    categoryId: 3, // Motor
    quantity: 120,
    minQuantity: 30,
    maxQuantity: 200,
    unitPrice: 85.0,
    location: "Almacén A-08",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "OIL-500",
    name: "Aceite Motor 10W-40",
    categoryId: 4, // Lubricantes
    quantity: 65,
    minQuantity: 40,
    maxQuantity: 150,
    unitPrice: 185.0,
    location: "Almacén C-01",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "TIR-001",
    name: "Neumático 205/55R16",
    categoryId: 5, // Neumáticos
    quantity: 12,
    minQuantity: 16,
    maxQuantity: 60,
    unitPrice: 1250.0,
    location: "Almacén D-10",
    providerId: null,
    workshopId: null,
  },
  // Nuevas refacciones para completar 10
  {
    partNumber: "FLT-002",
    name: "Filtro de Aire",
    categoryId: 1,
    quantity: 70,
    minQuantity: 25,
    maxQuantity: 150,
    unitPrice: 95.0,
    location: "Almacén A-10",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "BRK-410",
    name: "Disco de Freno Ventilado",
    categoryId: 2,
    quantity: 20,
    minQuantity: 10,
    maxQuantity: 40,
    unitPrice: 980.0,
    location: "Almacén B-07",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "ENG-321",
    name: "Correa de Distribución",
    categoryId: 3,
    quantity: 35,
    minQuantity: 15,
    maxQuantity: 80,
    unitPrice: 450.0,
    location: "Almacén A-03",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "LUB-700",
    name: "Refrigerante Anticongelante",
    categoryId: 4,
    quantity: 50,
    minQuantity: 20,
    maxQuantity: 120,
    unitPrice: 160.0,
    location: "Almacén C-05",
    providerId: null,
    workshopId: null,
  },
  {
    partNumber: "TIR-010",
    name: "Válvula de Neumático TR413",
    categoryId: 5,
    quantity: 200,
    minQuantity: 50,
    maxQuantity: 400,
    unitPrice: 15.0,
    location: "Almacén D-02",
    providerId: null,
    workshopId: null,
  },
];

async function seed() {
  console.log("Seeding inventory...");
  
  // Obtener el primer taller existente para asignarlo al inventario
  const existingWorkshop = await db
    .select()
    .from(workshops)
    .orderBy(asc(workshops.id))
    .limit(1);

  const workshopId = existingWorkshop[0]?.id ?? null;
  if (!workshopId) {
    console.warn("⚠️ No hay talleres creados. Los artículos se insertarán sin workshopId.");
  }
  
  for (const rawItem of inventoryItems) {
    const item = { ...rawItem, workshopId: rawItem.workshopId ?? workshopId };
    await db
      .insert(inventory)
      .values(item)
      .onConflictDoNothing({ target: inventory.partNumber });
    console.log(`✓ Item: ${item.partNumber} - ${item.name}`);
  }
  
  console.log("Inventory seeding completed!");
}

seed()
  .catch((error) => {
    console.error("Error seeding inventory:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
