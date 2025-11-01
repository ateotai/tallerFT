import "dotenv/config";
import { db } from "../db";
import { vehicles } from "@shared/schema";

// 5 vehículos nuevos con placas únicas
const newVehicles = [
  {
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    plate: "NEW-101",
    vin: "JTDBR32E220NEW101",
    color: "Blanco",
    mileage: 15000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Norte",
    economicNumber: "VH-101",
  },
  {
    brand: "Volkswagen",
    model: "Tiguan",
    year: 2021,
    plate: "NEW-102",
    vin: "WVGZZZ5NZ1NEW102",
    color: "Gris",
    mileage: 32000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Centro",
    economicNumber: "VH-102",
  },
  {
    brand: "Ford",
    model: "Ranger",
    year: 2020,
    plate: "NEW-103",
    vin: "1FTZR15E2LNEW103",
    color: "Azul",
    mileage: 54000,
    fuelType: "Diesel",
    status: "active",
    assignedArea: "Sur",
    economicNumber: "VH-103",
  },
  {
    brand: "Nissan",
    model: "NP300",
    year: 2019,
    plate: "NEW-104",
    vin: "3N6DD25T9KNEW104",
    color: "Rojo",
    mileage: 76000,
    fuelType: "Gasolina",
    status: "active",
    assignedArea: "Este",
    economicNumber: "VH-104",
  },
  {
    brand: "Mercedes-Benz",
    model: "Sprinter",
    year: 2023,
    plate: "NEW-105",
    vin: "WD3PE7CC5PNEW105",
    color: "Negro",
    mileage: 9000,
    fuelType: "Diesel",
    status: "active",
    assignedArea: "Oeste",
    economicNumber: "VH-105",
  },
];

async function seedFiveVehicles() {
  try {
    console.log("🌱 Insertando 5 vehículos nuevos...");
    let inserted = 0;

    for (const v of newVehicles) {
      // Evitar duplicados por placa
      await db
        .insert(vehicles)
        .values(v)
        .onConflictDoNothing();
      inserted++;
      console.log(`✓ Vehículo creado: ${v.brand} ${v.model} (${v.plate})`);
    }

    const total = (await db.select().from(vehicles)).length;
    console.log(`\n✅ Inserciones completadas. Total de vehículos en BD: ${total}`);
  } catch (error) {
    console.error("❌ Error al insertar vehículos:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedFiveVehicles();