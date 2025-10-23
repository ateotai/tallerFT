import { ServiceCard } from "../service-card";

export default function ServiceCardExample() {
  return (
    <div className="max-w-md">
      <ServiceCard
        id="1"
        vehiclePlate="ABC-1234"
        vehicleName="Ford Transit"
        serviceType="Cambio de Aceite"
        date="15 Nov 2024"
        cost={1250}
        mechanic="Juan Pérez"
        provider="AutoService Pro"
        status="scheduled"
      />
    </div>
  );
}
