import { db } from "../db";
import { inventory, workshops } from "@shared/schema";
import { asc, eq } from "drizzle-orm";

async function assignWorkshopToInventory() {
  console.log("🔧 Asignando taller a artículos de inventario con workshopId nulo...");

  // Obtener taller existente
  const [workshop] = await db.select().from(workshops).orderBy(asc(workshops.id)).limit(1);
  if (!workshop) {
    console.error("❌ No se encontró ningún taller. Crea un taller antes de ejecutar este script.");
    process.exit(1);
  }

  // Obtener todos los artículos de inventario
  const items = await db.select().from(inventory);
  const itemsToUpdate = items.filter((i) => i.workshopId == null);

  if (itemsToUpdate.length === 0) {
    console.log("✅ No hay artículos por actualizar. Todos ya tienen taller asignado.");
    process.exit(0);
  }

  for (const item of itemsToUpdate) {
    await db.update(inventory).set({ workshopId: workshop.id }).where(eq(inventory.id, item.id));
    console.log(`✓ Artículo actualizado: ${item.partNumber || `ID ${item.id}`} -> Taller ${workshop.name} (ID ${workshop.id})`);
  }

  console.log(`✅ ${itemsToUpdate.length} artículos actualizados con taller ${workshop.name} (ID ${workshop.id})`);
  process.exit(0);
}

assignWorkshopToInventory().catch((error) => {
  console.error("❌ Error al asignar taller al inventario:", error);
  process.exit(1);
});