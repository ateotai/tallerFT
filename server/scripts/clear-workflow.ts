import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definido en el entorno");
  }

  const sql = neon(databaseUrl);

  console.log("Limpiando tablas de flujo: reports, diagnostics, work_orders y dependientes...");
  // Importante: incluir tablas dependientes para evitar restricciones de FK.
  // Reinicia los IDs para un flujo limpio.
  await sql`BEGIN`;
  try {
    await sql`
      TRUNCATE TABLE 
        work_order_evidence,
        work_order_materials,
        work_order_tasks,
        work_orders,
        diagnostics,
        reports
      RESTART IDENTITY CASCADE;
    `;
    await sql`COMMIT`;
    console.log("✓ Limpieza completada y secuencias reiniciadas");
  } catch (err) {
    await sql`ROLLBACK`;
    console.error("✗ Error durante la limpieza, se realizó rollback:", err);
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});