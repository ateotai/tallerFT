import { db } from "../db";
import { clients, clientBranches } from "@shared/schema";
import { sql } from "drizzle-orm";

async function count(table: any) {
  const rows = await db.select({ c: sql<number>`count(*)` }).from(table);
  return Number(rows[0]?.c ?? 0);
}

async function main() {
  const beforeBranches = await count(clientBranches);
  const beforeClients = await count(clients);
  console.log(`Sucursales antes: ${beforeBranches}`);
  console.log(`Clientes antes: ${beforeClients}`);

  await db.delete(clientBranches);
  await db.delete(clients);

  const afterBranches = await count(clientBranches);
  const afterClients = await count(clients);
  console.log(`Sucursales después: ${afterBranches}`);
  console.log(`Clientes después: ${afterClients}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
