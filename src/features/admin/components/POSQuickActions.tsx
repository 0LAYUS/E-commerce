"use client"

import Link from "next/link"
import { DollarSign, TrendingUp, ShoppingCart } from "lucide-react"

export default function POSQuickActions() {
  return (
    <div className="flex gap-3">
      <Link
        href="/admin/pos/cashup"
        className="flex-1 p-4 border border-input rounded-xl hover:bg-accent transition text-center"
      >
        <DollarSign className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="font-semibold">Arqueo de Caja</p>
        <p className="text-xs text-muted-foreground">Cerrar y cuadrar caja</p>
      </Link>
      <Link
        href="/admin/pos/offers"
        className="flex-1 p-4 border border-input rounded-xl hover:bg-accent transition text-center"
      >
        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="font-semibold">Ofertas 2x1</p>
        <p className="text-xs text-muted-foreground">Gestionar promociones</p>
      </Link>
      <Link
        href="/pos"
        className="flex-1 p-4 border border-input rounded-xl hover:bg-accent transition text-center"
      >
        <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="font-semibold">Nueva Venta</p>
        <p className="text-xs text-muted-foreground">Abrir punto de venta</p>
      </Link>
    </div>
  )
}
