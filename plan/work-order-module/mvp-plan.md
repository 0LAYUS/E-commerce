# Work Order & Tracking Module - MVP Execution Plan

## Phase 1: Database Setup (Supabase)

### Step 1: Migration Creation
Create a new migration file via the CLI (`npx supabase migration new create_work_orders`).
- Define `work_orders` and `work_order_evidence` tables.
- Add text check constraints on `status` to enforce the state machine (`DRAFT`, `RECEIVED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `DELIVERED`, `CANCELLED`).
- Enable Row Level Security (RLS) on all new tables.
- Create policies restricted to admins for all CRUD operations.
- Create read-only policies for public access on `work_orders` and `work_order_evidence` ensuring access is only granted if the tracking ID and phone number match.

### Step 2: Storage Bucket
- Create a new Supabase Storage bucket `work_order_evidence`.
- Add RLS policies allowing authenticated admins to upload/read, and public users to read if they have the valid tracking URL.

### Step 3: Type Generation
Run `npx supabase gen types typescript --local > types/supabase.ts` to sync the new tables and properties to the frontend, ensuring full end-to-end type safety.

## Phase 2: Backend API & Actions

### Step 1: Server Actions
Create `src/features/work-orders/actions/workOrderActions.ts`:
- `createWorkOrder(data)`
- `updateWorkOrderStatus(id, newStatus)`
- `addEvidence(workOrderId, stage, imageUrl, notes)`
These actions must use the Supabase server client and validate inputs securely.

### Step 2: Client-side Image Optimization
Before uploading evidence to Supabase, images MUST be optimized in the browser to save bandwidth and storage, avoiding Node.js native dependencies (`sharp`) which break Cloudflare Pages deployments.
- Create a utility `src/shared/utils/imageOptimizer.ts`.
- Use the HTML5 Canvas API to resize and convert uploaded images (JPEG/PNG) to `.webp` format at a max width of 1024px and ~0.8 quality.
- The optimized `Blob` is then uploaded directly to Supabase Storage from the client using `@supabase/supabase-js`.

## Phase 3: Frontend Implementation

### Step 1: Admin Dashboard (`app/admin/work-orders/`)
- **`page.tsx`**: A data table displaying all work orders with filtering by status and search by customer name/phone.
- **`[id]/page.tsx`**: Detailed view of a work order.
  - **Status Stepper**: Visual representation of the state machine.
  - **Evidence Gallery**: Grid showing uploaded photos.
  - **Upload Modal**: Uses `components/ui/modal.tsx` and the client-side `.webp` optimizer to add new evidence.

### Step 2: Public Tracking Page (`app/tracking/`)
- **`page.tsx`**: A simple gateway form asking for Work Order ID and Customer Phone.
- **`[id]/page.tsx`**: A mobile-friendly read-only view.
  - Displays current status, estimated cost, and public evidence photos (e.g., "Before" and "After" shots).
  - Uses `components/branding/StoreLogo` and `StoreName` to reflect the tenant's brand.

## Phase 4: Integration & Testing

### Step 1: Feature Flag Setup
- Integrate a `work_orders` toggle in the admin settings or `branding-store.ts` config to easily turn the module on/off per tenant. Update navigation sidebar to respect this flag.

### Step 2: Vitest Coverage
- Write unit tests for the state machine transitions in `src/features/work-orders/services/statusTransition.test.ts`.
- Test the client-side `.webp` compression utility in Vitest to ensure aspect ratios and formats are maintained.
