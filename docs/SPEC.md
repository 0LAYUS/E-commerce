# SPEC.md — Sistema POS

## Overview

Sistema Point of Sale (POS) para el dashboard admin. Permite realizar ventas directas sin necesidad de integraciones de pago externo. Diseñado para entorno retail donde un empleado/admin opera en nombre del cliente.

---

## Stack Tecnológico

- **Framework**: Next.js 15 + React 19
- **Estilos**: Tailwind CSS 3.4 + shadcn/ui
- **Base de datos**: PostgreSQL via Supabase
- **ORM**: @supabase/supabase-js v2
- **Icons**: Lucide React
- **Fuentes**: Geist Sans

---

## Sistema de Diseño (Uniformidad)

### Colores CSS (ya definidos en globals.css)

```css
--primary: 217 91% 60%          /* Azul principal */
--primary-foreground: 0 0% 100%
--secondary: 220 14% 96%        /* Gris claro */
--secondary-foreground: 0 0% 9%
--muted: 220 14% 96%
--muted-foreground: 0 0% 45%
--accent: 220 14% 96%
--accent-foreground: 0 0% 9%
--destructive: 0 84% 60%        /* Rojo */
--border: 220 13% 91%
--input: 220 13% 91%
--ring: 217 91% 60%
--radius: 0.5rem                /* rounded-lg */
```

### Tokens de Diseño

| Token | Valor | Uso |
|-------|-------|-----|
| Cards | `bg-card rounded-xl shadow-sm border` | Contenedores principales |
| Headers | `text-3xl font-extrabold` | Títulos de página |
| Subheaders | `text-xl font-extrabold` | Títulos de sección |
| Body | `text-sm` | Texto general |
| Muted | `text-muted-foreground` | Texto secundario |
| Inputs | `h-10 rounded-md border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-ring` | Campos de formulario |
| Botones primarios | `bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm` | Acciones principales |
| Botones secundarios | `border border-input rounded-lg hover:bg-accent` | Acciones secundarias |
| Sidebar | `w-64 bg-card shadow-sm border-r border-border` | Navegación lateral |
| Page padding | `p-8` | Contenido principal |
| Spacing grid | `gap-6` | Separación entre cards |

### Iconos

Usar **Lucide React** exclusivamente. Tamaños estándar:
- `w-4 h-4` — Iconos inline con texto
- `w-5 h-5` — Iconos en navegación
- `w-8 h-8` — Iconos standalone
- `w-10 h-10` — Iconos en empty states

---

## Modelo de Datos

### Tabla: pos_sales

```sql
CREATE TABLE pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL,
  -- items: [{ product_id, variant_id, name, sku, quantity, unit_price, discount_pct, subtotal }]
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'paid',
  amount_received DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  notes TEXT,
  channel TEXT DEFAULT 'pos',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: pos_sale_payments

```sql
CREATE TABLE pos_sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES pos_sales(id) NOT NULL,
  method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL
);
```

### Tabla: pos_cash_events

```sql
CREATE TABLE pos_cash_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL,
  -- types: 'sale', 'cashup', 'expense', 'income'
  amount DECIMAL(10,2),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: pos_bogo_offers

```sql
CREATE TABLE pos_bogo_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_skus(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## RLS (Row Level Security)

```sql
-- pos_sales: admins pueden todo
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_pos_sales" ON pos_sales FOR ALL TO authenticated USING (auth.role() = 'authenticated');

-- pos_cash_events: admins pueden todo
ALTER TABLE pos_cash_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_pos_cash_events" ON pos_cash_events FOR ALL TO authenticated USING (auth.role() = 'authenticated');

-- pos_bogo_offers: admins pueden todo
ALTER TABLE pos_bogo_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_pos_bogo" ON pos_bogo_offers FOR ALL TO authenticated USING (auth.role() = 'authenticated');
```

---

## API Endpoints

### GET /api/pos/products

Lista productos con stock para el POS.

**Query params:**
- `search` (string) — búsqueda por nombre o SKU
- `category_id` (uuid) — filtro por categoría

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "string",
      "price": "number",
      "stock": "number",
      "image_url": "string",
      "category": { "id": "uuid", "name": "string" },
      "variants": [
        {
          "id": "uuid",
          "sku_code": "string",
          "price_override": "number | null",
          "stock": "number",
          "active": "boolean",
          "option_values": ["string"]
        }
      ]
    }
  ]
}
```

### POST /api/pos/validate

Valida productos y variantes para la venta.

**Body:**
```json
{
  "items": [
    { "product_id": "uuid", "variant_id": "uuid | null", "quantity": "number" }
  ]
}
```

**Response:**
```json
{
  "valid": "boolean",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid | null",
      "status": "valid | out_of_stock | inactive | not_found",
      "available_stock": "number",
      "unit_price": "number",
      "subtotal": "number"
    }
  ]
}
```

### POST /api/pos/sales

Crea una venta POS.

**Body:**
```json
{
  "customer_name": "string | null",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid | null",
      "name": "string",
      "sku": "string | null",
      "quantity": "number",
      "unit_price": "number",
      "discount_pct": "number",
      "subtotal": "number"
    }
  ],
  "discount_amount": "number",
  "discount_reason": "string | null",
  "subtotal": "number",
  "total": "number",
  "payment_method": "efectivo | tarjeta | transferencia | mixto",
  "amount_received": "number",
  "change_amount": "number",
  "payments": [
    { "method": "string", "amount": "number" }
  ],
  "notes": "string | null"
}
```

**Response:**
```json
{
  "success": "boolean",
  "sale": { ... },
  "error": "string | null"
}
```

### GET /api/pos/sales

Historial de ventas POS.

**Query params:**
- `from` (ISO date) — fecha inicio
- `to` (ISO date) — fecha fin
- `seller_id` (uuid) — filtro por vendedor
- `payment_method` (string) — filtro por método

**Response:**
```json
{
  "sales": [
    {
      "id": "uuid",
      "seller": { "id": "uuid", "email": "string" },
      "customer_name": "string | null",
      "items": [...],
      "total": "number",
      "payment_method": "string",
      "created_at": "ISO date"
    }
  ]
}
```

### GET /api/pos/cash-events

Movimientos de caja.

**Query params:**
- `from`, `to`, `user_id`

### POST /api/pos/cashup

Registra arqueo de caja.

**Body:**
```json
{
  "declared_amount": "number",
  "notes": "string | null"
}
```

### GET /api/pos/reports/summary

Resumen de ventas.

**Query params:**
- `from`, `to`

**Response:**
```json
{
  "total_sales": "number",
  "total_amount": "number",
  "avg_ticket": "number",
  "sales_count": "number",
  "by_payment_method": {
    "efectivo": { "count": "number", "amount": "number" },
    "tarjeta": { "count": "number", "amount": "number" },
    "transferencia": { "count": "number", "amount": "number" }
  }
}
```

### GET /api/pos/bogo-offers

Lista ofertas 2x1 activas.

### POST /api/pos/bogo-offers

Crea oferta 2x1.

**Body:**
```json
{
  "name": "string",
  "product_id": "uuid | null",
  "variant_id": "uuid | null"
}
```

---

## Frontend

### Estructura de Rutas

```
/pos
├── page.tsx                    — Punto de venta principal
└── components/
    ├── ProductSearchBar.tsx    — Búsqueda por nombre/SKU
    ├── ProductGrid.tsx         — Grilla de productos por categoría
    ├── CartPOS.tsx             — Carrito de venta
    ├── PaymentModal.tsx        — Selección de pago y vuelto
    └── ReceiptModal.tsx        — Ticket de venta

/admin/pos
├── page.tsx                    — Dashboard POS con resumen
├── sales/page.tsx              — Historial de ventas
├── cashup/page.tsx             — Arqueo de caja
└── offers/page.tsx             — Gestión ofertas 2x1
```

### Componentes — Especificaciones de Estilo

#### ProductSearchBar
```tsx
// Contenedor: bg-card rounded-lg border p-4 shadow-sm
// Input: h-12 w-full border border-input rounded-lg px-4 text-lg
// Icon: Search className="w-5 h-5 text-muted-foreground"
// Placeholder: "Buscar por nombre o SKU..."
```

#### ProductCard (en ProductGrid)
```tsx
// Card: bg-card rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition
// Imagen: aspect-square bg-muted flex items-center justify-center
// Precio: font-extrabold text-primary text-xl
// Stock: text-sm text-muted-foreground
// Botón agregar: bg-primary text-primary-foreground rounded-lg
```

#### CartPOS
```tsx
// Contenedor: bg-card rounded-xl shadow-sm border p-6
// Header: text-xl font-extrabold mb-4
// Lista items: divide-y divide-border
// Item: flex justify-between items-center py-3
// Discount input: h-10 rounded-md border border-input
// Total: text-2xl font-extrabold text-primary
```

#### PaymentModal
```tsx
// Overlay: fixed inset-0 bg-background/80 backdrop-blur-sm
// Dialog: bg-card rounded-2xl shadow-xl w-full max-w-md border
// Header: border-b p-6 text-xl font-extrabold
// Método buttons: grid grid-cols-2 gap-3
// Input monto: h-12 text-xl border-2 border-primary rounded-lg
// Vuelto: text-3xl font-extrabold text-green-600
// Confirmar: bg-primary w-full py-4 rounded-lg font-bold
```

#### ReceiptModal
```tsx
// Ticket: bg-white text-black p-6 max-w-xs mx-auto rounded
// Estilo: font-mono text-sm (para impresora 80mm)
// Botón imprimir: bg-primary rounded-lg
// Botón cerrar: border border-input rounded-lg
```

### Flujo de UI

```
┌─────────────────────────────────────────────────────────────┐
│  /pos                                                       │
│  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │ ProductSearchBar        │  │ CartPOS                  │ │
│  │ [Buscar productos...]    │  │                          │ │
│  ├─────────────────────────┤  │ Items (lista)             │ │
│  │ CategoryTabs            │  │ - Producto x 2    $XX.XXX│ │
│  │ [Todas][Ropa][Acces...] │  │ - Producto x 1    $XX.XXX│ │
│  ├─────────────────────────┤  │                          │ │
│  │ ProductGrid              │  │ ───────────────────────  │ │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ │  │ Descuento: [%____] [$___]│ │
│  │ │ Prod│ │ Prod│ │ Prod│ │  │                          │ │
│  │ └─────┘ └─────┘ └─────┘ │  │ Subtotal:      $XXX.XXX   │ │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ │  │ Descuento:      -$XX.XXX │ │
│  │ │ Prod│ │ Prod│ │ Prod│ │  │ ───────────────────────  │ │
│  │ └─────┘ └─────┘ └─────┘ │  │ TOTAL:         $XXX.XXX   │ │
│  └─────────────────────────┘  │                          │ │
│                               │ [💳 Cobrar]               │ │
│                               └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Fase 1: POS Core

### Semana 1 — Base de datos + API

1. Crear tablas: `pos_sales`, `pos_sale_payments`, `pos_cash_events`
2. Crear funciones SQL para descuento de stock
3. Implementar GET `/api/pos/products`
4. Implementar POST `/api/pos/validate`
5. Implementar POST `/api/pos/sales`
6. Implementar GET `/api/pos/sales`

### Semana 2 — Frontend POS

1. Crear ruta `/pos` con layout de dos columnas
2. ProductSearchBar con debounce (300ms)
3. ProductGrid con tabs de categorías
4. CartPOS con:
   - Lista de items con cantidad editable
   - Botón eliminar item
   - Input descuento porcentual (%)
   - Input descuento en pesos ($)
   - Cálculo automático de totales
5. PaymentModal con:
   - Métodos: efectivo, tarjeta, transferencia
   - Si efectivo: input monto recibido → cálculo vuelto
   - Si mixto: inputs para cada método
6. ReceiptModal con ticket imprimible

### Semana 3 — Integración + Detalles

1. Integrar flujo completo: búsqueda → carrito → pago → ticket
2. Validaciones de stock en tiempo real
3. Reducir stock al confirmar venta
4. Toast notifications para éxito/error
5. Botón "Nueva venta" para reset

---

## Fase 2: Ofertas 2x1

### Semana 4

1. Crear tabla `pos_bogo_offers`
2. CRUD de ofertas en `/admin/pos/offers`
3. GET `/api/pos/bogo-offers`
4. POST `/api/pos/bogo-offers`
5. Lógica en CartPOS:
   - Checkbox "2x1" por producto si hay oferta activa
   - Si qty >= 2 y hay oferta → 50% off en segundo item
6. Mostrar "OFERTA 2x1 APLICADA" en ticket

---

## Fase 3: Reporting + Arqueo

### Semana 5

1. GET `/api/pos/reports/summary`
2. GET `/api/pos/cash-events`
3. POST `/api/pos/cashup`
4. Admin `/admin/pos/sales`:
   - Tabla con filtros (fecha, método, vendedor)
   - Totales visibles
5. Admin `/admin/pos/cashup`:
   - Ver movimientos de caja del día
   - Declarar monto en mano
   - Mostrar diferencia (declarado - esperado)
   - Botón "Cerrar caja" → registra evento cashup

---

## Resumen de Fases

| Fase | Contenido | Entregable |
|------|-----------|------------|
| **1** | Tablas + API + UI POS + pago + ticket | Ventas POS funcionales |
| **2** | Ofertas 2x1 | Promociones funcionales |
| **3** | Reporting + Arqueo | Dashboard admin completo |

**Total: ~5 semanas**

---

## Decisiones de Arquitectura

1. **Venta POS es independiente de `orders` e-commerce** — Flujo completamente diferente (sin Wompi, sin email, sin shipping). Si en el futuro se quiere unificar, el campo `channel` en `pos_sales` permite filtrar.

2. **Stock se descuenta al confirmar** — Sin reserva previa. El admin tiene control total. Si necesita reversar, se hace manualmente o con endpoint futuro `/api/pos/sales/[id]/reverse`.

3. **Ticket es HTML/CSS** — Listo para imprimir en navegador. El admin guarda e imprime. No hay integración con impresoras térmicas por ahora (futura fase).

4. **Sin autenticación adicional** — Cualquier usuario con rol `administrador` tiene acceso completo al POS.

5. **Descuentos simples** — Solo porcentaje (%) o monto fijo ($). No hay cumulabilidad por ahora.

---

## Archivos a Crear/Modificar

### Nuevos archivos

```
app/pos/
├── page.tsx
└── components/
    ├── ProductSearchBar.tsx
    ├── ProductGrid.tsx
    ├── CartPOS.tsx
    ├── PaymentModal.tsx
    └── ReceiptModal.tsx

app/admin/pos/
├── page.tsx
├── sales/page.tsx
├── cashup/page.tsx
└── offers/page.tsx

app/api/pos/
├── products/route.ts
├── validate/route.ts
├── sales/route.ts
├── cash-events/route.ts
├── cashup/route.ts
├── reports/summary/route.ts
└── bogo-offers/route.ts

lib/actions/posActions.ts

supabase/
└── migrations/
    └── XXXX_create_pos_tables.sql
```

### Archivos a modificar

```
docs/SPEC.md (este archivo)
app/admin/layout.tsx (agregar link a POS)
```
