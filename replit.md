# Vehicle Maintenance Management System

## Overview

This is a comprehensive vehicle maintenance management system built for fleet operations. The application enables organizations to track vehicles, schedule and manage maintenance services, monitor inventory parts, manage service providers and clients, and generate operational reports. It's designed as a productivity-focused operational tool prioritizing data density and rapid task completion.

The system is built in Spanish (Sistema de Gestión de Mantenimiento Vehicular) and targets fleet management operations requiring detailed tracking of preventive and corrective maintenance activities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation

**Backend Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Development Server**: Vite dev server with HMR in development
- **Build Tool**: Vite for frontend, esbuild for backend

**Database**: SQLite with better-sqlite3
- **ORM**: Drizzle ORM
- **Schema Location**: `shared/schema.ts` for type sharing between client and server

**Design System**: Material Design-inspired with productivity tool influences
- **Typography**: Inter (primary), JetBrains Mono (monospace for technical data)
- **Theme**: Light/dark mode support via custom theme provider
- **Color System**: HSL-based with CSS custom properties for theming

### Application Architecture

**Monorepo Structure**:
- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared types and database schema
- `/migrations` - Drizzle database migrations

**Frontend Architecture**:
- Component-based architecture with reusable UI primitives
- Page-level components for each module (vehicles, services, scheduled, categories, providers, clients, inventory, reports, users)
- Custom hooks for common functionality (toast notifications, mobile detection, theme management)
- Query client for server state management with optimistic updates

**Backend Architecture**:
- RESTful API design with `/api` prefix
- Storage abstraction layer (`server/storage.ts`) implementing IStorage interface
- Direct database access through Drizzle ORM
- Request/response logging middleware
- Input validation using Zod schemas

**Routing Strategy**:
- Client-side routing via Wouter
- Nine main modules accessible via sidebar navigation
- API routes follow `/api/{resource}` pattern

### Data Model

The database schema includes the following core entities:

1. **Users** - System users with role-based access (id, username, password, email, fullName, role)
2. **Clients** - Vehicle owners/companies (id, name, company, phone, email, address, status)
3. **VehicleTypes** - Body type classifications (id, name, description) - 10 pre-seeded types: Sedán, SUV, Pickup, Van, Hatchback, Coupé, Convertible, Camioneta, Minivan, Crossover
4. **Vehicles** - Fleet vehicles (id, clientId, vehicleTypeId, brand, model, year, plate, vin, color, mileage, status)
5. **Services** - Maintenance service records (linked to vehicles, providers, categories)
6. **ScheduledMaintenance** - Planned maintenance items (linked to vehicles)
7. **ServiceCategories** - Service type classifications (preventive, corrective, oil change, etc.)
8. **Providers** - External service providers/mechanics
9. **Inventory** - Parts and supplies tracking (partNumber, name, category, stock levels, pricing)
10. **InventoryMovements** - Stock movement history

All tables use auto-incrementing integer primary keys and include timestamp fields for audit trails. Foreign key relationships link vehicles to clients, services to vehicles/providers/categories, and scheduled maintenance to vehicles.

### State Management Approach

**Server State**: TanStack Query handles all server data fetching, caching, and synchronization
- Default query behavior: no automatic refetch, infinite stale time (manual invalidation)
- Custom query functions with 401 handling strategies
- Optimistic updates for improved UX

**Local State**: React hooks (useState, useContext) for UI state
- Theme preference stored in localStorage
- Form state managed by React Hook Form
- Toast notifications via custom hook

### Form Validation

Zod schemas define validation rules for all data entities, shared between client and server. Insert schemas are derived from Drizzle table definitions using `createInsertSchema`, ensuring type safety across the stack.

### Authentication Strategy

User authentication structure is present in the schema (users table with password field), though the current implementation appears to use session-based authentication setup (referenced in storage interface). The system includes role-based access control with user roles.

## External Dependencies

### Core UI Framework
- **Radix UI**: Headless UI component primitives (@radix-ui/react-* packages)
- **Shadcn/ui**: Pre-built accessible components built on Radix
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional className utilities

### Data Visualization
- **Recharts**: Charting library for reports (bar charts, pie charts, line charts)

### Backend Infrastructure
- **better-sqlite3**: Synchronous SQLite database driver
- **Drizzle ORM**: TypeScript ORM for SQLite
- **Neon Database Serverless**: PostgreSQL connector (configured but SQLite is currently used)
- **connect-pg-simple**: Session store for PostgreSQL (infrastructure for future use)

### Development Tools
- **Vite**: Build tool and dev server
- **esbuild**: Fast JavaScript bundler
- **tsx**: TypeScript execution for development
- **@replit plugins**: Replit-specific development tooling

### Fonts
- **Google Fonts**: Inter (UI), JetBrains Mono (monospace)
- Additional fonts referenced: Architects Daughter, DM Sans, Fira Code, Geist Mono

### Form & Validation
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Validation resolver for Zod schemas
- **Zod**: Schema validation library
- **drizzle-zod**: Zod schema generation from Drizzle tables

### Date Handling
- **date-fns**: Date utility library

### Routing
- **Wouter**: Lightweight routing for React

## Recent Changes

### Vehicle Types Feature (October 24, 2025)
- Added `vehicle_types` table with 10 pre-seeded body type classifications
- Updated vehicles schema to include `vehicleTypeId` foreign key relationship
- Implemented API routes: `/api/vehicle-types` (GET list) and `/api/vehicle-types/:id` (GET by id)
- Enhanced vehicle creation form with body type selector using React Hook Form
- Vehicle types loaded dynamically from API and displayed in dropdown
- E2E test verification: Successfully created vehicle with vehicleTypeId=1
- Storage interface updated with `getVehicleTypes()` and `getVehicleType(id)` methods
- Architect review: Approved implementation with suggestions for loading states and default selection
- Seed data: 10 vehicle types based on common body styles (Sedán, SUV, Pickup, Van, Hatchback, Coupé, Convertible, Camioneta, Minivan, Crossover)

### Dashboard Implementation (October 24, 2025)
- Created comprehensive dashboard as the main landing page (route "/")
- Dashboard displays real-time statistics from all system APIs:
  - Vehicle metrics: total count, active vehicles, in-service vehicles
  - Client metrics: total count, active clients
  - Service metrics: total count, completed and pending services
  - Scheduled maintenance: total count, pending items
  - Inventory metrics: total items, low stock alerts, estimated total value
- Recent services section showing the 5 most recent service records
- Interactive cards with navigation to module pages
- Proper cache handling: uses array spread operator to avoid mutating TanStack Query cache
- Moved Vehicles page from "/" to "/vehiculos"
- Added Dashboard link to sidebar navigation
- Tests: E2E verification passed, architect approved implementation

### Database Migration to SQLite (October 2025)
- Migrated from PostgreSQL to SQLite for simplified deployment and portability
- Implemented complete database schema with 9 tables using Drizzle ORM
- All foreign key relationships and constraints configured correctly
- Database file: `database.db` in project root

### API Validation Hardening (October 2025)
- Enhanced ID validation using strict regex `/^\d+$/` to reject malformed inputs like "123abc"
- Differentiated error handling: Zod validation errors return 400 with details, server errors return 500 with logging
- All route parameters and query parameters validated before database operations
- Partial schema validation for PUT endpoints using `schema.partial()`

## API Endpoints

All endpoints follow RESTful conventions with proper HTTP status codes:

**Vehicle Types**: `/api/vehicle-types`, `/api/vehicle-types/:id`
**Vehicles**: `/api/vehicles`, `/api/vehicles/:id`
**Services**: `/api/services`, `/api/services/:id` (supports `?vehicleId=` filter)
**Scheduled Maintenance**: `/api/scheduled-maintenance`, `/api/scheduled-maintenance/:id` (supports `?vehicleId=` filter)
**Service Categories**: `/api/service-categories`, `/api/service-categories/:id`
**Providers**: `/api/providers`, `/api/providers/:id`
**Clients**: `/api/clients`, `/api/clients/:id`
**Inventory**: `/api/inventory`, `/api/inventory/:id`
**Inventory Movements**: `/api/inventory-movements` (supports `?inventoryId=` filter)

All endpoints support:
- GET (list and individual)
- POST (create)
- PUT (update with partial data)
- DELETE (remove)

Error responses:
- 400: Invalid request data (Zod validation errors include details)
- 404: Resource not found
- 500: Server error (logged to console)