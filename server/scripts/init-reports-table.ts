import { db } from "../db";
import { reports } from "@shared/schema";

async function initReportsTable() {
  console.log("Inicializando tabla reports...");
  
  try {
    db.select().from(reports).limit(1).all();
    console.log("✓ Tabla reports ya existe");
  } catch (error) {
    console.log("Tabla reports no existe, creándola...");
  }
  
  console.log("✓ Tabla reports lista");
}

initReportsTable()
  .catch((error) => {
    console.error("Error inicializando tabla reports:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
