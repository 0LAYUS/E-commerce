# E-Commerce Project

Este repositorio contiene la plataforma de e-commerce y el sistema POS (Point of Sale) para administración interna.

**⚠️ ALTO AHÍ. NO EMPIECES A TIRAR CÓDIGO A LO CIEGO.**

Toda la documentación técnica, reglas de arquitectura, convenciones de despliegue y manejo de la base de datos se encuentra en la carpeta `docs/`. Si sos un dev nuevo (o una IA), es **obligatorio** que leas esos archivos antes de proponer cualquier cambio.

## Documentación Principal (`docs/`)

- [project-context.md](docs/project-context.md): La arquitectura del proyecto, estructura de carpetas (`features/`, `shared/`) y reglas de código.
- [deploy.md](docs/deploy.md): Instrucciones críticas sobre Cloudflare Workers/Pages y la versión congelada de Next.js (15.4.6).
- [supabase.md](docs/supabase.md): Reglas estrictas sobre migraciones de base de datos y replicabilidad del entorno.
- [SPEC.md](docs/SPEC.md): Especificaciones del sistema POS y convenciones UI.
- [cart-validation-system.md](docs/cart-validation-system.md): Flujo detallado de la validación y reserva de stock del carrito de compras.

## Tecnologías

- **Frontend:** Next.js 15.4.6 (App Router), React 19, Tailwind CSS, shadcn/ui.
- **Backend/DB:** Supabase (Auth, PostgreSQL, Storage).
- **Despliegue:** Cloudflare (Workers & Pages) vía `@opennextjs/cloudflare`.

## Comandos Rápidos

```bash
npm run dev      # Iniciar servidor de desarrollo local
npm run cf-dev   # Probar build de Cloudflare en local (Wrangler)
npm run lint     # Linter
npm run test     # Correr tests (Vitest)
npm run deploy   # Desplegar a Cloudflare
```

Cualquier cambio a la base de datos debe hacerse mediante **migraciones** (`npx supabase migration new ...`). No toques nada desde el dashboard de Supabase si querés mantener el proyecto replicable.
