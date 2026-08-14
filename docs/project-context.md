# Contexto y Arquitectura del Proyecto E-commerce

Este documento es la **ÚNICA FUENTE DE VERDAD** para la estructura, convenciones y arquitectura base de este proyecto. Léelo, entendelo y NO LO IGNORES.

## Tecnologías Principales

- **Framework:** Next.js 15.4.6 (App Router) + React 19.
  - ⚠️ **CRÍTICO:** NO ACTUALIZAR esta versión sin antes verificar compatibilidad con `@cloudflare/next-on-pages` u OpenNext. Cloudflare Workers es muy sensible a cambios de versión de Next.js.
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage). Todo pasa por los SDKs de Supabase (`@supabase/ssr` y `@supabase/supabase-js`).
- **UI:** Tailwind CSS + shadcn/ui. (Tema `new-york`, RSC activado).
- **Testing:** Vitest.

## Estructura de Directorios y Arquitectura

El proyecto está dividido siguiendo un patrón Feature-Sliced y de separación de responsabilidades estricto.

### 1. Features (`src/features/*/`)
Aquí vive la lógica de negocio real. Cada feature (ej. `pos`, `cart`, `products`, `orders`) está contenida y exporta solo lo necesario.
Dentro de cada feature vas a encontrar:
- `actions/`: Server Actions para mutaciones.
- `components/`: Componentes específicos de la feature.
- `hooks/`: Hooks de React específicos.
- `repositories/`: Lógica de acceso a datos (queries a Supabase).
- `services/`: Lógica de negocio pura o validaciones.
- `types/`: Tipos de dominio.

### 2. Shared (`src/shared/*/`)
Código que se usa a lo largo de múltiples features pero que no pertenece a ninguna en particular.
- `components/`: Layouts globales (Navbar, Footer, Providers).
- `hooks/`: Hooks genéricos.
- `utils/`: Utilidades compartidas (`format.ts`, etc.).
- `types/`: Tipos globales o compartidos.

### 3. Presentación y Enrutamiento (`app/` y `components/`)
- `app/`: Exclusivamente Server Components encargados del ruteo y composición principal.
- `components/`: Componentes interactivos (`"use client"`) y reutilizables.
  - `components/ui/`: Componentes base de shadcn/ui. NO LOS REINVENTES.
  - `components/products/`, `components/branding/`, etc.: Revisa siempre antes de crear un componente nuevo.

### 4. Branding
El sistema maneja dos identidades:
- **PRIGMA (Plataforma):** Logos, licencias, footer del admin. Configurado en `lib/constants/branding-prigma.ts`.
- **Store Brand (Cliente):** La tienda visible al público. Configurado en `lib/constants/branding-store.ts`.

## Reglas de Oro
1. **CONVENCIONES SOBRE CREATIVIDAD:** Sigue los patrones existentes. Si necesitas un botón, usa el de shadcn. Si necesitas un modal, usa `components/ui/modal.tsx`. No inventes la rueda.
2. **SOLID y Clean Code:** Código en inglés. Separa la vista de la lógica. Usa inyección de dependencias si es necesario. No pongas lógica de acceso a datos en el medio de la vista.
