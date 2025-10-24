import { db, sqlite } from "../db";
import { vehicleTypes } from "@shared/schema";

async function seedVehicleTypes() {
  console.log("Iniciando seed de tipos de vehículos...");

  // Crear tabla vehicle_types si no existe
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("✓ Tabla vehicle_types creada/verificada");

  // Verificar si la columna vehicle_type_id existe en vehicles
  const tableInfo = sqlite.prepare("PRAGMA table_info(vehicles)").all() as any[];
  const hasVehicleTypeId = tableInfo.some((col: any) => col.name === "vehicle_type_id");

  if (!hasVehicleTypeId) {
    // Agregar columna vehicle_type_id a vehicles
    sqlite.exec(`
      ALTER TABLE vehicles
      ADD COLUMN vehicle_type_id INTEGER REFERENCES vehicle_types(id)
    `);
    console.log("✓ Columna vehicle_type_id agregada a vehicles");
  } else {
    console.log("✓ Columna vehicle_type_id ya existe en vehicles");
  }

  // Verificar si ya hay datos
  const existingTypes = db.select().from(vehicleTypes).all();
  
  if (existingTypes.length === 0) {
    // Insertar tipos de vehículos
    const types = [
      {
        name: "Sedán",
        description: "Vehículo de pasajeros de 4 puertas con compartimento separado para el motor, pasajeros y carga",
      },
      {
        name: "SUV",
        description: "Vehículo utilitario deportivo con mayor altura y capacidad todo terreno",
      },
      {
        name: "Pickup",
        description: "Camioneta con cabina y área de carga abierta en la parte trasera",
      },
      {
        name: "Van",
        description: "Vehículo de carga o pasajeros con gran espacio interior y techo alto",
      },
      {
        name: "Hatchback",
        description: "Vehículo compacto con puerta trasera que se abre hacia arriba",
      },
      {
        name: "Coupé",
        description: "Vehículo deportivo de 2 puertas con diseño aerodinámico",
      },
      {
        name: "Convertible",
        description: "Vehículo con techo retráctil o removible",
      },
      {
        name: "Minivan",
        description: "Vehículo familiar con capacidad para 7-8 pasajeros y puertas corredizas",
      },
      {
        name: "Camión",
        description: "Vehículo pesado diseñado para transporte de carga",
      },
      {
        name: "Crossover",
        description: "Vehículo que combina características de SUV y sedán con chasis tipo automóvil",
      },
    ];

    db.insert(vehicleTypes).values(types).run();
    console.log(`✓ ${types.length} tipos de vehículos insertados`);
  } else {
    console.log(`✓ Ya existen ${existingTypes.length} tipos de vehículos`);
  }

  console.log("¡Seed completado exitosamente!");
}

seedVehicleTypes().catch((error) => {
  console.error("Error en seed:", error);
  process.exit(1);
});
