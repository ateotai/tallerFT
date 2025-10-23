import { ProviderCard } from "../provider-card";

export default function ProviderCardExample() {
  return (
    <div className="max-w-sm">
      <ProviderCard
        id="1"
        name="AutoService Pro"
        services={["Mecánica General", "Eléctrico", "Transmisión"]}
        phone="+52 55 1234 5678"
        email="contacto@autoservicepro.com"
        address="Av. Principal 123, Ciudad de México"
        rating={4.8}
        totalJobs={156}
      />
    </div>
  );
}
