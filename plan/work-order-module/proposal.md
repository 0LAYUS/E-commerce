# Work Order & Tracking Module - Technical Proposal

## 1. Overview & Architecture
The Work Order & Tracking module is designed to handle custom jobs, repairs, or service requests that require tracking through multiple states (e.g., Intake, In Progress, Waiting for Parts, Completed, Delivered). 

### Decoupling from Cart/Order Logic
Unlike standard e-commerce transactions (`pos_sales` or `orders` created from the cart), work orders bypass the standard checkout flow. They are managed entirely by admins/employees in the dashboard, with a public tracking page for customers. 
- **Standalone Feature:** Code will be strictly isolated in `src/features/work-orders/` following the Feature-Sliced design pattern.
- **Independent Tables:** Work orders will not use the `orders` or `pos_sales` tables. This avoids polluting transactional e-commerce data with service-oriented tasks and keeps metrics clean.

## 2. Database Schema Design (Supabase)

### State Machine
Work orders follow a strict state machine to prevent invalid transitions.
States: `DRAFT` -> `RECEIVED` -> `IN_PROGRESS` -> `ON_HOLD` -> `COMPLETED` -> `DELIVERED` / `CANCELLED`.

**`work_orders` Table:**
- `id` (UUID, PK)
- `customer_name` (Text)
- `customer_phone` (Text)
- `customer_email` (Text)
- `job_description` (Text)
- `status` (Text: follows the state machine constraints)
- `assigned_to` (UUID -> profiles.id)
- `estimated_cost` (Decimal)
- `final_cost` (Decimal)
- `tenant_id` (UUID - for multi-tenant isolation)
- `created_at`, `updated_at` (Timestamps)

### Evidence Tracking
To track progress and protect against disputes, employees can upload photographic evidence at different stages.

**`work_order_evidence` Table:**
- `id` (UUID, PK)
- `work_order_id` (UUID -> work_orders.id)
- `stage` (Text: e.g., 'INTAKE', 'IN_PROGRESS', 'COMPLETED')
- `image_url` (Text - references Supabase Storage)
- `notes` (Text)
- `uploaded_by` (UUID -> profiles.id)
- `created_at` (Timestamp)

## 3. Feature Flags & Multi-tenant Isolation
The module will utilize Row Level Security (RLS) combined with feature flags for isolation, keeping the system scalable across different clients.
- **Tenant Isolation:** A `tenant_id` column on the `work_orders` table ensures that store instances only see their own work orders via RLS policies.
- **Feature Flags:** Access to the Work Order module UI and API routes will be gated by a feature flag (e.g., `features.work_orders_enabled` in `branding-store.ts` or a DB settings table). If disabled, the UI routes will safely redirect or return 404.

## 4. UI Design & Styling
The UI will adhere to the existing design system outlined in `docs/SPEC.md`.

- **Colors & Theming:** Strictly use CSS variables (`--primary`, `--muted`, `--card`, `--border`, etc.) to maintain consistency across the PRIGMA/Store dual branding. Magic numbers and hardcoded colors are strictly prohibited.
- **Components:** 
  - Leverage `shadcn/ui` components from `components/ui/` (e.g., Data Table, Dialog, Button, Input).
  - Status Badges will use semantic coloring mapping (e.g., warning colors for 'ON_HOLD', success colors for 'COMPLETED') using tailwind utilities over CSS variables.
  - Icons: Use Lucide React (`Wrench`, `Camera`, `CheckCircle`, `Clock`).
- **Public Tracking Page:** A clean, mobile-first view (`/tracking/[id]`) for customers to check the status of their order using their phone number and order ID. It will utilize the `components/branding/` components to ensure the client's identity is correctly displayed.
