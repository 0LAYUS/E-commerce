# Order Cancellation, Stock Reversal & Audit Logging - Technical Proposal

## 1. Overview & Business Objectives
Currently, the e-commerce platform does not allow administrators to cancel orders that are in `APPROVED` or processing states. Furthermore, there is no centralized audit trail to track administrative operations (such as who approved, canceled, or modified an order).

This feature introduces:
1. **Deterministic Order Status State Machine:** Clear, validated transitions between order states (`PENDING`, `PENDING_MANUAL`, `APPROVED`, `DECLINED`, `ERROR`).
2. **Order Cancellation & Stock Reversal:** A safe, idempotent workflow to cancel orders, restore product/variant stock to inventory, and automatically exclude canceled orders from financial and best-seller metrics.
3. **Audit Logging System (`audit_logs`):** A centralized ledger that records actor ID, action type, target entity, timestamp, reason, and structured metadata.

---

## 2. Architecture & Design Patterns

### State Machine Pattern (`src/features/orders/services/orderStatusTransitions.ts`)
Instead of ad-hoc checks throughout the codebase, order lifecycle transitions follow a strictly defined transition table:

```
[ PENDING ] ─────────► [ APPROVED ]
   │                       │
   ▼                       ▼
[ DECLINED ] ◄─────────────┘
```

- `canTransitionOrder(currentStatus, nextStatus)` validates whether a requested transition is valid.
- `DECLINED` and `ERROR` are terminal states to prevent stock inconsistencies.

### Idempotent Stock Reversal
Stock reversal relies on:
1. An atomic database guard (`stock_returned: false -> true`) in `rollbackOrderStock`.
2. Existing PostgreSQL RPCs (`increment_product_stock` / `increment_sku_stock`) for atomic increment.
3. If an order's stock has already been returned, subsequent cancellation attempts update the status and record the log without duplicating inventory.

### Zero-Duplication Financial Recalculation
- The Admin Dashboard metrics calculate revenue exclusively from `APPROVED` orders (`findOrdersByDateRange(client, start, end, 'APPROVED')`).
- Moving an order to `DECLINED` naturally discounts the revenue from the dashboard and daily sales charts without requiring manual math or compensation ledger hacks.

---

## 3. Database Schema Design (Supabase)

### 1. `audit_logs` Table
A dedicated table for all security and operational audit trails:
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `auth.users(id)` ON DELETE SET NULL)
- `user_email` (Text)
- `action` (Text: e.g., `'ORDER_CANCELLED'`, `'ORDER_APPROVED'`)
- `target_type` (Text: e.g., `'order'`, `'product'`)
- `target_id` (Text)
- `reason` (Text - required for cancellations)
- `metadata` (JSONB - previous status, amounts, IP/UserAgent if available)
- `created_at` (Timestamptz DEFAULT now())

### 2. `orders` Table Enhancements
- `cancellation_reason` (Text, nullable)
- `cancelled_at` (Timestamptz, nullable)
- `cancelled_by` (UUID, references `auth.users(id)`, nullable)

---

## 4. UI & UX Design
- **Cancel Button & Modal:** Integrated into `OrderDetailsCard.tsx`.
- **Reason Prompt:** Mandatory text input or preset selection before confirming cancellation.
- **Visual Feedback:** Destructive styling (`destructive` variant), confirmation dialog, and contextual banner when viewing a canceled order.
- **Wompi Warning:** Contextual alert advising administrators to issue the monetary refund in the Wompi dashboard if the order was paid online.
