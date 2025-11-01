import { db } from "../db";
import { inventoryCategories } from "@shared/schema";
import { sql } from "drizzle-orm";

const categories = [
  {
    name: "Filtros",
    description: "Filtros de aceite, aire, combustible y cabina",
  },
  {
    name: "Frenos",
    description: "Pastillas, discos, tambores y componentes de freno",
  },
  {
    name: "Motor",
    description: "Bujías, bobinas, sensores y componentes de motor",
  },
  {
    name: "Lubricantes",
    description: "Aceites, grasas y líquidos para mantenimiento",
  },
  {
    name: "Neumáticos",
    description: "Llantas, neumáticos y accesorios relacionados",
  },
];

async function seed() {
  console.log("Seeding inventory categories...");

  // Check existing
  const existing = await db.select().from(inventoryCategories);
  if (existing.length > 0) {
    console.log(`✓ Ya existen ${existing.length} categorías de inventario, se omite inserción`);
    return;
  }

  await db
    .insert(inventoryCategories)
    .values(categories)
    .onConflictDoNothing();

  console.log(`✓ ${categories.length} categorías de inventario insertadas`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding inventory categories:", error);
    process.exit(1);
  });
