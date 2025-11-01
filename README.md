# Taller • Sistema de Gestión de Mantenimiento Vehicular

Aplicación web para administrar un taller mecánico y el mantenimiento de vehículos de flotilla. Incluye gestión de vehículos, inventario, órdenes de trabajo, categorías de servicio, proveedores y configuración de la empresa.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Express + TypeScript (Vite en desarrollo, esbuild en producción)
- Base de datos: PostgreSQL (Drizzle ORM `pg-core` + Neon HTTP driver)
- Sesiones: `connect-pg-simple` almacenadas en PostgreSQL

## Requisitos
- Node.js 18+ (recomendado 20+)
- PostgreSQL (local, contenedor o servicio gestionado como Neon)

## Variables de entorno (.env)
Crea un archivo `.env` en la raíz del proyecto con al menos:

```
# Red de servidor
PORT=5000
BIND_HOST=127.0.0.1

# Sesiones
SESSION_SECRET=por_favor_cambialo
SESSION_SECURE_COOKIE=false

# Base de datos Postgres (usa tu conexión real)
DATABASE_URL=postgres://usuario:password@localhost:5432/taller
```

Notas:
- `SESSION_SECURE_COOKIE=false` permite probar en `http` local; en producción usa `true`.
- `connect-pg-simple` creará la tabla `sessions` automáticamente si no existe.

## Instalación
```
npm install
```

## Desarrollo
Arranca el servidor y la UI integrados (Vite se adjunta automáticamente en desarrollo):
```
npm run dev
```
Abre `http://127.0.0.1:5000` (o el host/puerto configurado) y realiza login.

### Usuario administrador por defecto
Tras semillas base, existe el usuario:
- Usuario: `admin`
- Contraseña: `admin123`
- (Cámbiala después del primer inicio de sesión)

## Esquema y datos de ejemplo
Aplica el esquema a tu base de datos y siembra datos iniciales:
```
# Empujar esquema (Drizzle)
npm run db:push

# Semillas base (roles, permisos, tipos, categorías e usuario admin)
npm run seed:base

# Vehículos de ejemplo (opcional)
npm run seed:vehicles5
```

Scripts útiles adicionales (ejecútalos con `tsx`):
```
# Asignar taller a items de inventario sin workshopId
npx tsx server/scripts/assign-workshop-to-inventory.ts

# Verificar inventario (incluye workshopId)
npx tsx server/scripts/verify-inventory.ts

# Exportar categorías de servicio a CSV/JSON
npm run export:categories
```

## Construcción y producción
Genera artefactos y arranca el servidor en modo producción:
```
npm run build

# Requiere .env completo; usa cookies seguras si hay HTTPS
npm run start         # producción (secure cookie por defecto)
npm run start:local   # producción con SESSION_SECURE_COOKIE=false
```

## Estructura del proyecto
- `client/` UI React (Vite) y assets públicos (`client/public/favicon.png`, `client/public/logo.png`).
- `server/` Express + rutas API (`server/index.ts`, `server/routes.ts`).
- `server/scripts/` tareas de mantenimiento, semillas y utilidades (TS ejecutables con `tsx`).
- `shared/` esquema Drizzle (Postgres `pg-core`) compartido entre servidor y scripts.
- `exports/` datos exportados (CSV/JSON).

## Endpoints de autenticación
- `POST /api/login` inicia sesión.
- `POST /api/logout` cierra sesión.
- `GET  /api/auth/user` devuelve el usuario autenticado.
Todas las demás rutas `/api/*` requieren autenticación.

## Notas de desarrollo
- La UI en landing muestra el logotipo (`client/public/logo.png`) y el favicon (`client/public/favicon.png`).
- El flujo de logout redirige a la página de inicio (Landing) y limpia el estado del cliente.

## Licencia
MIT