import { useState } from "react";
import { DashboardStats } from "@/components/dashboard-stats";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleTable } from "@/components/vehicle-table";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid, List } from "lucide-react";
import vanImage from "@assets/generated_images/White_commercial_van_photo_54e80b21.png";
import truckImage from "@assets/generated_images/Blue_pickup_truck_photo_7661941b.png";
import suvImage from "@assets/generated_images/Black_SUV_photo_7860039e.png";
import sedanImage from "@assets/generated_images/Red_sedan_photo_016ea969.png";

export default function VehiclesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const vehicles = [
    {
      id: "1",
      make: "Ford",
      model: "Transit",
      year: 2023,
      plate: "ABC-1234",
      status: "active" as const,
      nextService: "15 Nov 2024",
      imageUrl: vanImage,
      mileage: 45230,
    },
    {
      id: "2",
      make: "Toyota",
      model: "Hilux",
      year: 2022,
      plate: "DEF-5678",
      status: "in-service" as const,
      nextService: "20 Nov 2024",
      imageUrl: truckImage,
      mileage: 78540,
    },
    {
      id: "3",
      make: "Chevrolet",
      model: "Suburban",
      year: 2024,
      plate: "GHI-9012",
      status: "active" as const,
      nextService: "10 Dic 2024",
      imageUrl: suvImage,
      mileage: 12500,
    },
    {
      id: "4",
      make: "Honda",
      model: "Accord",
      year: 2023,
      plate: "JKL-3456",
      status: "active" as const,
      nextService: "25 Nov 2024",
      imageUrl: sedanImage,
      mileage: 32450,
    },
  ];

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Vehículos</h1>
        <p className="text-muted-foreground">
          Administra toda la información de tu flotilla vehicular
        </p>
      </div>

      <DashboardStats />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vehículos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-vehicles"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <AddVehicleDialog />
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} {...vehicle} />
          ))}
        </div>
      ) : (
        <VehicleTable vehicles={filteredVehicles} />
      )}
    </div>
  );
}
