"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Tag, Package } from "lucide-react"

type BogoOffer = {
  id: string
  name: string
  product_id: string | null
  variant_id: string | null
  active: boolean
  created_at: string
  product: { id: string; name: string } | null
  variant: { id: string; sku_code: string } | null
}

export default function AdminPOSOffersPage() {
  const [offers, setOffers] = useState<BogoOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newOffer, setNewOffer] = useState({ name: "", product_id: "", variant_id: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    try {
      const res = await fetch("/api/pos/bogo-offers")
      const data = await res.json()
      setOffers(data.offers || [])
    } catch (err) {
      console.error("Error loading offers:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/pos/bogo-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOffer.name,
          product_id: newOffer.product_id || undefined,
          variant_id: newOffer.variant_id || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error("Error al crear oferta")
      }

      setNewOffer({ name: "", product_id: "", variant_id: "" })
      setShowForm(false)
      loadOffers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await fetch("/api/pos/bogo-offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      })
      loadOffers()
    } catch (err) {
      console.error("Error toggling offer:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta oferta?")) return

    try {
      await fetch(`/api/pos/bogo-offers?id=${id}`, { method: "DELETE" })
      loadOffers()
    } catch (err) {
      console.error("Error deleting offer:", err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/pos" className="p-2 hover:bg-accent rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold text-foreground">Ofertas 2x1</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Oferta
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">Crear Oferta 2x1</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Nombre de la Oferta</label>
              <input
                type="text"
                value={newOffer.name}
                onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                placeholder="Ej: 2x1 en Remeras"
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">Producto (opcional)</label>
                <input
                  type="text"
                  value={newOffer.product_id}
                  onChange={(e) => setNewOffer({ ...newOffer, product_id: e.target.value })}
                  placeholder="ID del producto o vacío para todos"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">Variante (opcional)</label>
                <input
                  type="text"
                  value={newOffer.variant_id}
                  onChange={(e) => setNewOffer({ ...newOffer, variant_id: e.target.value })}
                  placeholder="ID de variante o vacío"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Si no especificas producto ni variante, la oferta aplica a todos los productos.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-6 py-2 rounded-lg font-semibold"
              >
                {isSubmitting ? "Creando..." : "Crear Oferta"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-input hover:bg-accent px-6 py-2 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay ofertas 2x1 configuradas</p>
          <p className="text-sm">Crea una oferta para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div key={offer.id} className={`bg-card rounded-xl border p-6 ${!offer.active ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">{offer.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {offer.product ? offer.product.name : "Todos los productos"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(offer.id, offer.active)}
                  className={`w-12 h-6 rounded-full transition relative ${
                    offer.active ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition ${
                      offer.active ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {offer.variant ? `Variante: ${offer.variant.sku_code}` : "Todas las variantes"}
                </p>
                <button
                  onClick={() => handleDelete(offer.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
