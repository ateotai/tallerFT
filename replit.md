# Vehicle Maintenance Management System

## Overview

This is a comprehensive vehicle maintenance management system designed for fleet operations. Its primary purpose is to enable organizations to efficiently track vehicles, schedule and manage maintenance services, monitor parts inventory, manage service providers and clients, and generate operational reports. The system is built in Spanish and focuses on providing a data-dense interface for rapid task completion in fleet management, specifically for detailed tracking of preventive and corrective maintenance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend**: React 18 with TypeScript, Shadcn/ui (Radix UI), Tailwind CSS, Wouter for routing, TanStack Query for server state, React Hook Form with Zod for forms.
**Backend**: Express.js with TypeScript, Node.js (ESM), Vite (dev), esbuild (build).
**Database**: PostgreSQL with Neon serverless (neon-http driver), Drizzle ORM.
**Shared**: `shared/schema.ts` for type sharing.

### Application Architecture

**Monorepo Structure**:
- `/client`: React frontend.
- `/server`: Express backend API.
- `/shared`: Shared types and database schema.
- `/migrations`: Drizzle database migrations.

**Frontend Architecture**: Component-based with reusable UI primitives, custom hooks, and a query client for server state with optimistic updates.
**Backend Architecture**: RESTful API (`/api` prefix), storage abstraction layer, direct database access via Drizzle ORM, Zod for input validation.
**Routing Strategy**: Client-side routing via Wouter with nine main modules. API routes follow `/api/{resource}`.

### Data Model

Core entities include: Users, Clients, VehicleTypes (pre-seeded), Vehicles, Services, ScheduledMaintenance, ServiceCategories (hierarchical with subcategories and pre-seeded), Providers, InventoryCategories (pre-seeded), Inventory (with categoryId FK and maxQuantity field), InventoryMovements, and Reports (for issue/defect tracking). All tables use serial primary keys (PostgreSQL auto-increment), timestamps, and foreign key relationships.

### State Management Approach

**Server State**: TanStack Query for fetching, caching, and synchronization (manual invalidation, optimistic updates).
**Local State**: React hooks (useState, useContext) for UI state, localStorage for theme, React Hook Form for form state, custom hook for toast notifications.

### Form Validation

Zod schemas are used for defining validation rules, shared between client and server, derived from Drizzle table definitions for type safety.

### Authentication Strategy

The system includes a `users` table for authentication and supports role-based access control.

### Design System

Material Design-inspired with a focus on productivity tools, using Inter (primary) and JetBrains Mono (monospace) fonts. Supports light/dark mode with an HSL-based color system.

### Features

- **Vehicle Management**: Includes `economic_number` and `assigned_area` fields.
- **Client Search**: `ClientSearchCombobox` for real-time client search.
- **Vehicle Types Management**: Full CRUD operations for vehicle types via a dedicated administrative subsection with responsive dialogs.
- **Dashboard**: Main landing page displaying real-time metrics across all system APIs, including recent services and interactive navigation cards.
- **Service Categories and Subcategories Module**: Hierarchical management system for service categories and subcategories with full CRUD functionality and a tabbed UI.
- **Providers Module**: Complete CRUD functionality for managing service providers and workshops. Features include:
  - ProvidersTable with columns for name, type, phone, email, rating, status, and actions
  - AddProviderDialog and EditProviderDialog for creating and updating providers
  - Delete confirmation with AlertDialog
  - State cleanup with useEffect to prevent stale data in edit dialog
  - All components include proper data-testid attributes for testing
  - Forms use React Hook Form with Zod validation
  - Provider fields: name, type, phone, email, address, rating (nullable), status
- **Inventory Categories Module**: Hierarchical management system for inventory categories with full CRUD functionality. Features include:
  - InventoryCategoriesTable displaying category name, description, creation date, and actions
  - AddInventoryCategoryDialog and EditInventoryCategoryDialog for creating and updating categories
  - Delete confirmation with AlertDialog
  - Tabbed UI in Inventory page (Inventario | Categorías) following the same pattern as Providers
  - Pre-seeded with 5 categories: Filtros, Frenos, Motor, Lubricantes, Neumáticos
  - All components include proper data-testid attributes for testing
  - Forms use React Hook Form with Zod validation
- **Inventory Module Enhancements**: 
  - Inventory items now have a nullable categoryId field (FK to inventoryCategories) 
  - Added maxQuantity field to track maximum stock levels
  - Inventory table displays resolved category names (not IDs) and shows min/max limits
  - Add/Edit dialogs use Select component for category selection
  - Category field is optional (nullable)
  - Provider field (providerId) is fully integrated with providers table via Select component
  - Provider field is optional (nullable) with "Sin proveedor" option
  - Pre-seeded with 5 sample providers for testing
- **Issue Reports Module (Reportes de Fallas)**: Complete CRUD system for tracking vehicle defects and service requests. Features include:
  - Reports table with fields: vehicleId, userId, images (jsonb array), audioUrl, description, notes, status, createdAt
  - Images stored as JSONB array containing {url: string, description: string} objects (up to 3 images)
  - Three status states: pending, in_progress, resolved
  - VehicleSearchCombobox for searching vehicles by economic number, plate, or model
  - IssueReportsPage displays real-time statistics (total, pending, in-progress, resolved reports)
  - AddIssueReportDialog: No status field (defaults to "pending"), supports up to 3 images with individual descriptions, mobile camera capture, and microphone audio
  - EditIssueReportDialog: Includes status selector for updating report status, multi-image support with descriptions
  - IssueReportsTable displays image count and status badges
  - File uploads stored as base64 data URLs (temporary implementation before object storage integration)
  - Backend PUT endpoint validates and accepts status field updates
  - Full integration with vehicles and users tables via foreign keys
  - All components include data-testid attributes for E2E testing
  - Accessible at /reportes-fallas route
  - Date/time automatically tracked via createdAt field (hidden from user interface)

### API Validation

Enhanced ID validation using regex. Zod validation errors return 400, server errors return 500. Partial schema validation for PUT endpoints.

## External Dependencies

### Core UI Framework
- Radix UI: Headless UI component primitives.
- Shadcn/ui: Pre-built components on Radix.
- Tailwind CSS: Utility-first CSS framework.
- class-variance-authority, clsx, tailwind-merge: CSS utilities.

### Data Visualization
- Recharts: Charting library for reports.

### Backend Infrastructure
- Neon Database Serverless: PostgreSQL connector using neon-http driver (HTTP-based, no WebSocket required).
- Drizzle ORM: TypeScript ORM for PostgreSQL.
- connect-pg-simple: Session store for PostgreSQL (future use).

### Development Tools
- Vite: Build tool and dev server.
- esbuild: Fast JavaScript bundler.
- tsx: TypeScript execution.

### Fonts
- Google Fonts: Inter, JetBrains Mono.

### Form & Validation
- React Hook Form: Form state management.
- @hookform/resolvers: Zod resolver for React Hook Form.
- Zod: Schema validation library.
- drizzle-zod: Zod schema generation from Drizzle tables.

### Date Handling
- date-fns: Date utility library.

### Routing
- Wouter: Lightweight routing for React.