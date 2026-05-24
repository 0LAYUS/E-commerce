# Correcciones y Refactorizaciones Pendientes

> Documento generado a partir del análisis del patrón de refactorización aplicado en `app/admin/layout.tsx`.

---

## Prioridad Alta

### 1. `app/pos/page.tsx` (405 líneas)

**Problema:** Mezcla lógica del carrito, pago, sidebar duplicado y UI en un solo archivo.

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `SaleResponse` (línea 15-26) | `types/pos.types.ts` |
| Sidebar navigation duplicado (líneas 263-290) | Reutilizar `lib/constants/admin.ts` |
| Lógica del carrito (`handleSelectProduct`, `handleUpdateQuantity`, etc.) | `hooks/usePOSCart.ts` |
| Lógica de pago (`handlePaymentConfirm`) | `hooks/usePOSPayment.ts` |
| Sidebar inline (líneas 257-292) | `components/pos/POSSidebar.tsx` |
| Category filter buttons (líneas 327-351) | `components/pos/CategoryFilterBar.tsx` |
| Loading spinner (líneas 355-357) | Reutilizar `AdminSkeleton` |

**Problema adicional:** Duplica el sidebar del admin layout. Debería usar un layout POS dedicado.

---

### 2. `app/checkout/page.tsx` (496 líneas)

**Problema:** 5 `useEffect` independientes, lógica de reserva, validación y Wompi todo mezclado.

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `WompiResult` (línea 14-19) | `types/checkout.types.ts` |
| `wompiPublicKey` y widget config defaults | `lib/constants/checkout.ts` |
| 5 `useEffect` (fetch zones, profile, Wompi, validate cart, reserve stock) | `hooks/useCheckoutSetup.ts` |
| Lógica de reserva y cleanup de stock | `hooks/useStockReservation.ts` |
| Sección info de envío (líneas 364-417) | `components/checkout/ShippingInfoForm.tsx` |
| Resumen del pedido (líneas 419-447) | `components/checkout/OrderSummary.tsx` |
| Alertas items bloqueados (líneas 307-334) | `components/checkout/BlockedItemsAlert.tsx` |
| Alertas precios cambiados (líneas 336-362) | `components/checkout/PriceChangeAlert.tsx` |
| `Intl.NumberFormat` COP repetido 7+ veces | Usar `lib/format.ts` |

**Problema adicional:** Colores hardcodeados (`bg-green-50`, `bg-blue-50`, `bg-amber-50`) en lugar de CSS variables.

---

### 3. `components/admin/ProductGrid.tsx` (461 líneas)

**Problema:** Grid + modal + image uploader + lógica de delete todo en un componente.

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `ImageItem` (línea 15-19) | `types/product.types.ts` |
| Product card en el grid (líneas 294-330) | `components/admin/ProductCard.tsx` |
| Modal crear/editar producto (líneas 339-454) | `components/admin/ProductFormModal.tsx` |
| Image gallery con drag-drop (líneas 388-439) | `components/admin/ProductImageUploader.tsx` |
| Lógica de imágenes (add, remove, drag-drop, revoke) | `hooks/useProductImages.ts` |
| Lógica de delete/archive con verificación de ventas | `hooks/useProductDelete.ts` |
| Mensajes de error/alerta | `lib/constants/products.ts` |

**Problema adicional:** Castings `(p as { active?: boolean })` repetidos indican que el tipo `Product` no incluye `active`.

---

### 4. `components/admin/ProductVariantsEditor.tsx` (612 líneas)

**Problema:** Editor de variantes con lógica cartesiana, UI de tabla y acciones todo mezclado.

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipos `OptionDef` y `VariantData` (líneas 8-20) | Unificar con `types/product.types.ts` |
| Mapa `suggestions` (líneas 291-297) | `lib/constants/variants.ts` |
| Option editor block (líneas 349-414) | `components/admin/VariantOptionEditor.tsx` |
| Variant table row (líneas 458-578) | `components/admin/VariantRow.tsx` |
| Variant action menu (líneas 544-577) | `components/admin/VariantActionMenu.tsx` |
| Lógica de save/delete/archive de variantes | `hooks/useVariantActions.ts` |
| Generación de variantes cartesianas (líneas 118-161) | `lib/utils/variantGenerator.ts` |

---

## Prioridad Media

### 5. `app/cart/page.tsx` (383 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Switch de status badges (líneas 64-92) | `lib/constants/cart.ts` como `STATUS_BADGE_CONFIG` |
| Switch de status messages (líneas 94-107) | `lib/constants/cart.ts` como `STATUS_MESSAGES` |
| Cart item card (líneas 191-316) | `components/cart/CartItemCard.tsx` |
| Order summary sidebar (líneas 320-360) | `components/cart/CartSummary.tsx` |
| `Intl.NumberFormat` COP repetido 6+ veces | Usar `lib/format.ts` |
| Lógica de detección de cambios de precio | `hooks/useCartPriceChanges.ts` |

---

### 6. `components/admin/UserManagement.tsx` (297 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `UserType` (líneas 8-14) | Extender `types/user.types.ts` |
| Tipo `FilterRole` (línea 22) | `types/admin.types.ts` |
| Role filter labels y display names | `lib/constants/users.ts` |
| `LIMIT = 50` (línea 40) | Constante nombrada |
| User table row (líneas 176-260) | `components/admin/UserTableRow.tsx` |
| Role action dropdown (líneas 222-257) | `components/admin/UserRoleMenu.tsx` |
| Debounced search + fetch pagination | `hooks/useUserList.ts` |

---

### 7. `app/admin/pos/page.tsx` (255 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `SummaryData` (líneas 8-19) | `types/pos.types.ts` |
| Payment method cards config (líneas 157-215) | `lib/constants/pos.ts` como `PAYMENT_METHODS` |
| Payment method summary card | `components/admin/PaymentMethodCard.tsx` |
| Quick action links (líneas 226-251) | `components/admin/POSQuickActions.tsx` |
| Metric cards (líneas 83-149) | Reutilizar `MetricCard` existente |
| `formatPrice` | Usar `lib/format.ts` |

**Problema adicional:** Colores hardcodeados (`bg-green-100`, `bg-blue-100`, `bg-purple-100`, `bg-orange-100`).

---

### 8. `app/admin/sales/page.tsx` (123 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `OrderRow` (líneas 3-13) | Extender `types/order.types.ts` |
| Status badge styles (líneas 95-101) | `lib/constants/orders.ts` como `STATUS_BADGE_STYLES` |
| Sales metric cards (líneas 46-59) | `components/admin/SalesMetricCards.tsx` |
| Orders table (líneas 61-120) | Reutilizar `OrdersTable` existente |
| `Intl.NumberFormat` COP repetido | Usar `lib/format.ts` |

**Problema adicional:** Colores hardcodeados (`text-gray-900`, `bg-white`, `bg-gray-50`, `text-green-600`).

---

### 9. `components/admin/ShippingZonesGrid.tsx` (264 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Zone card (líneas 91-139) | `components/admin/ShippingZoneCard.tsx` |
| Zone form modal (líneas 148-239) | `components/admin/ShippingZoneForm.tsx` |
| `formatCurrency` | Usar `lib/format.ts` |

**Nota:** Sigue el mismo patrón "grid + modal embebido" que `ProductGrid`.

---

### 10. `app/pos/components/PaymentModal.tsx` (249 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `PaymentMethod` (línea 6) | `types/pos.types.ts` |
| Payment method config (líneas 91-127) | `lib/constants/pos.ts` como `PAYMENT_METHOD_CONFIG` |
| Lógica de `quickAmounts` (línea 70) | `lib/utils/quickAmounts.ts` |
| Cash payment section (líneas 129-163) | `components/pos/CashPaymentSection.tsx` |
| Split payment section (líneas 165-233) | `components/pos/SplitPaymentSection.tsx` |
| Lógica de validación y confirmación de pago | `hooks/usePaymentValidation.ts` |

---

### 11. `app/admin/page.tsx` (88 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Metric cards (líneas 21-34) | `components/admin/StoreSummaryCards.tsx` |
| Recent orders table (líneas 40-85) | `components/admin/RecentOrdersTable.tsx` |
| Status badge styles inline (líneas 59-63) | `lib/constants/orders.ts` |
| `Intl.NumberFormat` COP | Usar `lib/format.ts` |

**Problema adicional:** TODOS los colores hardcodeados (`text-gray-900`, `bg-white`, `text-gray-500`, `bg-gray-50`, `bg-green-100`).

---

## Prioridad Baja

### 12. `app/pos/components/CartPOS.tsx` (210 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `CartItem` (líneas 6-18) | Mover a `types/cart.types.ts` o `types/pos.types.ts` |
| Cart item row (líneas 89-152) | `components/pos/CartItemRow.tsx` |
| `formatPrice` | Usar `lib/format.ts` |

---

### 13. `app/profile/ProfileForm.tsx` (164 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| Tipo `ProfileData` (líneas 6-11) | Extender `types/user.types.ts` |
| Personal info section | `components/profile/PersonalInfoSection.tsx` |
| Password change section | `components/profile/PasswordChangeSection.tsx` |

**Problema adicional:** Colores hardcodeados (`text-gray-700`, `bg-white`, `border-gray-300`, `focus:border-blue-500`).

---

### 14. `app/products/[id]/ProductDetailClient.tsx` (202 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| `formatStockLabel` (líneas 55-60) | `lib/format.ts` |
| `Intl.NumberFormat` COP | `lib/format.ts` |

**Nota:** Ya bien estructurado con sub-componentes. Solo necesita utilidades extraídas.

---

### 15. `components/admin/DashboardClient.tsx` (131 líneas)

**Qué extraer:**

| Elemento | Ubicación |
|---|---|
| `formatCurrency` (líneas 50-55) | `lib/format.ts` |

**Nota:** Ya bien estructurado. Usa sub-componentes (`MetricCard`, `BestSellerCard`, `DashboardFilter`, `RevenueChart`).

---

## Resumen Cuantitativo

| Prioridad | Archivos | Líneas totales aprox. |
|-----------|----------|----------------------|
| Alta      | 4        | 2,174                |
| Media     | 7        | 1,782                |
| Baja      | 4        | 761                  |
| **Total** | **15**   | **4,717**            |

---

## Patrones Transversales

### 1. `Intl.NumberFormat` para COP duplicado

**Afecta:** 12+ archivos

**Solución:** Crear `formatCOP()` en `lib/format.ts` y reemplazar todas las instancias de:
```ts
new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" })
```

### 2. Colores hardcodeados en lugar de CSS variables

**Afecta:** `app/admin/page.tsx`, `app/admin/sales/page.tsx`, `app/admin/pos/page.tsx`, `app/profile/ProfileForm.tsx`, `app/checkout/page.tsx`

**Colores encontrados:**
- `text-gray-900`, `text-gray-500`, `text-gray-700`
- `bg-white`, `bg-gray-50`
- `bg-green-50`, `bg-green-100`, `text-green-600`
- `bg-blue-50`, `bg-blue-100`
- `bg-amber-50`
- `bg-purple-100`, `bg-orange-100`
- `border-gray-300`, `focus:border-blue-500`

**Solución:** Reemplazar con variables CSS del design system (`--primary`, `--secondary`, `--muted`, `--accent`, etc.) definidas en `app/globals.css`.

### 3. Tipos inline duplicados

**Tipos que deberían moverse a `types/`:**
- `CartItem` → `types/cart.types.ts` o `types/pos.types.ts`
- `OrderRow` → `types/order.types.ts`
- `UserType` → `types/user.types.ts`
- `OptionDef`, `VariantData` → unificar con `types/product.types.ts`
- `SaleResponse` → `types/pos.types.ts`
- `WompiResult` → `types/checkout.types.ts`
- `PaymentMethod` → `types/pos.types.ts`
- `SummaryData` → `types/pos.types.ts`
- `ProfileData` → `types/user.types.ts`

### 4. Sidebar duplicado en POS

**Archivo:** `app/pos/page.tsx` (líneas 263-290)

**Problema:** Replica un subconjunto de `SIDEBAR_ITEMS` de `lib/constants/admin.ts` hardcodeado.

**Solución:** Crear layout dedicado para POS que reutilice `AdminSidebar` o crear `POSSidebar` que importe desde las constantes compartidas.

### 5. Patrón "Grid + Modal embebido"

**Afecta:** `components/admin/ProductGrid.tsx`, `components/admin/ShippingZonesGrid.tsx`

**Problema:** El modal de crear/editar está embebido dentro del componente grid en lugar de ser un componente separado.

**Solución:** Extraer modales a componentes independientes (`ProductFormModal`, `ShippingZoneForm`) y comunicarse vía props/callbacks.
