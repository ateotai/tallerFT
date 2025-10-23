import { InventoryTable } from "../inventory-table";

export default function InventoryTableExample() {
  const items = [
    {
      id: "1",
      partNumber: "FLT-001",
      name: "Filtro de Aceite",
      category: "Filtros",
      stock: 45,
      minStock: 20,
      price: 125.50,
      location: "Almacén A-12",
    },
    {
      id: "2",
      partNumber: "BRK-205",
      name: "Pastillas de Freno",
      category: "Frenos",
      stock: 8,
      minStock: 15,
      price: 850.00,
      location: "Almacén B-05",
    },
    {
      id: "3",
      partNumber: "SPK-103",
      name: "Bujías NGK",
      category: "Motor",
      stock: 120,
      minStock: 30,
      price: 85.00,
      location: "Almacén A-08",
    },
  ];

  return <InventoryTable items={items} />;
}
