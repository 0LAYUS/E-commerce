# Admin Panel Adjustments — Phases

## Overview
Adjustments to the admin panel including archive system for categories/products/variants and dashboard visualizations.

## Data Model

### Field Definitions
| Field | Use Case |
|-------|----------|
| `active` | Toggle public visibility (product shows in store or not) |
| `archived` | Soft-delete (entity exists but is "removed" from active inventory) |

**Important**: `active` and `archived` are independent. A product can be:
- `active=true, archived=false` → Visible in store
- `active=false, archived=false` → Not visible in store (hidden)
- `archived=true` → Archived (regardless of active), visible only in admin archive views

---

## Rules (from AGENT_RULES.md)

```markdown
# Agent Development Rules — E-commerce Project

## 1. Before implementing anything

- **Always ask first.** Before adding a new feature, modifying existing logic, or changing the project structure, describe what you plan to do and wait for explicit confirmation.
- **Check if it already exists.** Before creating any component, function, hook, service, or visual element, search the project for something similar. If it exists, use it or extend it — never duplicate.
- **Clarify scope.** If a task is ambiguous, ask for clarification before generating code.

---

## 2. Git workflow

- `main` → stable production. Never push directly here.
- `staging` → integration and testing. Never work directly here.
- Always create a new branch from `staging`:
  ```bash
  git checkout staging && git pull
  git checkout -b feature/your-feature-name
  ```
- Use prefixes: `feature/` for new features, `fix/` for bug fixes.
- Keep your branch updated with `staging` regularly.
- Merge back to `staging` only after verifying the code works and resolving any conflicts.
- Only validated changes in `staging` are merged into `main`.

---

## 3. Visual consistency and aesthetics

- **Use color variables.** Always use the project's CSS variables or design tokens (e.g. `--color-primary`). Never hardcode colors.
- **Reuse visual components.** Before adding a button, card, modal, icon, or any visual element, verify it doesn't already exist in the project. If it does, use it directly.
- **Match the existing design.** Spacing, typography, borders, and shadows must follow the established system. Changes should be indistinguishable from the rest of the UI.

---

## 4. Code quality

- **All code in English.** Variables, functions, comments, file names, and commit messages must be written in English.
- **Clear, descriptive names.** Use `camelCase` for variables and functions. Avoid ambiguous abbreviations. The name should describe the intent, not the implementation.
- **Comment the code.** Document non-obvious logic, parameters of important functions, side effects, and design decisions that aren't self-evident.
- **Separation of concerns.** Each module, component, or function must have a single reason to change. Separate business logic, presentation, and data access.

---

## 5. SOLID principles

- **S — Single Responsibility:** Each class, component, or function must have one well-defined responsibility.
- **O — Open/Closed:** Code should be open for extension but closed for modification. Prefer composition over editing existing code.
- **L — Liskov Substitution:** Abstractions must be substitutable by their implementations without altering expected behavior.
- **I — Interface Segregation:** Define small, specific interfaces. Don't force a module to depend on methods it doesn't use.
- **D — Dependency Inovation:** Depend on abstractions, not concrete implementations.

---

## Quick reference

| ❌ Don't | ✅ Do |
|---|---|
| Push directly to `main` | Use `feature/*` or `fix/*` branches |
| Work directly on `staging` | Always branch from `staging` |
| Hardcode colors | Use design system variables |
| Duplicate components | Check for existing ones first |
| Write code in Spanish | All code in English |
| Implement without confirming | Ask before any change |
```

---

## Phase 1: Archive System (Categories, Products, Variants)
**Status**: Pending  
**Date**: TBD

### Goal
Implement soft-delete (archive) system for categories, products, and variants. Prevent data loss in orders.

### Delete vs Archive Logic

| Entity | Has Associated Sales/Products? | Action |
|--------|----------------------|--------|
| Category | Yes (active products) | ❌ Block with error message |
| Category | No products | ✅ Hard delete |
| Product | Yes (any order_items) | → Archive + show message |
| Product | No sales | ✅ Hard delete |
| Variant (SKU) | Yes (any order_items) | → Archive + show message |
| Variant (SKU) | No sales | ✅ Hard delete |

### Database Changes

#### Migration: Add archived field
```sql
ALTER TABLE categories ADD COLUMN archived BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN archived BOOLEAN DEFAULT false;
ALTER TABLE product_skus ADD COLUMN archived BOOLEAN DEFAULT false;
```

### Server Actions (lib/actions/adminActions.ts)

#### New functions to add:
```typescript
// Check functions
hasProducts(categoryId: string): Promise<number>
hasSales(productId: string): Promise<number>
hasVariantSales(variantId: string): Promise<number>

// Archive functions
archiveCategory(id: string): Promise<void>
archiveProduct(id: string): Promise<void>
archiveVariant(id: string): Promise<void>

// Unarchive functions
unarchiveCategory(id: string): Promise<void>
unarchiveProduct(id: string): Promise<void>
unarchiveVariant(id: string): Promise<void>

// Delete handlers (update existing)
deleteCategory(id: string): Promise<{ success: boolean, error?: string, archived?: boolean }>
deleteProduct(id: string): Promise<{ success: boolean, error?: string, archived?: boolean }>
deleteVariant(id: string): Promise<{ success: boolean, error?: string, archived?: boolean }>
```

### UI Changes

#### CategoryGrid.tsx
- Update `handleDelete` to:
  1. Check `hasProducts(categoryId)`
  2. If count > 0 → show error: "No puedes eliminar esta categoría porque tiene X productos activos"
  3. If count = 0 → proceed with hard delete

#### ProductGrid.tsx
- Update `handleDelete` to:
  1. Check `hasSales(productId)`
  2. If count > 0 → show message: "Este producto tiene X ventas asociadas. Se archivará en lugar de eliminar."
  3. If count > 0 AND user confirms → call `archiveProduct()`
  4. If count = 0 → proceed with hard delete
- Add "Ver archivados" button → navigates to `/admin/products/archived`

#### ProductVariantsEditor.tsx
- In variant action menu (edit product):
  1. Check `hasVariantSales(variantId)`
  2. If has sales → show "Archivar" option (not delete), with tooltip explaining data integrity
  3. If no sales → show "Eliminar" option

#### Archived Views (NEW - scalable)
- `/admin/products/archived` — List of archived products
- `/admin/categories/archived` — List of archived categories
- Use **reusable data-fetching functions** and **reusable table components** to avoid code duplication

### Customer-Facing: Archived Product Page
- If customer accesses archived product by ID directly:
  - Show product page in **grayed out style**
  - Display message: "Este producto no está disponible"
  - Show product info (name, image) but disable purchase actions

### Files to Modify
- `supabase/migrations/` — new migration for archived columns
- `lib/actions/adminActions.ts` — add all check/archive/unarchive functions
- `lib/actions/productActions.ts` — update deleteProduct, add archiveProduct
- `components/admin/CategoryGrid.tsx` — update delete logic
- `components/admin/ProductGrid.tsx` — update delete logic, add archive navigation
- `components/admin/ProductVariantsEditor.tsx` — update variant delete logic
- `app/admin/products/archived/page.tsx` — new page for archived products
- `app/admin/categories/archived/page.tsx` — new page for archived categories
- `app/products/[id]/page.tsx` — handle archived product display

### Acceptance Criteria
- [ ] Categories with products cannot be deleted (error shown)
- [ ] Products with sales → archive instead of delete
- [ ] Variants with sales → archive option only (no delete)
- [ ] Variants without sales → can be deleted
- [ ] Unarchive functionality works for all entities
- [ ] Archived products view is reusable (functions, not duplicated code)
- [ ] Archived products show grayed page to customers

---

## Phase 2: Dashboard Metrics Cards
**Status**: Pending  
**Date**: TBD

### Goal
Add filterable dashboard cards showing revenue, sales counts, and best-selling products.

### Global Filter
Position: Top of dashboard, above cards
Options:
| Option | Description |
|--------|-------------|
| **Week** (default) | Last 7 days |
| **Day** | Today only |
| **Month** | Last 30 days |
| **Quarter** | Last 3 months |
| **6 Months** | Last 6 months |
| **Year** | Last 12 months |
| **All Time** | Entire history |
| **Custom Range** | Date picker for specific start/end |

Filter applies to ALL filterable cards simultaneously.

### Cards Configuration

| Card | Filterable | Default Query Period | Data Source |
|------|------------|---------------------|-------------|
| Total Revenue | ✅ Yes | Week | `orders.status = 'APPROVED'` + `pos_sales` |
| POS Sales | ✅ Yes | Week | `pos_sales` count/total |
| Reserved Stock | ❌ No | Current (always) | `stock_reservations.status = 'pending'` |
| Best Selling Product | ✅ Yes | Week | `order_items` aggregated by product |

### Queries (to verify with schema)

#### Total Revenue (filterable)
```sql
-- Online orders
SELECT SUM(total_amount) FROM orders 
WHERE status = 'APPROVED' 
AND created_at >= :periodStart 
AND created_at <= :periodEnd;

-- POS sales (add to online)
SELECT SUM(total) FROM pos_sales 
WHERE created_at >= :periodStart 
AND created_at <= :periodEnd;
```

#### POS Sales Count (filterable)
```sql
SELECT COUNT(*) FROM pos_sales 
WHERE created_at >= :periodStart 
AND created_at <= :periodEnd;
```

#### Reserved Stock (NOT filterable - always current)
```sql
SELECT COUNT(*) FROM stock_reservations WHERE status = 'pending';
```

#### Best Selling Product (filterable)
```sql
SELECT p.id, p.name, p.image_url, SUM(oi.quantity) as totalSold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.created_at >= :periodStart
AND oi.created_at <= :periodEnd
GROUP BY p.id, p.name, p.image_url
ORDER BY totalSold DESC
LIMIT 1;
```

### UI Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Week ▼] [Day] [Month] [Quarter]                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Revenue  │  │ POS Sales│  │ Reserved │  │ Best     │   │
│  │ $XXX,XXX │  │ XXX      │  │ Stock     │  │ Product  │   │
│  │          │  │          │  │ XX       │  │ [IMG]    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Files to Modify
- `app/admin/page.tsx` — update dashboard with new cards and filter
- `components/admin/DashboardFilter.tsx` — new reusable filter component
- `components/admin/MetricCard.tsx` — new reusable card component
- `components/admin/BestSellerCard.tsx` — new card for best selling product
- `lib/actions/adminActions.ts` — add query functions for dashboard metrics

### Component Design
- Use existing `Card` component from `components/ui/card.tsx`
- Filter buttons: use existing button styles from shadcn/ui
- Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Scalable architecture for adding more cards easily

### Acceptance Criteria
- [ ] Global filter changes all filterable cards
- [ ] Reserved Stock always shows current value (not affected by filter)
- [ ] Best Selling Product updates based on selected period
- [ ] Cards are reusable components (no code duplication)
- [ ] Responsive layout works on all screen sizes

---

## Phase 3: Revenue Line Chart
**Status**: Pending  
**Date**: TBD

### Goal
Add line chart showing daily revenue, combining online orders and POS sales with visual differentiation.

### Technical Approach
- Uses **global filter** from Phase 2 (Week/Day/Month/Quarter/6M/Year/All Time/Custom Range)
- X-axis: days within selected period, Y-axis: revenue
- Two data series:
  - **Online Orders** — one color (e.g., blue)
  - **POS Sales** — different color (e.g., green)
- Days with no sales show **0** (bar at baseline)
- Chart type: **LineChart** (not AreaChart)

### Queries

#### Online Orders Revenue by Day
```sql
SELECT DATE(created_at) as day, SUM(total_amount) as revenue
FROM orders
WHERE status = 'APPROVED'
AND created_at >= :periodStart
AND created_at <= :periodEnd
GROUP BY DATE(created_at)
ORDER BY day;
```

#### POS Sales Revenue by Day
```sql
SELECT DATE(created_at) as day, SUM(total) as revenue
FROM pos_sales
WHERE created_at >= :periodStart
AND created_at <= :periodEnd
GROUP BY DATE(created_at)
ORDER BY day;
```

### UI Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Revenue Overview                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     $                                                        │
│     │    ╱╲                    ╱╲                          │
│     │   ╱  ╲    ╱╲           ╱  ╲    ╱╲                     │
│     │  ╱    ╲  ╱  ╲    ╱╲  ╱    ╲  ╱  ╲                    │
│     │ ╱      ╲╱    ╲  ╱  ╲╱      ╲╱    ╲                   │
│     │                                                  ─── │
│     └───────────────────────────────────────────────────── │
│       Day 1   Day 5   Day 10   Day 15   Day 20   Day 25    │
│                                                             │
│     ── Online Orders    ── POS Sales                        │
└─────────────────────────────────────────────────────────────┘
```

### Placement
- **Current**: Below dashboard metric cards on main dashboard page
- **Subject to change**: May be moved to separate view in future iterations

### Files to Modify
- `app/admin/page.tsx` — add RevenueChart component
- `components/admin/RevenueChart.tsx` — new line chart component

### Component Design
- Use custom LineChart with Tailwind + SVG
- Legend showing Online Orders vs POS Sales colors
- Tooltip on hover showing exact values for each day
- Responsive: adapts width to container
- Y-axis: formatted currency (COP)

### Acceptance Criteria
- [ ] Chart uses global filter from Phase 2
- [ ] Two distinct lines: Online Orders (blue) and POS Sales (green)
- [ ] Days with no sales display as 0
- [ ] Tooltip shows exact values on hover
- [ ] Legend clearly identifies each series
- [ ] Responsive layout
- [ ] Uses Tailwind/styled components (no MUI)

---

## Phase 4: Orders by Payment Status Charts
**Status**: Pending  
**Date**: TBD

### Goal
Add **two separate** bar charts showing order counts by payment status: one for online orders, one for POS sales.

### Technical Approach
- Uses **global filter** from Phase 2 (Week/Day/Month/Quarter/6M/Year/All Time/Custom Range)
- **Two separate charts** displayed side by side or stacked
- Chart orientation: **horizontal** (looks better for status labels)

#### Online Orders Chart
Statuses: PENDING, APPROVED, DECLINED, ERROR
```sql
SELECT status, COUNT(*) as count
FROM orders
WHERE created_at >= :periodStart
AND created_at <= :periodEnd
GROUP BY status;
```

#### POS Sales Chart
Statuses: pending, paid, failed, refunded
```sql
SELECT payment_status, COUNT(*) as count
FROM pos_sales
WHERE created_at >= :periodStart
AND created_at <= :periodEnd
GROUP BY payment_status;
```

### UI Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Orders by Status                                           │
├────────────────────────────┬──────────────────────────────┤
│  Online Orders             │  POS Sales                    │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐│
│  │ ██████████  PENDING  │  │  │ ████████  paid          ││
│  │ ██████████  APPROVED │  │  │ ██        pending       ││
│  │ ██          DECLINED │  │  │ ██        failed        ││
│  │ █            ERROR   │  │  │ █            refunded   ││
│  └──────────────────────┘  │  └──────────────────────────┘│
└────────────────────────────┴──────────────────────────────┘
```

### Placement
- **Current**: Below RevenueChart on main dashboard page
- **Subject to change**: May be moved to separate view in future iterations

### Files to Modify
- `app/admin/page.tsx` — add both chart components
- `components/admin/OnlineOrdersStatusChart.tsx` — new chart component
- `components/admin/POSSalesStatusChart.tsx` — new chart component

### Component Design
- Use custom horizontal BarChart with Tailwind + SVG
- Each status gets a distinct color
- Tooltip on hover showing exact count
- Responsive: stack vertically on mobile
- Status labels clearly visible

### Acceptance Criteria
- [ ] Two separate charts: Online Orders and POS Sales
- [ ] Both charts use global filter from Phase 2
- [ ] All statuses represented with distinct colors
- [ ] Horizontal bar orientation (better label visibility)
- [ ] Tooltip shows exact counts on hover
- [ ] Responsive layout (stack on mobile)
- [ ] Uses Tailwind/styled components (no MUI)

---

## Phase 5: Users Table Enhancement
**Status**: Pending  
**Date**: TBD

### Goal
Enhance the existing users table with: new columns, real-time search, filters, full details modal, and pagination with recursive loading.

### Current State (existing)
- Table in: `app/admin/users/page.tsx` + `components/admin/UserManagement.tsx`
- Current columns: Usuario (email+avatar), Rol, Fecha registro, Acciones
- No search, no filter, no pagination (fetches ALL users)

### New Columns

| Column | Description |
|--------|-------------|
| **Usuario** | Email + Avatar (existing) |
| **Email** | Explicit email column (new) |
| **Rol** | Badge (existing) |
| **Órdenes** | Order count per user (NEW) |
| **Fecha de registro** | Formatted date (existing) |
| **Acciones** | Dropdown + View Details button (existing + new) |

### Features to Add

#### 1. Order Count Column
```sql
SELECT p.*, 
       (SELECT COUNT(*) FROM orders WHERE user_id = p.id) as orderCount
FROM profiles p
-- JOIN with auth.users for email if not in profiles
```

#### 2. Real-Time Search (Debounced)
- Input field above table
- **Debounce**: Wait ~300ms after user stops typing before searching
- Searches: email, usuario (name if exists)
- Client-side filtering for loaded data, server query for new searches
- Visual feedback during search (subtle loading indicator)

#### 3. Role Filter
- Dropdown/tabs: All / Administradores / Clientes
- Filters the displayed list

#### 4. Full Details Modal
- Button in actions column: "Ver detalles" / eye icon
- Opens modal with ALL user data:
  - Full profile info
  - Complete order history for this user
  - Total spent, average order value
  - Account creation date
  - Last order date
  - Any other relevant data
- Modal size: large (not constrained by table space)

#### 5. Pagination with Recursive Loading
- Initial load: 20-50 users
- "Load More" button OR infinite scroll
- Server-side pagination (NOT fetching all users)
- Update `getAllUsers()` to accept `limit` and `offset` parameters
- Total count display: "Mostrando X de Y usuarios"

### UI Structure
```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Buscar usuario...                    [All ▼ Admin Client]│
├─────────────────────────────────────────────────────────────┤
│  Usuario     │ Email          │ Rol  │ Órdenes │ Fecha  │ ⋮ │
├─────────────────────────────────────────────────────────────┤
│  j@email.com │ j@email.com    │ Admin│   12    │ 19/04/26│ ⋮ │
│  m@email.com │ m@email.com    │Client│    3    │ 15/03/26│ ⋮ │
│  ...                                                    ▼   │
├─────────────────────────────────────────────────────────────┤
│  Mostrando 20 de 156 usuarios        [Cargar más]           │
└─────────────────────────────────────────────────────────────┘
```

### Modal Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Detalles del Usuario                              [X]     │
├─────────────────────────────────────────────────────────────┤
│  Email: j@email.com                                       │
│  Rol: Administrador                                       │
│  Fecha de registro: 19 de abril de 2026                   │
│  Órdenes Totales: 12                                      │
│  Gasto Total: $1,234,567 COP                              │
│  Promedio por orden: $102,880 COP                         │
│  Última orden: 15 de abril de 2026                        │
│                                                             │
│  ── Historial de Órdenes ──────────────────────────────── │
│  #1234 - $89,000 - APPROVED - 15/04/26                    │
│  #1233 - $45,000 - PENDING - 10/04/26                     │
│  ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Files to Modify
- `components/admin/UserManagement.tsx` — add columns, search, filter, modal, pagination
- `lib/actions/authActions.ts` — update `getAllUsers()` with pagination + order count
- `components/admin/UserDetailsModal.tsx` — new modal component

### Acceptance Criteria
- [ ] All columns present: Usuario, Email, Rol, Órdenes, Fecha, Acciones
- [ ] Order count accurate per user
- [ ] Real-time search with debounce (~300ms)
- [ ] Role filter works (All/Admin/Client)
- [ ] Modal shows complete user data
- [ ] Pagination works with "Load More" or infinite scroll
- [ ] Recursive loading (can load more without page refresh)
- [ ] Shows "X of Y users" count
- [ ] Consistent with existing table styling

---

## Implementation Order
1. **Phase 1** — Archive system (most complex, foundational)
2. **Phase 2** — Dashboard metrics cards with filter
3. **Phase 3** — Revenue chart
4. **Phase 4** — Order status chart
5. **Phase 5** — Users table

## Branch
`feature/christian-admin-panel`

## Notes
- Custom chart components (Tailwind-based) preferred over external libraries
- Phase 2 cards should be reusable for future dashboard expansions
- All phases should maintain visual consistency with existing admin UI (shadcn/ui + Tailwind)
