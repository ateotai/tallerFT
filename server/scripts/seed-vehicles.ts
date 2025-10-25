import { db } from "../db";
import { vehicles } from "@shared/schema";

const sampleVehicles = [
  {
    clientId: 1,
    vehicleTypeId: 3, // Pickup
    brand: "Ford",
    model: "F-150",
    year: 2022,
    plate: "ABC-123",
    vin: "1FTFW1E50MFA12345",
    color: "Blanco",
    mileage: 45000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Norte",
    economicNumber: "VH-001",
  },
  {
    clientId: 1,
    vehicleTypeId: 4, // Van
    brand: "Mercedes-Benz",
    model: "Sprinter",
    year: 2021,
    plate: "DEF-456",
    vin: "WD3PE7CC5M5123456",
    color: "Gris",
    mileage: 78000,
    fuelType: "Diesel",
    status: "active",
    assignedArea: "Centro",
    economicNumber: "VH-002",
  },
  {
    clientId: 2,
    vehicleTypeId: 1, // Sedán
    brand: "Toyota",
    model: "Camry",
    year: 2023,
    plate: "GHI-789",
    vin: "4T1BF1FK5EU123456",
    color: "Negro",
    mileage: 12000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Sur",
    economicNumber: "VH-003",
  },
  {
    clientId: 2,
    vehicleTypeId: 2, // SUV
    brand: "Chevrolet",
    model: "Suburban",
    year: 2022,
    plate: "JKL-012",
    vin: "1GNSKCKD5MR123456",
    color: "Azul",
    mileage: 35000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Este",
    economicNumber: "VH-004",
  },
  {
    clientId: 3,
    vehicleTypeId: 9, // Camión
    brand: "Freightliner",
    model: "Cascadia",
    year: 2020,
    plate: "MNO-345",
    vin: "3AKJGLDR0LSJD1234",
    color: "Rojo",
    mileage: 150000,
    fuelType: "Diesel",
    status: "active",
    assignedArea: "Oeste",
    economicNumber: "VH-005",
  },
  {
    clientId: 3,
    vehicleTypeId: 3, // Pickup
    brand: "RAM",
    model: "2500",
    year: 2021,
    plate: "PQR-678",
    vin: "3C6UR5DL6MG123456",
    color: "Gris",
    mileage: 62000,
    fuelType: "Diesel",
    status: "active",
    assignedArea: "Norte",
    economicNumber: "VH-006",
  },
  {
    clientId: 4,
    vehicleTypeId: 1, // Sedán
    brand: "Honda",
    model: "Accord",
    year: 2023,
    plate: "STU-901",
    vin: "1HGCV1F16NA123456",
    color: "Plateado",
    mileage: 8000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Centro",
    economicNumber: "VH-007",
  },
  {
    clientId: 5,
    vehicleTypeId: 4, // Van
    brand: "Ford",
    model: "Transit",
    year: 2022,
    plate: "VWX-234",
    vin: "NM0LS7E7XM1234567",
    color: "Blanco",
    mileage: 42000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Sur",
    economicNumber: "VH-008",
  },
  {
    clientId: 5,
    vehicleTypeId: 2, // SUV
    brand: "Nissan",
    model: "Pathfinder",
    year: 2021,
    plate: "YZA-567",
    vin: "5N1DR2MM5MC123456",
    color: "Negro",
    mileage: 55000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Este",
    economicNumber: "VH-009",
  },
  {
    clientId: 1,
    vehicleTypeId: 3, // Pickup
    brand: "Chevrolet",
    model: "Silverado 1500",
    year: 2023,
    plate: "BCD-890",
    vin: "1GCUDEED5NZ123456",
    color: "Azul",
    mileage: 18000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Oeste",
    economicNumber: "VH-010",
  },
];

async function seed() {
  console.log("Seeding vehicles...");
  
  const existingVehicles = db.select().from(vehicles).all();
  
  // Siempre agregar vehículos de ejemplo si hay menos de 10
  if (existingVehicles.length < 10) {
    const toInsert = sampleVehicles.slice(existingVehicles.length);
    for (const vehicle of toInsert) {
      await db.insert(vehicles).values(vehicle);
      console.log(`Created vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`);
    }
    console.log(`✓ ${toInsert.length} vehículos nuevos insertados`);
  }
  
  const totalVehicles = db.select().from(vehicles).all().length;
  console.log(`✓ Total de vehículos: ${totalVehicles}`);
  console.log("Vehicles seeding completed!");
}

seed()
  .catch((error) => {
    console.error("Error seeding vehicles:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
