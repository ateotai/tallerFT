import { db } from "../db";
import { permissions, roles, rolePermissions } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function seedPermissions() {
  console.log("Seeding permissions...");

  // Define all modules and their permissions
  const permissionsList = [
    // Dashboard
    { name: "Ver dashboard", module: "Dashboard", description: "Ver el panel principal con métricas y estadísticas" },

    // Vehículos
    { name: "Ver vehículos", module: "Vehículos", description: "Visualizar lista de vehículos" },
    { name: "Crear vehículos", module: "Vehículos", description: "Registrar nuevos vehículos" },
    { name: "Editar vehículos", module: "Vehículos", description: "Modificar información de vehículos" },
    { name: "Eliminar vehículos", module: "Vehículos", description: "Eliminar vehículos del sistema" },

    // Tareas Programadas
    { name: "Ver tareas programadas", module: "Tareas Programadas", description: "Visualizar mantenimientos programados" },
    { name: "Crear tareas programadas", module: "Tareas Programadas", description: "Programar nuevos mantenimientos" },
    { name: "Editar tareas programadas", module: "Tareas Programadas", description: "Modificar mantenimientos programados" },
    { name: "Eliminar tareas programadas", module: "Tareas Programadas", description: "Eliminar mantenimientos programados" },

    // Categorías
    { name: "Ver categorías", module: "Categorías", description: "Visualizar categorías de servicios" },
    { name: "Crear categorías", module: "Categorías", description: "Crear nuevas categorías de servicios" },
    { name: "Editar categorías", module: "Categorías", description: "Modificar categorías de servicios" },
    { name: "Eliminar categorías", module: "Categorías", description: "Eliminar categorías de servicios" },

    // Proveedores
    { name: "Ver proveedores", module: "Proveedores", description: "Visualizar lista de proveedores" },
    { name: "Crear proveedores", module: "Proveedores", description: "Registrar nuevos proveedores" },
    { name: "Editar proveedores", module: "Proveedores", description: "Modificar información de proveedores" },
    { name: "Eliminar proveedores", module: "Proveedores", description: "Eliminar proveedores del sistema" },

    // Cotizaciones de Compra
    { name: "Ver cotizaciones", module: "Cotizaciones de Compra", description: "Visualizar cotizaciones de compra" },
    { name: "Crear cotizaciones", module: "Cotizaciones de Compra", description: "Crear nuevas cotizaciones" },
    { name: "Editar cotizaciones", module: "Cotizaciones de Compra", description: "Modificar cotizaciones" },
    { name: "Eliminar cotizaciones", module: "Cotizaciones de Compra", description: "Eliminar cotizaciones" },

    // Clientes
    { name: "Ver clientes", module: "Clientes", description: "Visualizar lista de clientes" },
    { name: "Crear clientes", module: "Clientes", description: "Registrar nuevos clientes" },
    { name: "Editar clientes", module: "Clientes", description: "Modificar información de clientes" },
    { name: "Eliminar clientes", module: "Clientes", description: "Eliminar clientes del sistema" },

    // Inventario
    { name: "Ver inventario", module: "Inventario", description: "Visualizar inventario de piezas y materiales" },
    { name: "Crear inventario", module: "Inventario", description: "Agregar nuevos items al inventario" },
    { name: "Editar inventario", module: "Inventario", description: "Modificar items del inventario" },
    { name: "Eliminar inventario", module: "Inventario", description: "Eliminar items del inventario" },

    // Reportes
    { name: "Ver reportes", module: "Reportes", description: "Visualizar reportes y estadísticas del sistema" },

    // Reportes de Fallas
    { name: "Ver reportes de fallas", module: "Reportes de Fallas", description: "Visualizar reportes de fallas vehiculares" },
    { name: "Crear reportes de fallas", module: "Reportes de Fallas", description: "Registrar nuevos reportes de fallas" },
    { name: "Editar reportes de fallas", module: "Reportes de Fallas", description: "Modificar reportes de fallas" },
    { name: "Eliminar reportes de fallas", module: "Reportes de Fallas", description: "Eliminar reportes de fallas" },

    // Evaluación y Diagnóstico
    { name: "Ver diagnósticos", module: "Evaluación y Diagnóstico", description: "Visualizar diagnósticos de vehículos" },
    { name: "Crear diagnósticos", module: "Evaluación y Diagnóstico", description: "Crear nuevos diagnósticos" },
    { name: "Editar diagnósticos", module: "Evaluación y Diagnóstico", description: "Modificar diagnósticos" },
    { name: "Eliminar diagnósticos", module: "Evaluación y Diagnóstico", description: "Eliminar diagnósticos" },
    { name: "Aprobar diagnósticos", module: "Evaluación y Diagnóstico", description: "Aprobar y crear órdenes desde diagnósticos" },

    // Órdenes de Trabajo
    { name: "Ver órdenes de trabajo", module: "Órdenes de Trabajo", description: "Visualizar órdenes de trabajo" },
    { name: "Crear órdenes de trabajo", module: "Órdenes de Trabajo", description: "Crear nuevas órdenes de trabajo" },
    { name: "Editar órdenes de trabajo", module: "Órdenes de Trabajo", description: "Modificar órdenes de trabajo" },
    { name: "Eliminar órdenes de trabajo", module: "Órdenes de Trabajo", description: "Eliminar órdenes de trabajo" },
    { name: "Aprobar órdenes de trabajo", module: "Órdenes de Trabajo", description: "Aprobar órdenes de trabajo para iniciar" },

    // Prueba y Validación
    { name: "Ver pruebas y validación", module: "Prueba y Validación", description: "Visualizar sección de pruebas y validación" },
    { name: "Activar vehículos", module: "Prueba y Validación", description: "Dar de alta vehículos después de validación" },

    // Talleres
    { name: "Ver talleres", module: "Talleres", description: "Visualizar talleres de mantenimiento" },
    { name: "Crear talleres", module: "Talleres", description: "Registrar nuevos talleres" },
    { name: "Editar talleres", module: "Talleres", description: "Modificar información de talleres" },
    { name: "Eliminar talleres", module: "Talleres", description: "Eliminar talleres" },

    // Áreas
    { name: "Ver áreas", module: "Áreas", description: "Visualizar áreas operativas" },
    { name: "Crear áreas", module: "Áreas", description: "Crear nuevas áreas operativas" },
    { name: "Editar áreas", module: "Áreas", description: "Modificar áreas operativas" },
    { name: "Eliminar áreas", module: "Áreas", description: "Eliminar áreas operativas" },

    // Configuración
    { name: "Ver configuración", module: "Configuración", description: "Visualizar configuración de la empresa" },
    { name: "Editar configuración", module: "Configuración", description: "Modificar configuración de la empresa" },

    // Empleados
    { name: "Ver empleados", module: "Empleados", description: "Visualizar lista de empleados" },
    { name: "Crear empleados", module: "Empleados", description: "Registrar nuevos empleados" },
    { name: "Editar empleados", module: "Empleados", description: "Modificar información de empleados" },
    { name: "Eliminar empleados", module: "Empleados", description: "Eliminar empleados" },

    // Usuarios
    { name: "Ver usuarios", module: "Usuarios", description: "Visualizar usuarios del sistema" },
    { name: "Crear usuarios", module: "Usuarios", description: "Crear nuevos usuarios" },
    { name: "Editar usuarios", module: "Usuarios", description: "Modificar usuarios" },
    { name: "Eliminar usuarios", module: "Usuarios", description: "Eliminar usuarios" },

    // Roles
    { name: "Ver roles", module: "Roles", description: "Visualizar roles del sistema" },
    { name: "Crear roles", module: "Roles", description: "Crear nuevos roles" },
    { name: "Editar roles", module: "Roles", description: "Modificar roles" },
    { name: "Eliminar roles", module: "Roles", description: "Eliminar roles" },

    // Permisos
    { name: "Ver permisos", module: "Permisos", description: "Visualizar matriz de permisos" },
    { name: "Asignar permisos", module: "Permisos", description: "Asignar y remover permisos de roles" },
  ];

  // Insert permissions (avoiding duplicates)
  for (const perm of permissionsList) {
    await db
      .insert(permissions)
      .values({
        name: perm.name,
        module: perm.module,
        description: perm.description,
      })
      // Evitar duplicados basados en nombre+módulo
      .onConflictDoNothing({ target: [permissions.name, permissions.module] });
  }

  console.log(`✓ ${permissionsList.length} permissions seeded successfully!`);

  // Get Admin role
  const adminRole = await db
    .select()
    .from(roles)
    .where(sql`${roles.name} = 'Administrador'`)
    .limit(1);

  if (adminRole.length > 0) {
    console.log("Assigning all permissions to Administrador role...");

    // Get all permissions
    const allPermissions = await db.select().from(permissions);

    // Assign all permissions to Admin role
    for (const permission of allPermissions) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: adminRole[0].id,
          permissionId: permission.id,
        })
        .onConflictDoNothing();
    }

    console.log(`✓ All ${allPermissions.length} permissions assigned to Administrador!`);
  }

  console.log("Permissions seeding completed!");
}

seedPermissions()
  .then(() => {
    console.log("✓ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding permissions:", error);
    process.exit(1);
  });
