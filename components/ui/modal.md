# Modal Components

Componentes de modal reutilizables para el proyecto E-commerce.

## Instalación

Ya disponible en `@/components/ui/modal`:

```ts
import { Modal, AlertDialog, ConfirmDialog } from "@/components/ui/modal"
```

---

## Componentes

### 1. Modal — Shell genérico

Componente base con overlay, scroll blocking, y animaciones. Recibe `children`.

```tsx
import { Modal } from "@/components/ui/modal"

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  showCloseButton={true}
  preventCloseOnOverlayClick={false}
>
  <div className="p-4">
    <h2>Título</h2>
    <p>Contenido libre...</p>
  </div>
</Modal>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controla visibilidad |
| `onClose` | `() => void` | — | Callback al cerrar |
| `children` | `ReactNode` | — | Contenido del modal |
| `className` | `string` | — | Clases adicionales |
| `showCloseButton` | `boolean` | `true` | Mostrar botón X |
| `preventCloseOnOverlayClick` | `boolean` | `false` | Evitar cerrar al hacer click en overlay |

**Características:**
- ✅ Bloquea scroll del body
- ✅ Cierra con tecla Escape
- ✅ Animaciones suaves (fade + zoom)
- ✅ Soporte para texto largo (`max-h-[90vh] overflow-y-auto`)
- ✅ Usa tokens de color del theme (`bg-card`, `border`, etc.)

---

### 2. AlertDialog — Un solo botón

Reemplaza `window.alert()`. Mensaje con un solo botón de confirmación.

```tsx
import { AlertDialog } from "@/components/ui/modal"

const [alertOpen, setAlertOpen] = useState(false)

<AlertDialog
  open={alertOpen}
  onClose={() => setAlertOpen(false)}
  title="Producto agregado"
  description="El producto se agregó correctamente al carrito."
  acceptText="Aceptar"
  acceptVariant="default"
/>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controla visibilidad |
| `onClose` | `() => void` | — | Callback al cerrar |
| `title` | `string` | — | Título del modal |
| `description` | `string` | — | Mensaje (soporta `\n` para saltos de línea) |
| `acceptText` | `string` | `"Aceptar"` | Texto del botón |
| `acceptVariant` | `ButtonProps["variant"]` | `"default"` | Variante del botón |
| `onAccept` | `() => void` | — | Callback opcional al aceptar |

---

### 3. ConfirmDialog — Dos botones

Reemplaza `window.confirm()`. Confirmación con aceptar y cancelar.

```tsx
import { ConfirmDialog } from "@/components/ui/modal"

const [confirmOpen, setConfirmOpen] = useState(false)

<ConfirmDialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={() => eliminarItem(id)}
  title="¿Eliminar producto?"
  description="Esta acción no se puede deshacer."
  confirmText="Eliminar"
  cancelText="Cancelar"
  destructive
/>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controla visibilidad |
| `onClose` | `() => void` | — | Callback al cerrar |
| `onConfirm` | `() => void` | — | Callback al confirmar |
| `title` | `string` | — | Título del modal |
| `description` | `string` | — | Mensaje (soporta `\n` para saltos de línea) |
| `confirmText` | `string` | `"Aceptar"` | Texto del botón confirmar |
| `cancelText` | `string` | `"Cancelar"` | Texto del botón cancelar |
| `showCancel` | `boolean` | `true` | Mostrar botón cancelar |
| `confirmVariant` | `ButtonProps["variant"]` | `"default"` | Variante del botón confirmar |
| `destructive` | `boolean` | `false` | Si es true, usa variante `destructive` (rojo) |

---

## Ejemplo completo con estado

```tsx
"use client"

import { useState } from "react"
import { ConfirmDialog, AlertDialog } from "@/components/ui/modal"

export default function MiComponente() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const handleEliminar = () => {
    // lógica de eliminación
    console.log("Eliminado!")
    setAlertOpen(true) // mostrar confirmación
  }

  return (
    <>
      <button onClick={() => setConfirmOpen(true)}>
        Eliminar
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleEliminar}
        title="¿Estás seguro?"
        description="Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        destructive
      />

      <AlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Eliminado"
        description="El producto se eliminó correctamente."
      />
    </>
  )
}
```

---

## Tokens de color usados

Los componentes usan las variables CSS del theme:

| Token | Variable CSS |
|-------|--------------|
| Fondo | `--card` |
| Texto | `--card-foreground` |
| Texto secundario | `--muted-foreground` |
| Borde | `--border` |
| Overlay | `black/50` |

---

## Notas

- Todos los textos están en español por defecto
- El scroll del body se bloquea automáticamente al abrir
- Soporta texto largo con scroll interno (`max-h-[90vh]`)
- Usa animaciones de `tailwindcss-animate`
