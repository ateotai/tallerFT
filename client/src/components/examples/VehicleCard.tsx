import { VehicleCard } from "../vehicle-card";
import vanImage from "@assets/generated_images/White_commercial_van_photo_54e80b21.png";

export default function VehicleCardExample() {
  return (
    <div className="max-w-sm">
      <VehicleCard
        id="1"
        make="Ford"
        model="Transit"
        year={2023}
        plate="ABC-1234"
        status="active"
        nextService="15 Nov 2024"
        imageUrl={vanImage}
        mileage={45230}
      />
    </div>
  );
}
