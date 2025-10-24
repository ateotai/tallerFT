import { db } from "../db";
import { inventory } from "@shared/schema";

const inventoryItems = [
  {
    partNumber: "FLT-001",
    name: "Filtro de Aceite",
    category: "Filtros",
    quantity: 45,
    minQuantity: 20,
    unitPrice: 125.50,
    location: "Almacén A-12",
    providerId: null,
  },
  {
    partNumber: "BRK-205",
    name: "Pastillas de Freno",
    category: "Frenos",
    quantity: 8,
    minQuantity: 15,
    unitPrice: 850.00,
    location: "Almacén B-05",
    providerId: null,
  },
  {
    partNumber: "SPK-103",
    name: "Bujías NGK",
    category: "Motor",
    quantity: 120,
    minQuantity: 30,
    unitPrice: 85.00,
    location: "Almacén A-08",
    providerId: null,
  },
  {
    partNumber: "OIL-500",
    name: "Aceite Motor 10W-40",
    category: "Lubricantes",
    quantity: 65,
    minQuantity: 40,
    unitPrice: 185.00,
    location: "Almacén C-01",
    providerId: null,
  },
  {
    partNumber: "TIR-001",
    name: "Neumático 205/55R16",
    category: "Neumáticos",
    quantity: 12,
    minQuantity: 16,
    unitPrice: 1250.00,
    location: "Almacén D-10",
    providerId: null,
  },
];

async function seed() {
  console.log("Seeding inventory...");
  
  for (const item of inventoryItems) {
    await db.insert(inventory).values(item);
    console.log(`Created inventory item: ${item.name}`);
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
