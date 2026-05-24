"use client"

import { Truck, Pencil, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { Button } from "@/components/ui/button"
import type { ShippingZone } from "@/features/cart/types/cart.types"

type ShippingZoneCardProps = {
  zone: ShippingZone
  onEdit: (zone: ShippingZone) => void
  onDelete: (id: string, name: string) => void
}

export default function ShippingZoneCard({ zone, onEdit, onDelete }: ShippingZoneCardProps) {
  return (
    <div
      className={`bg-card rounded-xl shadow-sm border p-5 flex flex-col hover:shadow-md transition ${
        !zone.active ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5" />
        </div>
        <div className="flex gap-0.5 text-muted-foreground">
          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(zone)} title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onDelete(zone.id, zone.name)} className="hover:text-destructive" title="Eliminar">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <h3 className="text-base font-bold text-card-foreground mb-2">{zone.name}</h3>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Costo de envío:</span>
          <span className="font-semibold text-foreground">{formatPrice(zone.cost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Envío gratis desde:</span>
          <span className="font-semibold text-foreground">
            {zone.free_threshold > 0 ? formatPrice(zone.free_threshold) : "No disponible"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            zone.active
              ? "bg-success-muted text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {zone.active ? "Activa" : "Inactiva"}
        </span>
      </div>
    </div>
  )
}
