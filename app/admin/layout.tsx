"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Tag, ShoppingBag, LayoutDashboard, Users, ShoppingCart } from "lucide-react"
import { LicenseOverlay } from "@/components/license/LicenseOverlay"
import type { MensajeResponse } from "@/types/license.types"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

const MENSAJE_BLOQUEADO: MensajeResponse = {
  title: "PAGO NO REGISTRADO",
  description: "Tu licencia se encuentra suspendida. Comunícate con PRIGMA para renovar tu servicio.",
  status: "suspended",
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const bloqueado = searchParams.get("bloqueado") === "si"

  if (bloqueado) {
    return <LicenseOverlay mensaje={MENSAJE_BLOQUEADO} />
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-secondary rounded-lg overflow-hidden border">
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-sm border-r border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/admin") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <LayoutDashboard className="w-5 h-5"/>
            Dashboard
          </Link>
          <Link href="/admin/users" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/admin/users") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <Users className="w-5 h-5"/>
            Usuarios
          </Link>
          <Link href="/admin/categories" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/admin/categories") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <Tag className="w-5 h-5"/>
            Categorías
          </Link>
          <Link href="/admin/products" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/admin/products") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <Package className="w-5 h-5"/>
            Productos
          </Link>
          <Link href="/admin/sales" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/admin/sales") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <ShoppingBag className="w-5 h-5"/>
            Ventas
          </Link>
          <Link href="/pos" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/pos") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <ShoppingCart className="w-5 h-5"/>
            POS
          </Link>
          <Link href="/admin/pos" className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${isActive("/admin/pos") ? "bg-primary/10 text-primary font-medium" : ""}`}>
            <ShoppingBag className="w-5 h-5"/>
            Ventas POS
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  )
}

function AdminContentFallback() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-secondary rounded-lg overflow-hidden border">
      <div className="w-64 bg-card shadow-sm border-r border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
            <LayoutDashboard className="w-5 h-5"/>
            Dashboard
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
            <Tag className="w-5 h-5"/>
            Categorías
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
            <Package className="w-5 h-5"/>
            Productos
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
            <ShoppingBag className="w-5 h-5"/>
            Ventas
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
            <ShoppingCart className="w-5 h-5"/>
            POS
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
            <ShoppingBag className="w-5 h-5"/>
            Ventas POS
          </div>
        </nav>
      </div>
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminContentFallback />}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  )
}
