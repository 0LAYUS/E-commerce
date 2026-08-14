# Security Remediation Plan — E-commerce PRIGMA

This document outlines the step-by-step technical implementation plan to resolve the critical and high-severity vulnerabilities identified in the security audit report. Developers should follow these phases sequentially to secure the application.

## Phase 1: Middleware & Edge Protection (Critical)

Currently, the application lacks active route protection because `middleware.ts` does not exist at the project root, leaving `/admin` and `/api` routes exposed.

### 1.1 Create `middleware.ts`
Create `middleware.ts` in the root of the project (`/home/christian/Documents/E-commerce/middleware.ts`).

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-client'

export async function middleware(request: NextRequest) {
  // 1. Refreshes auth cookies and creates base session response
  const response = await updateSession(request)

  // 2. Protection logic for Admin Routes and APIs
  const pathname = request.nextUrl.pathname
  
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // You should integrate the role-checking logic from proxy.ts here.
    // Ensure that unauthenticated or non-admin users are redirected to /login or receive a 401.
    // Example conceptual check:
    const cookieHeader = request.headers.get('cookie') || ''
    if (!cookieHeader.includes('sb-access-token')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```
*Note: Make sure to review the existing `proxy.ts` and migrate its license and role check logic into this middleware or the appropriate layouts.*

## Phase 2: Server Actions Security (Critical)

Administrative Server Actions are currently unauthenticated, allowing privilege escalation and unauthorized data mutations.

### 2.1 Create an Authentication Guard Helper
Create a reusable helper in `lib/auth-guards.ts` (or similar utility file) to securely verify admin privileges:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("No autenticado")
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
    
  if (profile?.role !== "administrador") {
    throw new Error("No autorizado")
  }
  
  return user
}
```

### 2.2 Apply to Vulnerable Server Actions
Import and call `await requireAdmin()` at the very beginning of the following administrative Server Actions:

- **`src/features/auth/actions/authActions.ts`**: `updateUserRole`, `getUserDetails`, `getAllUsers`
- **`src/features/admin/actions/adminActions.ts`**: `createCategory`, `updateCategory`, `deleteCategory`, `getDashboardMetrics`, etc.
- **`src/features/orders/actions/orderActions.ts`**: `updateOrderStatus`, `rollbackOrderStock`, `markOrderAsError`, `approveManualOrder`, `cancelManualOrder`
- **`src/features/products/actions/productActions.ts`**: `createProduct`, `updateProduct`, `deleteProduct`, `archiveProduct`
- **`src/features/work-orders/actions/workOrderActions.ts`**: `createWorkOrder`, `updateWorkOrderStatus`, `closeWorkOrderAndBill`

## Phase 3: API Route Protection (High)

Directly accessible API endpoints expose PII and critical business logic.

### 3.1 Protect User Data & Order Exports
Add the `requireAdmin()` check inside the `GET` handlers of these routes to block unauthenticated curl requests:
- `/app/api/users/route.ts`
- `/app/api/orders/export/route.ts`

```typescript
// Example for API route protection:
import { requireAdmin } from '@/lib/auth-guards'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch (error) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  // ... original logic
}
```

### 3.2 Secure the Maintenance Cron Job
Modify `/app/api/cron/maintenance/route.ts` to require a secret token, preventing DoS attacks and unauthorized stock modifications.

```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // ... original cron logic
}
```

## Phase 4: Hardening & Config (Medium)

Enhance security posture against common web vulnerabilities and fix configuration weaknesses.

### 4.1 Implement Security Headers
Modify `next.config.ts` to include strict HTTP response headers:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
  // ... rest of config
}
export default nextConfig
```

### 4.2 Pin Dependencies
Update `package.json` to lock `@supabase/ssr` and `@supabase/supabase-js` to explicit stable versions instead of `"latest"` to prevent unexpected build breaks. Run:
```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest --save-exact
```

### 4.3 Remove PII from Logs
Audit and remove `console.log` statements exposing `customerEmail` and email `to` addresses from:
- `src/features/orders/services/orderConfirmation.ts`
- `src/features/work-orders/services/resend-notification.adapter.ts`
