import "dotenv/config";
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query(`ALTER TABLE "scheduled_maintenance" ADD COLUMN IF NOT EXISTS "assigned_user_id" integer`);

    await client.query(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'scheduled_maintenance_assigned_user_id_users_id_fk'
          AND table_name = 'scheduled_maintenance'
      ) THEN
        ALTER TABLE "scheduled_maintenance"
          ADD CONSTRAINT "scheduled_maintenance_assigned_user_id_users_id_fk"
          FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
      END IF;
    END
    $$;`);

    console.log("✓ columna y FK aplicadas en scheduled_maintenance");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
