# AGENTS.md — E-commerce Project

## Stack
- Next.js 15 (App Router) + React 19
- Supabase (auth, DB, SSR)
- Tailwind CSS + shadcn/ui (style: `new-york`, RSC enabled)
- Vitest for tests

## Dev Commands
```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # eslint
npm run test     # vitest (watch)
npm run test:run # vitest single run
```

## Git Workflow
- `main` → stable, never push directly
- `staging` → integration branch, always branch from here
- Prefix: `feature/` or `fix/`
- Branch: `git checkout staging && git pull && git checkout -b feature/your-feature`

## Path Aliases (@/)
Configured in `tsconfig.json`:
- `@/components/*` → `components/`
- `@/lib/*` → `lib/`
- `@/hooks/*` → `hooks/`
- `@/components/ui/*` → `components/ui/`

## Architecture
- **Pages** (`app/**/page.tsx`): Server Components by default
- **Interactive components** (`components/**/*.tsx`): `"use client"` directive
- **Server Actions**: `lib/actions/*.ts`
- **Types**: `types/*.ts`
- **Utils**: `lib/utils.ts`, `lib/format.ts`
- **Icons**: Lucide React + Phosphor Icons

## Product Components (`components/products/`)
- **Container/Orchestrator**: `ProductGrid.tsx` — manages state, filtering, search, delegates to child components
- **Presentational**: `ProductCard.tsx`, `ProductSearch.tsx`, `ProductCategoryFilter.tsx`, `ProductEmptyState.tsx` — receive props, no business logic
- **Feature**: `ProductImageGallery.tsx`, `ProductVariantSelector.tsx`, `AddToCartButton.tsx`, `RelatedProductsCarousel.tsx` — self-contained interactive features
- **Reusable UI**: `PriceDisplay.tsx`, `QuantitySelector.tsx` — shared across multiple components
- **Tests**: co-located `*.test.tsx` (e.g., `ProductVariantSelector.test.tsx`)
- **Types**: domain types (`Product`, `SKU`, `Category`, `GalleryImage`, `OptionDef`) in `types/product.types.ts`; component `Props` types stay local
- **Rules**: always use shadcn/ui (`Button`, `Badge`, `Input`, `Alert`), `next/image` for images, `lib/format.ts` for currency/stock formatting, never hardcode colors or magic numbers

## shadcn/ui Components
- Source: `components/ui/`
- Config: `components.json`
- Add: `npx shadcn@latest add <component>`
- Reusable: Modal/AlertDialog/ConfirmDialog → `components/ui/modal.tsx`

## CSS / Design System
- CSS variables in `app/globals.css` (e.g. `--primary`, `--color-primary`)
- **Always use CSS variables** — never hardcode colors
- Design tokens in `docs/SPEC.md`

## Code Conventions
- All code, comments, files in **English**
- `camelCase` for variables/functions, `PascalCase` for components/types
- SOLID principles apply
- Document non-obvious logic with comments

## Key Flows
- **Cart validation**: `POST /api/cart/validate` → stock + price checks
- **Stock reservation**: `POST /api/cart/reserve` (15min hold on `/checkout`)
- **POS**: `app/pos/page.tsx` + `app/admin/pos/*`
- **Wompi webhook**: `POST /api/webhooks/wompi` (payment confirmation)

## Existing Instruction Files
- `RULES.md` — development rules, git workflow, conventions
- `docs/SPEC.md` — POS system spec, data models, API endpoints
- `docs/cart-validation-system.md` — stock reservation phases

## Testing
- Vitest with jsdom + `@testing-library/react` + `@testing-library/user-event`
- Test files: `*.test.ts` or `*.test.tsx` co-located
- Run single test: `npm run test:run -- path/to/test.test.ts`