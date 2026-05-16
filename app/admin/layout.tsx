"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Package, Tag, ShoppingBag, LayoutDashboard, Users, ShoppingCart, Truck, ListOrdered } from "lucide-react"
import { SignOut } from "@phosphor-icons/react"
import { LicenseOverlay } from "@/components/license/LicenseOverlay"
import type { MensajeResponse } from "@/types/license.types"
import { Suspense } from "react"
import { logout } from "@/lib/actions/authActions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const MENSAJE_BLOQUEADO: MensajeResponse = {
  title: "PAGO NO REGISTRADO",
  description: "Tu licencia se encuentra suspendida. Comunícate con PRIGMA para renovar tu servicio.",
  status: "suspended",
}

const SIDEBAR_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/categories", label: "Categorías", icon: Tag },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/sales", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/orders", label: "Órdenes", icon: ListOrdered },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/pos", label: "Ventas POS", icon: ShoppingBag },
  { href: "/admin/shipping", label: "Envíos", icon: Truck },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname.startsWith(href)
}

function SidebarLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <Button asChild variant={active ? "default" : "ghost"} className="w-full justify-start">
      <Link href={href} className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" />
        {label}
      </Link>
    </Button>
  )
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const bloqueado = searchParams.get("bloqueado") === "si"

  if (bloqueado) {
    return <LicenseOverlay mensaje={MENSAJE_BLOQUEADO} />
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-secondary rounded-lg overflow-hidden border">
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-sm border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {SIDEBAR_ITEMS.map((item) => (
            <SidebarLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
              <SignOut className="w-5 h-5 mr-3" />
              Salir
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  )
}

function SidebarSkeleton() {
  const ICONS = [LayoutDashboard, Tag, Package, ShoppingBag, ShoppingCart, ShoppingBag, Truck]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-secondary rounded-lg overflow-hidden border">
      <div className="w-64 bg-card shadow-sm border-r border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          {ICONS.map((Icon, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
              <Icon className="w-5 h-5" />
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            </div>
          ))}
        </nav>
      </div>
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  )
}
