import { db } from "../db";
import { roles } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAdminRole() {
  console.log("🌱 Seeding base Administrador role...");

  // Check if Administrador already exists
  const existing = await db.select().from(roles).where(eq(roles.name, "Administrador")).limit(1);
  if (existing.length > 0) {
    console.log("✅ Administrador role already exists, skipping");
    return;
  }

  await db
    .insert(roles)
    .values({
      name: "Administrador",
      description: "Rol con acceso completo al sistema",
      active: true,
    })
    .onConflictDoNothing();

  console.log("✅ Administrador role created");
}

seedAdminRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding Administrador role:", error);
    process.exit(1);
  });