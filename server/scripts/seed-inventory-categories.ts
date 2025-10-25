import { db } from "../db";
import { inventoryCategories } from "@shared/schema";

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
  
  for (const category of categories) {
    await db.insert(inventoryCategories).values(category);
    console.log(`Created category: ${category.name}`);
  }
  
  console.log("Inventory categories seeding completed!");
}

seed()
  .catch((error) => {
    console.error("Error seeding inventory categories:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
