import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../database.db");
const db = new Database(dbPath);

console.log("Seeding service categories and subcategories...");

const categories = [
  { name: 'Mantenimiento Preventivo', description: 'Servicios de revisión y prevención de fallas' },
  { name: 'Mantenimiento Correctivo', description: 'Reparaciones y sustituciones por fallas detectadas' },
  { name: 'Sistema Eléctrico y Electrónico', description: 'Diagnóstico y reparación de sistemas eléctricos' },
  { name: 'Sistema de Frenos', description: 'Mantenimiento y reparación de frenos' },
  { name: 'Motor y Transmisión', description: 'Servicios relacionados con el motor y caja de velocidades' },
  { name: 'Sistema de Enfriamiento y Calefacción', description: 'Revisión de radiador, bomba y termostato' },
  { name: 'Llantas, Rines y Suspensión', description: 'Servicios de alineación, balanceo y amortiguación' },
  { name: 'Estética y Detallado Automotriz', description: 'Limpieza, pulido y restauración visual' },
  { name: 'Hojalatería y Pintura', description: 'Reparaciones estéticas de carrocería y pintura' },
  { name: 'Diagnóstico y Escaneo Computarizado', description: 'Lectura de códigos OBD2 y diagnóstico técnico' },
  { name: 'Sistema de Combustible y Escape', description: 'Mantenimiento del sistema de combustible y escape' },
  { name: 'Seguridad y Accesorios', description: 'Instalación y revisión de sistemas de seguridad' },
  { name: 'Carrocería y Chasis', description: 'Enderezado y revisión estructural' },
  { name: 'Sistema de Dirección', description: 'Mantenimiento de dirección hidráulica o eléctrica' },
  { name: 'Sistema de Escape y Emisiones', description: 'Revisión y prueba de emisiones contaminantes' },
  { name: 'Inspección y Verificación Vehicular', description: 'Revisión técnica y preparación para verificación' },
  { name: 'Servicios Especiales', description: 'Servicios adicionales y personalizados' },
  { name: 'Instalación de Accesorios', description: 'Colocación de equipos y componentes adicionales' }
];

const subcategories = [
  // 1. Mantenimiento Preventivo
  { categoryId: 1, name: 'Cambio de aceite y filtro' },
  { categoryId: 1, name: 'Revisión general de niveles' },
  { categoryId: 1, name: 'Reemplazo de filtros' },
  { categoryId: 1, name: 'Mantenimiento programado por kilometraje' },
  { categoryId: 1, name: 'Revisión de correas y mangueras' },
  { categoryId: 1, name: 'Revisión de frenos y suspensión' },
  { categoryId: 1, name: 'Rotación de llantas y balanceo' },
  
  // 2. Mantenimiento Correctivo
  { categoryId: 2, name: 'Reparación de motor' },
  { categoryId: 2, name: 'Reparación de transmisión' },
  { categoryId: 2, name: 'Sustitución de clutch' },
  { categoryId: 2, name: 'Reparación de frenos' },
  { categoryId: 2, name: 'Reparación de suspensión' },
  { categoryId: 2, name: 'Sustitución de componentes eléctricos' },
  
  // 3. Sistema Eléctrico y Electrónico
  { categoryId: 3, name: 'Diagnóstico computarizado' },
  { categoryId: 3, name: 'Reparación de alternador' },
  { categoryId: 3, name: 'Revisión de batería y sistema de carga' },
  { categoryId: 3, name: 'Luces interiores y exteriores' },
  { categoryId: 3, name: 'Reparación de sensores y actuadores' },
  { categoryId: 3, name: 'Cableado eléctrico general' },
  
  // 4. Sistema de Frenos
  { categoryId: 4, name: 'Reemplazo de pastillas y zapatas' },
  { categoryId: 4, name: 'Rectificación de discos y tambores' },
  { categoryId: 4, name: 'Purgado de frenos' },
  { categoryId: 4, name: 'Revisión de ABS' },
  { categoryId: 4, name: 'Cambio de líquido de frenos' },
  
  // 5. Motor y Transmisión
  { categoryId: 5, name: 'Ajuste de motor' },
  { categoryId: 5, name: 'Cambio de empaques o sellos' },
  { categoryId: 5, name: 'Sustitución de junta de cabeza' },
  { categoryId: 5, name: 'Servicio de inyectores' },
  { categoryId: 5, name: 'Cambio de aceite de transmisión' },
  { categoryId: 5, name: 'Revisión de caja de velocidades' },
  
  // 6. Sistema de Enfriamiento y Calefacción
  { categoryId: 6, name: 'Limpieza de radiador' },
  { categoryId: 6, name: 'Sustitución de bomba de agua' },
  { categoryId: 6, name: 'Cambio de termostato' },
  { categoryId: 6, name: 'Revisión de ventiladores' },
  { categoryId: 6, name: 'Carga y revisión de A/C' },
  
  // 7. Llantas, Rines y Suspensión
  { categoryId: 7, name: 'Alineación y balanceo' },
  { categoryId: 7, name: 'Montaje y desmontaje de llantas' },
  { categoryId: 7, name: 'Reparación de ponchaduras' },
  { categoryId: 7, name: 'Revisión de amortiguadores' },
  { categoryId: 7, name: 'Sustitución de rótulas y bujes' },
  
  // 8. Estética y Detallado Automotriz
  { categoryId: 8, name: 'Lavado exterior e interior' },
  { categoryId: 8, name: 'Pulido y encerado' },
  { categoryId: 8, name: 'Detallado de motor' },
  { categoryId: 8, name: 'Lavado de tapicería' },
  { categoryId: 8, name: 'Sanitización del vehículo' },
  { categoryId: 8, name: 'Restauración de faros' },
  
  // 9. Hojalatería y Pintura
  { categoryId: 9, name: 'Reparación de golpes y abolladuras' },
  { categoryId: 9, name: 'Pintura general o parcial' },
  { categoryId: 9, name: 'Pulido y acabado' },
  { categoryId: 9, name: 'Enmascarado y preparación de superficie' },
  { categoryId: 9, name: 'Reparación de paragolpes' },
  
  // 10. Diagnóstico y Escaneo Computarizado
  { categoryId: 10, name: 'Lectura de códigos OBD2' },
  { categoryId: 10, name: 'Diagnóstico de sensores' },
  { categoryId: 10, name: 'Revisión del sistema de inyección' },
  { categoryId: 10, name: 'Actualización de software del vehículo' },
  
  // 11. Sistema de Combustible y Escape
  { categoryId: 11, name: 'Limpieza de inyectores' },
  { categoryId: 11, name: 'Sustitución de bomba de combustible' },
  { categoryId: 11, name: 'Limpieza de tanque' },
  { categoryId: 11, name: 'Revisión de catalizador' },
  { categoryId: 11, name: 'Reparación de fugas de escape' },
  
  // 12. Seguridad y Accesorios
  { categoryId: 12, name: 'Instalación de alarmas y GPS' },
  { categoryId: 12, name: 'Revisión de cinturones de seguridad' },
  { categoryId: 12, name: 'Reparación de bolsas de aire' },
  { categoryId: 12, name: 'Instalación de cámaras y sensores' },
  
  // 13. Carrocería y Chasis
  { categoryId: 13, name: 'Revisión estructural' },
  { categoryId: 13, name: 'Enderezado de chasis' },
  { categoryId: 13, name: 'Sustitución de partes metálicas' },
  { categoryId: 13, name: 'Reparación por colisión' },
  
  // 14. Sistema de Dirección
  { categoryId: 14, name: 'Revisión de dirección hidráulica o eléctrica' },
  { categoryId: 14, name: 'Sustitución de bomba de dirección' },
  { categoryId: 14, name: 'Alineación del sistema de dirección' },
  { categoryId: 14, name: 'Reparación de cremallera o caja de dirección' },
  
  // 15. Sistema de Escape y Emisiones
  { categoryId: 15, name: 'Revisión de catalizador' },
  { categoryId: 15, name: 'Medición de gases contaminantes' },
  { categoryId: 15, name: 'Sustitución de silenciadores' },
  { categoryId: 15, name: 'Prueba de emisiones' },
  
  // 16. Inspección y Verificación Vehicular
  { categoryId: 16, name: 'Verificación de gases' },
  { categoryId: 16, name: 'Inspección mecánica general' },
  { categoryId: 16, name: 'Diagnóstico previo a verificación' },
  { categoryId: 16, name: 'Certificación de mantenimiento' },
  
  // 17. Servicios Especiales
  { categoryId: 17, name: 'Remolque y asistencia vial' },
  { categoryId: 17, name: 'Lavado de motor' },
  { categoryId: 17, name: 'Servicio a domicilio' },
  { categoryId: 17, name: 'Personalización de interiores' },
  { categoryId: 17, name: 'Preparación para venta del vehículo' },
  
  // 18. Instalación de Accesorios
  { categoryId: 18, name: 'Estéreos y multimedia' },
  { categoryId: 18, name: 'Películas polarizadas' },
  { categoryId: 18, name: 'Sensores de reversa y cámaras' },
  { categoryId: 18, name: 'Luces LED o neón' },
  { categoryId: 18, name: 'Portaequipajes y defensas' }
];

try {
  // Check if categories already exist
  const existingCount = db.prepare(`SELECT COUNT(*) as count FROM service_categories`).get() as { count: number };
  
  if (existingCount.count > 0) {
    console.log(`✓ Found ${existingCount.count} existing categories, skipping seed`);
  } else {
    console.log("Inserting categories...");
    const insertCategory = db.prepare(`
      INSERT INTO service_categories (name, description, active)
      VALUES (?, ?, 1)
    `);
    
    for (const category of categories) {
      insertCategory.run(category.name, category.description);
    }
    console.log(`✓ Inserted ${categories.length} categories`);
    
    console.log("Inserting subcategories...");
    const insertSubcategory = db.prepare(`
      INSERT INTO service_subcategories (category_id, name, active)
      VALUES (?, ?, 1)
    `);
    
    for (const subcategory of subcategories) {
      insertSubcategory.run(subcategory.categoryId, subcategory.name);
    }
    console.log(`✓ Inserted ${subcategories.length} subcategories`);
  }
  
  console.log("\n✅ Seed completed successfully!");
  
} catch (error) {
  console.error("❌ Seed failed:", error);
  process.exit(1);
} finally {
  db.close();
}
