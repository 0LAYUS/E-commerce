"use client"

import Link from "next/link"
import { Package, Tag, ShoppingBag, LayoutDashboard } from "lucide-react"
import { LicenseOverlay } from "@/components/license/LicenseOverlay"
import type { MensajeResponse } from "@/lib/actions/licenseActions"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

const MENSAJE_BLOQUEADO: MensajeResponse = {
  title: "PAGO NO REGISTRADO",
  description: "Tu licencia se encuentra suspendida. Comunícate con PRIGMA para renovar tu servicio.",
  status: "suspended",
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const bloqueado = searchParams.get("bloqueado") === "si"

  if (bloqueado) {
    return <LicenseOverlay mensaje={MENSAJE_BLOQUEADO} />
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-gray-50 rounded-lg overflow-hidden border">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5"/>
            Dashboard
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <Tag className="w-5 h-5"/>
            Categorías
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <Package className="w-5 h-5"/>
            Productos
          </Link>
          <Link href="/admin/sales" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <ShoppingBag className="w-5 h-5"/>
            Ventas
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
    <div className="flex min-h-[calc(100vh-8rem)] bg-gray-50 rounded-lg overflow-hidden border">
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-2 text-gray-300">
            <LayoutDashboard className="w-5 h-5"/>
            Dashboard
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-gray-300">
            <Tag className="w-5 h-5"/>
            Categorías
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-gray-300">
            <Package className="w-5 h-5"/>
            Productos
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-gray-300">
            <ShoppingBag className="w-5 h-5"/>
            Ventas
          </div>
        </nav>
      </div>
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
