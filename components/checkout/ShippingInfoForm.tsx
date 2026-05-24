"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ShippingZone } from "@/features/cart/types/cart.types"
import { formatPrice } from "@/lib/format"

type ShippingInfoFormProps = {
  zones: ShippingZone[]
  nombre: string
  email: string
  direccion: string
  selectedZoneId: string | null
  onNombreChange: (v: string) => void
  onDireccionChange: (v: string) => void
  onZoneChange: (v: string | null) => void
}

export function ShippingInfoForm({
  zones,
  nombre,
  email,
  direccion,
  selectedZoneId,
  onNombreChange,
  onDireccionChange,
  onZoneChange,
}: ShippingInfoFormProps) {
  return (
    <>
      <h2 className="text-xl font-bold text-card-foreground mb-6">Información de Envío</h2>

      <div className="space-y-5 mb-10">
        <div>
          <Label htmlFor="shipping-name">Nombre Completo</Label>
          <Input
            id="shipping-name"
            type="text"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            required
            placeholder="Nombre"
          />
        </div>
        <div>
          <Label htmlFor="shipping-email">Email</Label>
          <Input id="shipping-email" type="email" value={email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">Email de tu cuenta</p>
        </div>
        <div>
          <Label htmlFor="shipping-zone">Ciudad de Envío</Label>
          <select
            id="shipping-zone"
            value={selectedZoneId || ""}
            onChange={(e) => onZoneChange(e.target.value || null)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecciona una ciudad</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
                {zone.free_threshold > 0 ? ` (Gratis desde ${formatPrice(zone.free_threshold)})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="shipping-address">Dirección de Envío</Label>
          <textarea
            id="shipping-address"
            rows={3}
            value={direccion}
            onChange={(e) => onDireccionChange(e.target.value)}
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Calle, ciudad, código postal, país"
          />
        </div>
      </div>
    </>
  )
}
