import { db, sqlite } from "../db";
import { providerTypes } from "@shared/schema";

async function seedProviderTypes() {
  console.log("Iniciando seed de tipos de proveedores...");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS provider_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("✓ Tabla provider_types creada/verificada");

  const existingTypes = db.select().from(providerTypes).all();
  
  if (existingTypes.length === 0) {
    const types = [
      {
        name: "Taller Mecánico",
        description: "Servicios de mecánica general y reparación de motores",
      },
      {
        name: "Taller Eléctrico",
        description: "Especialistas en sistemas eléctricos y electrónicos del vehículo",
      },
      {
        name: "Hojalatería y Pintura",
        description: "Reparación de carrocería, pintura y trabajos de chapa",
      },
      {
        name: "Llantas y Alineación",
        description: "Servicios de alineación, balanceo y venta de neumáticos",
      },
      {
        name: "Transmisiones",
        description: "Especialistas en reparación y mantenimiento de transmisiones",
      },
      {
        name: "Suspensión y Frenos",
        description: "Reparación y mantenimiento de sistemas de suspensión y frenos",
      },
      {
        name: "Especialista Diesel",
        description: "Servicios especializados para motores diesel",
      },
      {
        name: "Servicio Integral",
        description: "Taller con servicios completos para todo tipo de reparaciones",
      },
    ];

    db.insert(providerTypes).values(types).run();
    console.log(`✓ ${types.length} tipos de proveedores insertados`);
  } else {
    console.log(`✓ Ya existen ${existingTypes.length} tipos de proveedores`);
  }

  console.log("¡Seed completado exitosamente!");
}

seedProviderTypes().catch((error) => {
  console.error("Error en seed:", error);
  process.exit(1);
});
