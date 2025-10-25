import { db } from "../db";
import { providers } from "@shared/schema";

const sampleProviders = [
  {
    name: "AutoPartes del Centro",
    type: "Taller Mecánico",
    phone: "555-0101",
    email: "ventas@autopartescentro.com",
    address: "Av. Reforma 123, Col. Centro",
    rating: 4.5,
    status: "active",
  },
  {
    name: "Refacciones Martínez",
    type: "Servicio Integral",
    phone: "555-0202",
    email: "info@refaccionesmartinez.com",
    address: "Calle Juárez 456, Col. Industrial",
    rating: 4.8,
    status: "active",
  },
  {
    name: "Taller González",
    type: "Taller Eléctrico",
    phone: "555-0303",
    email: "contacto@tallergonzalez.com",
    address: "Blvd. Norte 789, Col. San Pedro",
    rating: 4.2,
    status: "active",
  },
  {
    name: "Importadora de Refacciones",
    type: "Llantas y Alineación",
    phone: "555-0404",
    email: "ventas@importadoraref.com",
    address: "Av. Industrial 321, Parque Industrial",
    rating: 4.6,
    status: "active",
  },
  {
    name: "Servicio Automotriz Profesional",
    type: "Suspensión y Frenos",
    phone: "555-0505",
    email: "servicios@autoprofesional.com",
    address: "Calle Morelos 654, Col. Moderna",
    rating: 4.9,
    status: "active",
  },
];

async function seed() {
  console.log("Seeding providers...");
  
  const existingProviders = db.select().from(providers).all();
  
  if (existingProviders.length === 0) {
    for (const provider of sampleProviders) {
      await db.insert(providers).values(provider);
      console.log(`Created provider: ${provider.name}`);
    }
    console.log(`✓ ${sampleProviders.length} proveedores insertados`);
  } else {
    console.log(`✓ Ya existen ${existingProviders.length} proveedores`);
  }
  
  console.log("Providers seeding completed!");
}

seed()
  .catch((error) => {
    console.error("Error seeding providers:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
