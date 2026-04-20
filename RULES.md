# Development Rules — E-commerce Project

These rules apply to ALL development work on this project. Reference for every developer and AI agent.

---

## 1. Before Implementing Anything

- **Always ask first.** Before adding a new feature, modifying existing logic, or changing the project structure, describe what you plan to do and wait for explicit confirmation.
- **Check if it already exists.** Before creating any component, function, hook, service, or visual element, search the project for something similar. If it exists, use it or extend it — never duplicate.
- **Clarify scope.** If a task is ambiguous, ask for clarification before generating code.

---

## 2. Git Workflow

- `main` → stable production. Never push directly here.
- `staging` → integration and testing. Never work directly here.
- Always create a new branch from `staging`:
  ```bash
  git checkout staging && git pull
  git checkout -b feature/your-feature-name
  ```
- Use prefixes: `feature/` for new features, `fix/` for bug fixes.
- Keep your branch updated with `staging` regularly.
- Merge back to `staging` only after verifying the code works and resolving any conflicts.
- Only validated changes in `staging` are merged into `main`.

---

## 3. Visual Consistency and Aesthetics

- **Use color variables.** Always use the project's CSS variables or design tokens (e.g. `--color-primary`). Never hardcode colors.
- **Reuse visual components.** Before adding a button, card, modal, icon, or any visual element, verify it doesn't already exist in the project. If it does, use it directly. Available UI:
  - **Modal, AlertDialog, ConfirmDialog** → `components/ui/modal.tsx`
- **Match the existing design.** Spacing, typography, borders, and shadows must follow the established system. Changes should be indistinguishable from the rest of the UI.

---

## 4. Code Quality

- **All code in English.** Variables, functions, comments, file names, and commit messages must be written in English.
- **Clear, descriptive names.** Use `camelCase` for variables and functions. Avoid ambiguous abbreviations. The name should describe the intent, not the implementation.
- **Comment the code.** Document non-obvious logic, parameters of important functions, side effects, and design decisions that aren't self-evident.
- **Separation of concerns.** Each module, component, or function must have a single reason to change. Separate business logic, presentation, and data access.

---

## 5. SOLID Principles

- **S — Single Responsibility:** Each class, component, or function must have one well-defined responsibility.
- **O — Open/Closed:** Code should be open for extension but closed for modification. Prefer composition over editing existing code.
- **L — Liskov Substitution:** Abstractions must be substitutable by their implementations without altering expected behavior.
- **I — Interface Segregation:** Define small, specific interfaces. Don't force a module to depend on methods it doesn't use.
- **D — Dependency Inversion:** Depend on abstractions, not concrete implementations.

---

## Quick Reference

| ❌ Don't | ✅ Do |
|---|---|
| Push directly to `main` | Use `feature/*` or `fix/*` branches |
| Work directly on `staging` | Always branch from `staging` |
| Hardcode colors | Use design system variables |
| Duplicate components | Check for existing ones first |
| Write code in Spanish | All code in English |
| Implement without confirming | Ask before any change |
| Write code without understanding | Learn the fundamentals first |
| Use magic values | Define constants with meaningful names |
| Create utilities in components | Extract to shared utils/hooks |
| Ignore performance | Think about scalability |

---

## Stack Conventions

### Frontend
- **Framework:** Next.js (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **State:** Server Components + Server Actions preferred over client state
- **Charts:** Custom Tailwind + SVG (no heavy libraries)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Server Actions:** `lib/actions/*.ts`

### Code Patterns
- **Server Components:** `app/**/page.tsx`, `app/**/layout.tsx`
- **Client Components:** `components/**/*.tsx` with `"use client"` directive
- **Server Actions:** `lib/actions/*.ts`
- **Types:** `types/*.ts` for shared type definitions
- **Utils:** `lib/utils.ts` for helper functions

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Pages | kebab-case | `user-profile.tsx` |
| Server Actions | camelCase | `getUserById.ts` |
| Types | PascalCase | `User.types.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Hooks | camelCase | `useDebounce.ts` |

---

## Commit Message Convention

Use Conventional Commits format:

```
<type>(<scope>): <subject>

<body>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(dashboard): add revenue metric card
fix(categories): prevent delete with active products
refactor(auth): extract role validation to utility
```

---

*Last updated: 2026-04-19*
