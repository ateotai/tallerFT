import { db } from "../db";
import { serviceCategories, serviceSubcategories } from "../../shared/schema";

async function seedCategories() {
  console.log("Seeding service categories and subcategories...");

  // Define categories and their subcategories
  const categoriesData = [
    {
      name: "Mantenimiento Preventivo",
      description: "Servicios de mantenimiento programado y preventivo",
      subcategories: [
        { name: "Cambio de Aceite", description: "Cambio de aceite de motor y filtro" },
        { name: "Revisión de Frenos", description: "Inspección y mantenimiento del sistema de frenos" },
        { name: "Alineación y Balanceo", description: "Alineación de ruedas y balanceo de neumáticos" },
        { name: "Revisión General", description: "Inspección completa del vehículo" },
        { name: "Cambio de Filtros", description: "Cambio de filtros de aire, combustible y cabina" },
      ],
    },
    {
      name: "Reparación de Motor",
      description: "Reparaciones y mantenimiento del motor",
      subcategories: [
        { name: "Reparación de Sistema de Enfriamiento", description: "Reparación del radiador y sistema de enfriamiento" },
        { name: "Reparación de Sistema de Combustible", description: "Reparación de bomba e inyectores" },
        { name: "Reparación de Sistema de Admisión", description: "Reparación de múltiple de admisión" },
        { name: "Overhaul de Motor", description: "Reconstrucción completa del motor" },
        { name: "Cambio de Correa de Distribución", description: "Sustitución de correa de distribución" },
      ],
    },
    {
      name: "Sistema Eléctrico",
      description: "Reparaciones del sistema eléctrico y electrónico",
      subcategories: [
        { name: "Reparación de Alternador", description: "Reparación o reemplazo del alternador" },
        { name: "Cambio de Batería", description: "Sustitución de batería" },
        { name: "Reparación de Sistema de Arranque", description: "Reparación del motor de arranque" },
        { name: "Diagnóstico Electrónico", description: "Escaneo y diagnóstico de fallas electrónicas" },
        { name: "Reparación de Luces", description: "Reparación del sistema de iluminación" },
      ],
    },
    {
      name: "Transmisión",
      description: "Servicios de transmisión y embrague",
      subcategories: [
        { name: "Cambio de Aceite de Transmisión", description: "Cambio de aceite y filtro de transmisión" },
        { name: "Reparación de Embrague", description: "Reparación o reemplazo del embrague" },
        { name: "Reparación de Transmisión Manual", description: "Reparación de transmisión manual" },
        { name: "Reparación de Transmisión Automática", description: "Reparación de transmisión automática" },
        { name: "Reparación de Cardán", description: "Reparación del eje cardán" },
      ],
    },
    {
      name: "Suspensión y Dirección",
      description: "Reparaciones de suspensión y sistema de dirección",
      subcategories: [
        { name: "Cambio de Amortiguadores", description: "Sustitución de amortiguadores" },
        { name: "Reparación de Dirección Hidráulica", description: "Reparación del sistema de dirección asistida" },
        { name: "Cambio de Rótulas", description: "Sustitución de rótulas de suspensión" },
        { name: "Cambio de Terminales", description: "Sustitución de terminales de dirección" },
        { name: "Reparación de Cremallera", description: "Reparación de cremallera de dirección" },
      ],
    },
    {
      name: "Frenos",
      description: "Servicios especializados del sistema de frenos",
      subcategories: [
        { name: "Cambio de Pastillas", description: "Sustitución de pastillas de freno" },
        { name: "Cambio de Discos", description: "Sustitución de discos de freno" },
        { name: "Rectificado de Discos", description: "Rectificado de discos de freno" },
        { name: "Cambio de Tambores", description: "Sustitución de tambores de freno" },
        { name: "Purga de Sistema de Frenos", description: "Purga y cambio de líquido de frenos" },
      ],
    },
    {
      name: "Climatización",
      description: "Servicios de aire acondicionado y calefacción",
      subcategories: [
        { name: "Recarga de Aire Acondicionado", description: "Recarga de gas refrigerante" },
        { name: "Reparación de Compresor", description: "Reparación o reemplazo del compresor" },
        { name: "Reparación de Condensador", description: "Reparación del condensador de A/C" },
        { name: "Reparación de Evaporador", description: "Reparación del evaporador" },
        { name: "Reparación de Calefacción", description: "Reparación del sistema de calefacción" },
      ],
    },
    {
      name: "Carrocería y Pintura",
      description: "Servicios de carrocería, pintura y hojalatería",
      subcategories: [
        { name: "Reparación de Abolladuras", description: "Reparación de golpes y abolladuras" },
        { name: "Pintura Completa", description: "Pintura completa del vehículo" },
        { name: "Pintura Parcial", description: "Pintura de áreas específicas" },
        { name: "Reparación de Parabrisas", description: "Reparación o cambio de cristales" },
        { name: "Pulido y Encerado", description: "Pulido y protección de pintura" },
      ],
    },
    {
      name: "Neumáticos",
      description: "Servicios relacionados con neumáticos",
      subcategories: [
        { name: "Cambio de Neumáticos", description: "Sustitución de neumáticos" },
        { name: "Rotación de Neumáticos", description: "Rotación de neumáticos" },
        { name: "Reparación de Pinchazos", description: "Reparación de neumáticos pinchados" },
        { name: "Alineación", description: "Alineación de ruedas" },
        { name: "Balanceo", description: "Balanceo de ruedas" },
      ],
    },
    {
      name: "Diagnóstico",
      description: "Servicios de diagnóstico y evaluación",
      subcategories: [
        { name: "Diagnóstico General", description: "Diagnóstico completo del vehículo" },
        { name: "Escaneo de Computadora", description: "Escaneo del sistema electrónico" },
        { name: "Prueba de Compresión", description: "Prueba de compresión del motor" },
        { name: "Análisis de Gases", description: "Análisis de emisiones" },
        { name: "Inspección Pre-compra", description: "Inspección antes de compra" },
      ],
    },
  ];

  // Insert categories and subcategories
  for (const category of categoriesData) {
    // Insert category
    const [insertedCategory] = await db
      .insert(serviceCategories)
      .values({
        name: category.name,
        description: category.description,
        active: true,
      })
      .returning();

    console.log(`✓ Category created: ${insertedCategory.name}`);

    // Insert subcategories
    for (const subcategory of category.subcategories) {
      await db.insert(serviceSubcategories).values({
        categoryId: insertedCategory.id,
        name: subcategory.name,
        description: subcategory.description,
        active: true,
      });
    }

    console.log(`  ✓ ${category.subcategories.length} subcategories created`);
  }

  console.log("\n✓ Seed completed successfully!");
  console.log(`Total: ${categoriesData.length} categories with subcategories`);
}

seedCategories()
  .then(() => {
    console.log("✓ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding categories:", error);
    process.exit(1);
  });
