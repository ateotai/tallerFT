import { db } from "../db";
import { vehicleTypes } from "@shared/schema";

async function seedVehicleTypes() {
  console.log("Iniciando seed de tipos de vehículos...");

  // Verificar si ya hay datos
  const existingTypes = await db.select().from(vehicleTypes);
  
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

    await db
      .insert(vehicleTypes)
      .values(types)
      .onConflictDoNothing();
    console.log(`✓ ${types.length} tipos de vehículos insertados`);
  } else {
    console.log(`✓ Ya existen ${existingTypes.length} tipos de vehículos`);
  }

  console.log("¡Seed completado exitosamente!");
}

seedVehicleTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  });
