# Vehicle Maintenance Management System

## Overview
This system is a comprehensive solution for managing fleet operations, focusing on vehicle tracking, maintenance scheduling, inventory, service provider management, and reporting. It's designed in Spanish to provide a data-rich interface for efficient preventive and corrective maintenance tracking, aiming to improve fleet operational efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project is organized as a monorepo with `/client` (React frontend), `/server` (Express backend), `/shared` (shared types and database schema), and `/migrations` (Drizzle database migrations).

### Technology Stack
- **Frontend**: React 18, TypeScript, Shadcn/ui (Radix UI), Tailwind CSS, Wouter (routing), TanStack Query (server state), React Hook Form with Zod (forms).
- **Backend**: Express.js, TypeScript, Node.js (ESM), Vite (dev), esbuild (build).
- **Database**: PostgreSQL with Neon serverless (neon-http driver), Drizzle ORM.

### UI/UX Decisions
The system follows a Material Design-inspired aesthetic, optimized for productivity. It features Inter and JetBrains Mono fonts and supports both light and dark modes using an HSL-based color system.

### Core Features
- **Vehicle Management**: Comprehensive tracking including economic number and assigned area.
- **Tareas Programadas**: Calendar view of scheduled services with automatic alerts.
- **Client, Provider, and Employee Management**: Full CRUD operations with search and type management functionalities.
- **Service & Inventory Categories**: Hierarchical management with full CRUD operations for efficient organization.
- **Issue Reports (Reportes de Fallas)**: System for tracking vehicle defects with image and audio attachments, status management, and integration with vehicles and users.
- **Diagnostics (Evaluación y Diagnóstico)**: Professional diagnostic evaluation system with a workflow for approval and work order creation, including detailed assessment fields.
- **Work Orders (Órdenes de Trabajo)**: Complete management system for repair and maintenance tasks with:
  - **Comprehensive Add & Edit Forms** with 4 tabs (General, Tareas, Materiales, Evidencias) for creating and editing complete work orders
  - Detailed task assignments (technician, mechanic, service category, workshop area, estimated time, completion date)
  - Materials tracking with inventory integration, automatic cost calculation, and admin approval requirements
  - Evidence documentation supporting up to 10 file attachments with descriptions
  - Approval workflow (awaiting_approval → in_progress) requiring admin authorization
  - Auto-fill functionality from diagnostics (populates vehicle, employee, description, and priority based on severity)
  - Manual creation or automatic generation from approved diagnostics
  - **Edit Form Features**: Loads existing tasks/materials/evidences when dialog opens, allows adding/removing items, uses delete-and-recreate approach on submit for simplicity and reliability
  - **Known Limitation**: Work order creation/editing uses cascading POST requests without backend transaction support. If secondary elements (tasks/materials/evidence) fail, the main work order persists and users must complete it manually. Enhanced error handling alerts users with the work order ID for manual completion.
- **Company (Empresa)**: Collapsible sidebar section for company-wide settings:
  - **Workshops (Talleres)**: Management of internal and external maintenance workshops with full CRUD operations (name, address, phone, email, type, capacity, active status). Each workshop can manage its own inventory.
  - **Areas (Áreas)**: Operational area management with responsible employee assignment (name, description, responsible employee FK, active status)
  - **Configuration (Configuración)**: Single-record company settings form (company name, tax ID, address, contact info, logo, timezone, currency, maintenance alert days, inventory low stock alerts)
- **Inventory by Workshop**: Inventory items are now associated with specific workshops through a workshopId foreign key. Each workshop manages its own stock of parts and supplies independently.
- **Notifications System**: Real-time notification system with dropdown in header, polling every 30 seconds, and automatic creation when reports, diagnostics, and work orders are created.
- **Dashboard**: Real-time metrics and navigation cards for quick overview.
- **Authentication**: Includes a `users` table for authentication and supports role-based access control. **Known Security Limitation**: userId is hardcoded in approval mutations (both diagnostics and work orders), allowing any user to approve without proper authentication. This is a system-wide limitation requiring full authentication implementation with session management and role validation.

### System Design Choices
- **Frontend**: Component-based architecture with custom hooks and query client for server state.
- **Backend**: RESTful API with an abstraction layer for storage and direct database access, utilizing Zod for input validation.
- **Data Model**: Relational model with PostgreSQL, using serial primary keys, timestamps, and foreign key relationships across entities like Users, Vehicles, Services, Inventory, and Reports.
- **State Management**: TanStack Query for server state; React hooks, localStorage, and React Hook Form for local and UI state.
- **Form Validation**: Zod schemas are used for validation, shared between client and server for type safety.

## External Dependencies

### UI/Styling
- **Radix UI**: Headless UI components.
- **Shadcn/ui**: Pre-built UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- `class-variance-authority`, `clsx`, `tailwind-merge`: CSS utilities.

### Data & Backend
- **Neon Database Serverless**: PostgreSQL database service.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **connect-pg-simple**: PostgreSQL session store (for future use).

### Development & Utilities
- **Vite**: Build tool and dev server.
- **esbuild**: Fast JavaScript bundler.
- **tsx**: TypeScript execution.
- **date-fns**: Date utility library.

### Forms & Validation
- **React Hook Form**: Form management.
- **Zod**: Schema validation.
- `@hookform/resolvers`: Zod resolver for React Hook Form.
- **drizzle-zod**: Zod schema generation from Drizzle.

### Routing
- **Wouter**: Lightweight routing for React.

### Fonts
- **Google Fonts**: Inter, JetBrains Mono.