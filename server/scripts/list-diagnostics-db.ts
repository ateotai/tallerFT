// Lista diagnósticos directamente desde la DB (sin endpoint) para validar inserciones
// Uso: npx tsx server/scripts/list-diagnostics-db.ts
import "dotenv/config";
import { storage } from "../storage";

async function main() {
  const diagnostics = await storage.getDiagnostics();
  console.log('Diagnósticos en DB:', diagnostics.length);
  if (diagnostics.length > 0) {
    console.log(diagnostics.map(d => ({ id: d.id, reportId: d.reportId, employeeId: d.employeeId, approvedAt: d.approvedAt })));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});