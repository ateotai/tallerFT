# Vehicle Maintenance Management System

## Overview
This system is a comprehensive, Spanish-language solution for managing fleet operations. It focuses on vehicle tracking, maintenance scheduling, inventory, service provider management, and reporting to enhance fleet operational efficiency through robust preventive and corrective maintenance tracking. The project aims to provide a data-rich interface to improve overall fleet management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project is organized as a monorepo with separate directories for the React frontend (`/client`), Express backend (`/server`), shared types and database schema (`/shared`), and Drizzle database migrations (`/migrations`).

### Technology Stack
- **Frontend**: React 18, TypeScript, Shadcn/ui (Radix UI), Tailwind CSS, Wouter, TanStack Query, React Hook Form with Zod.
- **Backend**: Express.js, TypeScript, Node.js (ESM), Vite, esbuild.
- **Database**: PostgreSQL with Neon serverless (neon-http driver), Drizzle ORM.

### UI/UX Decisions
The system features a Material Design-inspired aesthetic for productivity, utilizing Inter and JetBrains Mono fonts. It supports both light and dark modes with an HSL-based color system.

### Core Features
- **Vehicle Management**: Comprehensive tracking with economic number and assigned area.
- **Scheduled Tasks (Tareas Programadas)**: Calendar view for services with alerts.
- **Client, Provider, Employee Management**: Full CRUD operations.
- **Service & Inventory Categories**: Hierarchical management with CRUD.
- **Issue Reports (Reportes de Fallas)**: Track vehicle defects with media attachments, status management, and automatic resolution upon vehicle activation in 'Testing & Validation'. Resolved reports can be reopened.
- **Diagnostics (Evaluación y Diagnóstico)**: Professional diagnostic workflow with approval and work order creation.
- **Work Orders (Órdenes de Trabajo)**: Manage repair tasks with comprehensive forms (General, Tasks, Materials, Evidence), task assignments, material tracking with inventory integration, cost calculation, and admin approval. Supports up to 10 file attachments. Can be manually created or generated from approved diagnostics. Includes print and email functionality.
- **Testing and Validation (Prueba y Validación)**: Dedicated section for final validation and activation of vehicles, displaying completed work orders, and generating activation notifications.
- **Company (Empresa)**: Manages workshops (with inventory association), operational areas, and global company configuration settings.
- **Inventory by Workshop**: Inventory items are associated with specific workshops.
- **Notifications System**: Real-time system with header dropdown, polling, and automatic notifications for reports, diagnostics, and work orders.
- **Dashboard**: Provides real-time metrics and navigation.
- **Authentication & User Interface**: OpenID Connect using Replit Auth with a dual-table strategy for user data (`auth_users` and `users`), PostgreSQL session management, and protected routes. Features a user profile dropdown with role-based access control.
- **Roles & Permissions System**: Comprehensive RBAC with CRUD for roles and a module-based permission matrix (133 permissions across 20 modules) for granular control (view, create, edit, delete, approve, activate, assign).
- **Purchase Quotes (Cotizaciones de Compra)**: Management system for supplier quotes with automatic numbering, multi-item support with dynamic calculations (subtotal, tax, total), inventory product search, provider integration, status tracking, and print functionality.

### System Design Choices
- **Frontend**: Component-based architecture with custom hooks and TanStack Query for server state.
- **Backend**: RESTful API with an abstraction layer for storage and direct database access, utilizing Zod for input validation.
- **Data Model**: Relational PostgreSQL database with serial primary keys, timestamps, and foreign key relationships.
- **State Management**: TanStack Query for server state; React hooks, localStorage, and React Hook Form for local and UI state.
- **Form Validation**: Zod schemas are shared between client and server for type safety.

## External Dependencies

### UI/Styling
- **Radix UI**: Headless UI components.
- **Shadcn/ui**: Pre-built UI components.
- **Tailwind CSS**: Utility-first CSS framework.

### Data & Backend
- **Neon Database Serverless**: PostgreSQL database service.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **connect-pg-simple**: PostgreSQL session store.

### Development & Utilities
- **Vite**: Build tool and dev server.
- **esbuild**: JavaScript bundler.
- **date-fns**: Date utility library.

### Forms & Validation
- **React Hook Form**: Form management.
- **Zod**: Schema validation.
- **drizzle-zod**: Zod schema generation from Drizzle.

### Routing
- **Wouter**: Lightweight routing for React.

### Fonts
- **Google Fonts**: Inter, JetBrains Mono.