# Plan de Implementación: Admin Orders + Cron PENDING

## Estado del Proyecto

### Lo que existe ✅

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| Modelo `orders` | ✅ Definido | `supabase/migrations/20260426041850_init_schema.sql` |
| Modelo `order_items` | ✅ Definido | misma migración |
| Enum `order_status` | ✅ `PENDING`, `APPROVED`, `DECLINED`, `ERROR` | misma migración |
| Funciones `increment_product_stock` / `increment_sku_stock` | ✅ Implementadas | `supabase/migrations/20260426041921_init_functions.sql` |
| Webhook Wompi (DECLINED → rollback stock) | ✅ Implementado | `app/api/webhooks/wompi/route.ts` |
| Layout Admin con sidebar | ✅ Implementado | `app/admin/layout.tsx` |
| Página `/admin/sales` (lista simple) | ⚠️ Básica, sin filtros | `app/admin/sales/page.tsx` |
| Dashboard `/admin` (últimas 5 órdenes) | ⚠️ Limitado | `app/admin/page.tsx` |

### Lo que NO existe ❌

- Ruta `/admin/orders`
- Detalle de orden `/admin/orders/[id]`
- Filtros por estado en admin
- Búsqueda por cliente/email/Wompi ID
- Exportación CSV
- Cron job para PENDING → ERROR

---

## Modelo de Datos Actual

```supabase/migrations/20260426041850_init_schema.sql#L77-98
-- orders
orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  total_amount     integer NOT NULL,
  status           order_status NOT NULL DEFAULT 'PENDING',
  wompi_transaction_id  text,
  customer_name    varchar(255),
  customer_email   varchar(255),
  shipping_address text,
  created_at       timestamptz NOT NULL DEFAULT now()
)

-- order_items
order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES orders(id),
  product_id        uuid NOT NULL REFERENCES products(id),
  quantity          integer NOT NULL DEFAULT 1,
  price_at_purchase integer NOT NULL,
  variant_id        uuid REFERENCES product_skus(id)
)
```

---

## Criterios de Aceptación

- [ ] Crear la ruta `/admin/orders` para un listado completo de órdenes
- [ ] Incluir filtros por estado: PENDING, APPROVED, DECLINED, ERROR
- [ ] Crear la ruta `/admin/orders/[id]` para ver el detalle de una orden
- [ ] Mostrar información del cliente, items, dirección y permitir cambiar el estado manualmente
- [ ] Implementar búsqueda por nombre de cliente, email o ID de transacción Wompi
- [ ] Permitir la exportación de órdenes a formato CSV
- [ ] Implementar un cron job que:
  - Busque órdenes PENDING con más de 30 minutos cada hora
  - Marque esas órdenes como ERROR y devuelva el stock usando `increment_product_stock` / `increment_sku_stock`

---

## Plan de Implementación

### FASE 1: Estructura y Tipos

```plan.md#L1-5
📁 Archivos a crear:
├── types/order.types.ts          (actualizar tipo existente)
├── lib/actions/orderActions.ts   (nuevo - CRUD órdenes)
└── lib/utils/csvExport.ts        (nuevo - utilidades CSV)
```

**Detalles:**

1. **`types/order.types.ts`** — Actualizar para incluir:
   - `wompi_transaction_id` en Order
   - Tipos para OrderItem con relaciones
   - Tipos para filtros y búsqueda

2. **`lib/actions/orderActions.ts`** — Nuevas funciones:
   - `getOrders(filters)` — Listado con paginación y filtros
   - `getOrderById(id)` — Detalle completo con items
   - `updateOrderStatus(id, status)` — Cambio manual de estado
   - `exportOrdersToCSV(filters)` — Generación de CSV

---

### FASE 2: Página de Listado `/admin/orders`

```plan.md#L1-10
📁 Archivos a crear:
├── app/admin/orders/page.tsx           (nuevo - Server Component)
├── components/admin/OrdersTable.tsx    (nuevo - tabla con filtros)
└── components/admin/OrdersFilters.tsx  (nuevo - barra de búsqueda y tabs)
```

**Funcionalidades:**

- **Filtros por estado**: Tabs horizontales (ALL, PENDING, APPROVED, DECLINED, ERROR)
- **Búsqueda**: Input para customer_name, customer_email, wompi_transaction_id (uso ILIKE para case-insensitive)
- **Paginación**: 20 órdenes por página
- **Ordenamiento**: Por fecha descendente (default: más reciente primero)
- **Link a detalle**: Cada fila clickeable lleva a `/admin/orders/[id]`
- **Botón exportar**: Genera y descarga CSV con los filtros actuales

**Query de ejemplo:**

```lib/actions/orderActions.ts#L1-20
const query = supabase
  .from('orders')
  .select('*, profiles(email)', { count: 'exact' })
  .ilike('customer_name', `%${search}%`)
  .eq('status', filterStatus)
  .order('created_at', { ascending: false })
  .range(offset, offset + pageSize - 1)
```

---

### FASE 3: Página de Detalle `/admin/orders/[id]`

```plan.md#L1-5
📁 Archivos a crear:
├── app/admin/orders/[id]/page.tsx       (nuevo)
└── components/admin/OrderDetailsCard.tsx (nuevo)
```

**Funcionalidades:**

- **Info del cliente**:
  - Nombre
  - Email
  - Dirección de envío
  - ID de usuario

- **Lista de items comprados**:
  - Imagen del producto
  - Nombre
  - Variante (si aplica)
  - Cantidad
  - Precio unitario
  - Subtotal

- **Resumen de orden**:
  - Monto total
  - Estado actual
  - ID de transacción Wompi
  - Fecha de creación

- **Acciones**:
  - Selector para cambiar estado manualmente (con confirmación)
  - Botón para marcar como ERROR (con rollback de stock)
  - Botón para reembolsar stock sin cambiar estado

**Layout参考**: Tomar como referencia `app/profile/orders/[id]/page.tsx` para estructura, pero con capacidades de edición.

---

### FASE 4: Exportación CSV

```lib/utils/csvExport.ts#L1-30
📁 Archivo a crear:
└── lib/utils/csvExport.ts

Funcionalidad:
- Genera CSV desde órdenes filtradas
- Columnas: ID, Cliente, Email, Fecha, Hora, Estado, Total (COP), Wompi ID
- Nombre archivo: orders_YYYY-MM-DD_HHMMSS.csv
- Encoding: UTF-8 con BOM para Excel compatibility

Implementación:
1. Obtener datos filtrados del servidor
2. Convertir a formato CSV usando strings concatenados
3. Crear Blob y descargar via URL.createObjectURL
```

---

### FASE 5: Cron Job PENDING → ERROR

```app/api/cron/cleanup-reservations/route.ts#L1-30
📁 Archivo a modificar:
└── app/api/cron/cleanup-reservations/route.ts  (extender endpoint existente)

CRON EXTERNO → POST /api/cron/cleanup-reservations

Flujo:
1. cleanup_expired_reservations (ya existe - limpia stock_reservations)
2. cleanup_pending_orders (NUEVO - órdenes PENDING huérfanas)
   a. SELECT id FROM orders WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '30 minutes'
   b. Para cada orden:
      - Obtener order_items
      - Rollback stock usando increment_sku_stock / increment_product_stock
      - UPDATE status = 'ERROR' (con protección .eq('status', 'PENDING'))

Nota: Se eliminó la Edge Function de Supabase porque el plan gratuito no soporta scheduling.
La lógica se ejecutará via cron externo (Vercel Cron, GitHub Actions, etc.) llamando a este endpoint.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `types/order.types.ts` | Agregar `wompi_transaction_id`, actualizar tipos |
| `app/admin/layout.tsx` | Agregar link a "Órdenes" en sidebar |
| `lib/actions/adminActions.ts` | Agregar funciones de orders si se comparte |

---

## Dependencias

No se necesitan dependencias externas. Todo está disponible:
- Supabase JS client (ya instalado)
- Lucide React (iconos, ya instalado)
- Native `Blob` + `URL.createObjectURL` para CSV

---

## Timeline Estimado

| Fase | Complejidad | Tiempo Estimado |
|------|-------------|-----------------|
| FASE 1: Tipos + Actions | Baja | 1-2 horas |
| FASE 2: Listado + Filtros | Media | 3-4 horas |
| FASE 3: Detalle + Editar | Media | 3-4 horas |
| FASE 4: Export CSV | Baja | 1 hora |
| FASE 5: Cron Job | Media | 2-3 horas |
| **TOTAL** | - | **10-14 horas** |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Race condition en cron (orden pasa a APPROVED mientras se marca ERROR) | Media | Usar transacción atómica con `SELECT FOR UPDATE` |
| Stock ya no disponible para rollback | Baja | Las funciones `increment_*` no fallan si stock es 0 |
| Webhook llega después del cron | Baja | El cron solo procesa PENDING, webhook cambia a DECLINED/APPROVED primero |

---

## Estructura Final de Archivos

```plan.md#L1-45
E-commerce/
├── app/
│   ├── admin/
│   │   ├── orders/
│   │   │   ├── page.tsx                    # Listado
│   │   │   └── [id]/
│   │   │       └── page.tsx                # Detalle
│   │   └── layout.tsx                      # (modificar - agregar link)
│   └── api/
│       └── cron/
│           └── cleanup-reservations/
│               └── route.ts               # (modificar - agregar cleanup PENDING)
├── components/
│   └── admin/
│       ├── OrdersTable.tsx                 # Tabla con datos
│       ├── OrdersFilters.tsx               # Búsqueda + tabs estado
│       ├── OrdersPagination.tsx            # Paginación
│       ├── OrdersExportButton.tsx         # Botón exportar CSV
│       └── OrderDetailsCard.tsx           # Card de detalle
├── lib/
│   ├── actions/
│   │   └── orderActions.ts                # CRUD órdenes
│   └── utils/
│       └── csvExport.ts                   # Exportación CSV
└── types/
    └── order.types.ts                     # (actualizar)
```

---

## Comandos Git

```bash
# Crear branch desde staging
git checkout staging && git pull
git checkout -b feature/admin-orders

# Después de implementar, probar y commit
git add .
git commit -m "feat(admin): add orders management and pending orders cleanup"

# Push y crear PR a staging
git push -u origin feature/admin-orders
```

---

## Checklist de Implementación

- [x] FASE 1: Actualizar `types/order.types.ts`
- [x] FASE 1: Crear `lib/actions/orderActions.ts`
- [x] FASE 1: Crear `lib/utils/csvExport.ts`
- [x] FASE 2: Crear `app/admin/orders/page.tsx`
- [x] FASE 2: Crear `components/admin/OrdersFilters.tsx`
- [x] FASE 2: Crear `components/admin/OrdersTable.tsx`
- [x] FASE 2: Crear `components/admin/OrdersPagination.tsx`
- [x] FASE 2: Crear `components/admin/OrdersExportButton.tsx`
- [x] FASE 2: Modificar `app/admin/layout.tsx` (agregar link Orders)
- [x] FASE 3: Crear `app/admin/orders/[id]/page.tsx`
- [x] FASE 3: Crear `components/admin/OrderDetailsCard.tsx`
- [x] FASE 4: Implementar descarga CSV
- [x] FASE 5: Modificar `app/api/cron/cleanup-reservations/route.ts` (agregar cleanup PENDING)
- [x] FASE 5: Eliminar Edge Function (plan gratuito no soporta cron)
- [x] Testing: Probar cada fase manualmente
- [x] Testing: Verificar rollback de stock en cron
- [x] Lint: Corregir errores en nuevos archivos
- [x] Docs: Actualizar `docs/plan.md`