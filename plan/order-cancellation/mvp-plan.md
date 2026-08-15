# Order Cancellation & Audit Logging - Implementation Plan (MVP)

## Checklist & Phases

### Phase 1: Database Migrations
- [x] Create migration `supabase/migrations/20260815000000_add_order_cancellation_and_audit_logs.sql`:
  - Create `audit_logs` table with indexes and RLS.
  - Add `cancellation_reason`, `cancelled_at`, `cancelled_by` to `orders`.
  - Add RLS policy allowing administrators to view and insert audit logs.

### Phase 2: State Machine & Backend Services
- [x] Implement Order State Machine in `src/features/orders/services/orderStatusTransitions.ts`.
- [x] Unit test state machine in `src/features/orders/services/orderStatusTransitions.test.ts`.
- [x] Implement Audit Logging Service in `src/features/admin/services/auditService.ts`.
- [x] Update `orderService.ts` and `orderActions.ts` with `cancelOrder(orderId, reason)`.
- [x] Update `findOrderItemsWithProducts` repository to exclude non-approved orders from best-sellers.

### Phase 3: UI Implementation
- [x] Create `src/features/admin/components/CancelOrderModal.tsx` with validation and loading state.
- [x] Integrate Cancel button and canceled order banner into `OrderDetailsCard.tsx`.
- [x] Update `types/order.types.ts` with cancellation fields and `AuditLog` types.

### Phase 4: Verification & Automated Tests
- [x] Run Vitest test suite (`npm run test:run`).
- [x] Verify state machine coverage.
