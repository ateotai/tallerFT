import { db } from "../db";
import { clients } from "@shared/schema";

const sampleClients = [
  {
    name: "Juan Carlos Pérez",
    company: "Transportes del Norte S.A.",
    phone: "555-1001",
    email: "jperez@transportesnorte.com",
    address: "Av. Insurgentes 1234, Col. Centro",
    status: "active",
  },
  {
    name: "María González",
    company: "Logística Rápida",
    phone: "555-1002",
    email: "mgonzalez@logisticarapida.com",
    address: "Calle Reforma 567, Col. Polanco",
    status: "active",
  },
  {
    name: "Roberto Martínez",
    company: "Distribuidora del Sur",
    phone: "555-1003",
    email: "rmartinez@distribuidorasur.com",
    address: "Blvd. Constitución 890, Col. Industrial",
    status: "active",
  },
  {
    name: "Ana Sánchez",
    company: "Servicios Ejecutivos",
    phone: "555-1004",
    email: "asanchez@serviciosejecutivos.com",
    address: "Av. Universidad 345, Col. Del Valle",
    status: "active",
  },
  {
    name: "Carlos López",
    company: "Fletes y Mudanzas Express",
    phone: "555-1005",
    email: "clopez@fletesexpress.com",
    address: "Calle Juárez 678, Col. Americana",
    status: "active",
  },
];

async function seed() {
  console.log("Seeding clients...");
  
  const existingClients = db.select().from(clients).all();
  
  // Siempre agregar clientes de ejemplo si hay menos de 5
  if (existingClients.length < 5) {
    const toInsert = sampleClients.slice(existingClients.length);
    for (const client of toInsert) {
      await db.insert(clients).values(client);
      console.log(`Created client: ${client.name}`);
    }
    console.log(`✓ ${toInsert.length} clientes nuevos insertados`);
  }
  
  const totalClients = db.select().from(clients).all().length;
  console.log(`✓ Total de clientes: ${totalClients}`);
  console.log("Clients seeding completed!");
}

seed()
  .catch((error) => {
    console.error("Error seeding clients:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
