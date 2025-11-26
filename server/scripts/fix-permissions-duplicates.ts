import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definido en el entorno");
  }

  const sql = neon(databaseUrl);

  console.log("Buscando y eliminando permisos duplicados (name + module)...");
  // Remapear role_permissions al permiso con menor id y luego eliminar duplicados
  const remapped = await sql<[{ count: number }]>`
    WITH dups AS (
      SELECT p.id AS dup_id, p2.id AS keep_id
      FROM permissions p
      JOIN permissions p2
        ON p.name = p2.name
       AND p.module = p2.module
       AND p.id > p2.id
    ), upd AS (
      UPDATE role_permissions rp
         SET permission_id = dups.keep_id
      FROM dups
      WHERE rp.permission_id = dups.dup_id
      RETURNING 1
    ), del AS (
      DELETE FROM permissions p
      USING dups
      WHERE p.id = dups.dup_id
      RETURNING 1
    )
    SELECT COUNT(*)::int AS count FROM del;
  `;
  console.log(`Eliminados ${remapped[0]?.count ?? 0} permisos duplicados y remapeados role_permissions`);

  // Verificar que no queden duplicados
  const result = await sql<[{ count: number }]>`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT name, module, COUNT(*)
      FROM permissions
      GROUP BY name, module
      HAVING COUNT(*) > 1
    ) dup;
  `;

  const duplicatesRemaining = result[0]?.count ?? 0;
  if (duplicatesRemaining === 0) {
    console.log("✓ Duplicados eliminados. Puedes ejecutar drizzle-kit push de nuevo.");
  } else {
    console.log(`Aún quedan ${duplicatesRemaining} combinaciones duplicadas. Ejecuta el script otra vez o revisa manualmente.`);
  }
}

main().catch((err) => {
  console.error("Error al eliminar duplicados de permissions:", err);
  process.exit(1);
});