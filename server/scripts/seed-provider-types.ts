import { db } from "../db";
import { providerTypes } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedProviderTypes() {
  console.log("Iniciando seed de tipos de proveedores...");

  const existingTypes = await db.select().from(providerTypes);
  
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

    await db
      .insert(providerTypes)
      .values(types)
      .onConflictDoNothing();
    console.log(`✓ ${types.length} tipos de proveedores insertados`);
  } else {
    console.log(`✓ Ya existen ${existingTypes.length} tipos de proveedores`);
  }

  console.log("¡Seed completado exitosamente!");
}

seedProviderTypes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  });
