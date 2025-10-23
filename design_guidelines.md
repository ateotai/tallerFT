# Design Guidelines: Vehicle Maintenance Management System

## Design Approach

**Selected Approach**: Design System - Material Design with productivity tool inspiration

**References**: Linear (modern data management), Asana (task organization), Google Admin Console (enterprise operations)

**Core Principle**: Clean, data-focused interface prioritizing information density, rapid task completion, and clear hierarchy. This is an operational tool where efficiency trumps visual flair.

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for vehicle IDs, license plates, numeric data)

**Type Scale**:
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-2xl font-semibold (24px)
- Card/Module Titles: text-lg font-semibold (18px)
- Body Text: text-base (16px)
- Supporting Text: text-sm (14px)
- Labels/Captions: text-xs font-medium uppercase tracking-wide (12px)
- Data Values: text-sm font-mono (technical data like VIN, plate numbers)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-6
- Section spacing: gap-8 or space-y-8
- Card margins: mb-6
- Tight spacing (forms): gap-4
- List items: py-4

**Grid System**:
- Main container: max-w-7xl mx-auto px-6
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Data tables: Full-width within container
- Forms: max-w-3xl for optimal readability

## Component Library

### Navigation Structure
**Top Navigation Bar**:
- Fixed position with height h-16
- Left: Logo + app name
- Center: Primary module links (7 modules accessible)
- Right: Search bar, notifications bell, user profile dropdown
- Include badge indicators for pending tasks/alerts

**Sidebar (Desktop)**:
- Collapsible sidebar (w-64 expanded, w-20 collapsed)
- Module icons with labels
- Active state with subtle visual treatment
- Quick stats widget at bottom

**Mobile Navigation**:
- Bottom tab bar (fixed) with 5 most-used modules
- Hamburger menu for complete navigation
- Swipe gestures for module switching

### Dashboard Components

**Stats Cards** (Homepage overview):
- Grid of 4 metric cards showing: Total Vehicles, Pending Services, This Month's Costs, Stock Alerts
- Each card: Large number (text-4xl font-bold), label below, trend indicator (up/down arrow with percentage)
- Compact padding: p-6

**Data Tables**:
- Sticky header row (thead with sticky top-0)
- Alternating row treatment for readability
- Row height: min-h-14 for comfortable touch targets
- Column actions: Sort indicators, filter icons
- Inline quick actions (icon buttons on row hover)
- Pagination controls at bottom (compact design)
- Responsive: Stack to cards on mobile

**Calendar/Schedule View**:
- Month/week toggle
- Visual density control (compact/comfortable)
- Color-coded service types (use distinct border treatments, not fill colors)
- Click to expand service details in modal

### Forms & Inputs

**Form Layout**:
- Two-column layout for desktop (grid-cols-2 gap-6)
- Single column for mobile
- Field grouping with subtle section dividers
- Required field indicators: asterisk in label

**Input Components**:
- Text inputs: h-11 with clear focus states
- Select dropdowns: Native select with custom arrow icon
- Date pickers: Calendar popup interface
- File uploads: Drag-drop zone for vehicle photos
- Checkboxes/Radio: Larger touch targets (h-5 w-5)
- Search fields: Include magnifying glass icon, clear button

**Validation**:
- Inline error messages below fields
- Success states for completed forms
- Disabled state clarity for inactive fields

### Cards & Containers

**Vehicle Cards**:
- Horizontal layout: Image thumbnail (left, w-32), details (right)
- Key info: Make/Model, Plate, Next Service Date, Status badge
- Quick actions footer: View Details, Schedule Service

**Service History Cards**:
- Timeline-style presentation
- Date (prominent), service type, cost, provider
- Expandable sections for detailed notes

**Provider/Supplier Cards**:
- Company logo placeholder
- Contact info, rating stars, services offered tags
- Call-to-action buttons

### Modals & Overlays

**Modal Sizes**:
- Small (forms): max-w-md
- Medium (details): max-w-2xl
- Large (reports): max-w-5xl
- Full-screen for photo galleries

**Structure**:
- Header with title + close button
- Scrollable content area
- Fixed footer with action buttons (Cancel/Submit)

### Badges & Status Indicators

**Status Types**:
- Vehicle Status: Active, In Service, Out of Service, Retired
- Service Status: Scheduled, In Progress, Completed, Overdue
- Inventory: In Stock, Low Stock, Out of Stock
- All use border + text treatment (not background fills)
- Consistent sizing: px-3 py-1 text-xs rounded-full

### Buttons & Actions

**Button Hierarchy**:
- Primary action: Solid with prominent visual weight
- Secondary: Outlined treatment
- Tertiary: Text-only (ghost)
- Icon buttons: Square (h-10 w-10) with icon centered

**Button Sizes**:
- Large: h-12 px-6 text-base (primary CTAs)
- Medium: h-10 px-4 text-sm (standard)
- Small: h-8 px-3 text-sm (compact tables)

### Data Visualization

**Charts** (Reports module):
- Bar charts for cost comparisons
- Line charts for trend analysis
- Pie charts for service type distribution
- Use Chart.js library via CDN
- Consistent padding: p-8 for chart containers

### Icons
**Library**: Heroicons (via CDN)
- Outline style for navigation and secondary actions
- Solid style for filled states and primary actions
- Consistent sizing: h-5 w-5 (standard), h-6 w-6 (prominent)

## Responsive Breakpoints

**Mobile First Strategy**:
- Base: Single column, full-width cards
- md (768px): Two-column grids, show sidebar
- lg (1024px): Three-column grids, expanded navigation
- xl (1280px): Four-column dashboard, optimal desktop experience

**Mobile Optimizations**:
- Bottom navigation for quick module access
- Swipe gestures for table scrolling
- Simplified filters (collapsible panels)
- Touch-friendly targets (minimum 44x44px)

## Images

**Vehicle Photos**:
- Placeholder: 4:3 aspect ratio for vehicle images
- Location: Vehicle cards (thumbnail), vehicle detail view (gallery)
- Treatment: Rounded corners (rounded-lg), subtle border

**No Hero Section**: This is a utility application - users land directly on the dashboard with immediate access to data and actions.

**Logo/Branding**:
- Company logo in top navigation (h-8)
- Favicon for browser tabs

## Accessibility

- All interactive elements keyboard navigable
- Focus indicators on all inputs/buttons
- ARIA labels for icon-only buttons
- Semantic HTML (proper heading hierarchy)
- Skip navigation link for keyboard users
- Minimum contrast ratios for all text

## Animations

**Minimal Motion**:
- Subtle transitions on hover (150ms ease)
- Modal fade-in/fade-out (200ms)
- Loading spinners for data fetch
- NO scroll-triggered animations
- NO complex page transitions