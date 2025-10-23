import { VehicleTable } from "../vehicle-table";

export default function VehicleTableExample() {
  const vehicles = [
    {
      id: "1",
      make: "Ford",
      model: "Transit",
      year: 2023,
      plate: "ABC-1234",
      status: "active" as const,
      mileage: 45230,
      nextService: "15 Nov 2024",
    },
    {
      id: "2",
      make: "Toyota",
      model: "Hilux",
      year: 2022,
      plate: "DEF-5678",
      status: "in-service" as const,
      mileage: 78540,
      nextService: "20 Nov 2024",
    },
    {
      id: "3",
      make: "Chevrolet",
      model: "Silverado",
      year: 2024,
      plate: "GHI-9012",
      status: "active" as const,
      mileage: 12500,
      nextService: "10 Dic 2024",
    },
  ];

  return <VehicleTable vehicles={vehicles} />;
}
