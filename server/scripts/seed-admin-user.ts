import { db } from "../db";
import { users, roles } from "@shared/schema";
import { hashPassword } from "../authMiddleware";
import { eq } from "drizzle-orm";

async function seedAdminUser() {
  console.log("🌱 Seeding admin user...");

  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists, skipping...");
      return;
    }

    // Get Administrador role
    const adminRole = await db.select().from(roles).where(eq(roles.name, "Administrador")).limit(1);
    const roleText = adminRole.length > 0 ? "Administrador" : "admin";

    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    
    await db.insert(users).values({
      username: "admin",
      passwordHash: hashedPassword,
      email: "admin@sistema.com",
      fullName: "Administrador del Sistema",
      role: roleText,
      active: true,
    });

    console.log("✅ Admin user created successfully");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   Email: admin@sistema.com");
    console.log("   ⚠️  IMPORTANTE: Cambie la contraseña después del primer inicio de sesión");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
}

seedAdminUser()
  .then(() => {
    console.log("✅ Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
