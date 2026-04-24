"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, RotateCcw, X } from "lucide-react"
import { unarchiveProduct } from "@/lib/actions/productActions"
import { AlertDialog, ConfirmDialog } from "@/components/ui/modal"

type ArchivedProduct = {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  categories?: { name: string }
}

export default function ArchivedProductsGrid({ products }: { products: ArchivedProduct[] }) {
  const router = useRouter()
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: "", description: "" })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null)

  const handleUnarchive = async () => {
    if (!confirmTarget) return

    setUnarchivingId(confirmTarget.id)
    try {
      await unarchiveProduct(confirmTarget.id)
      router.refresh()
    } catch (err) {
      setAlertConfig({ title: "Error al restaurar", description: String(err) })
      setAlertOpen(true)
    } finally {
      setUnarchivingId(null)
      setConfirmTarget(null)
    }
  }

  const openUnarchiveConfirm = (id: string, name: string) => {
    setConfirmTarget({ id, name })
    setConfirmOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 mt-4 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin/products" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          Productos Archivados
        </h1>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2"
        >
          <X className="w-4 h-4" /> Cerrar
        </Link>
      </div>

      {/* Info banner */}
      <div className="bg-muted/50 border rounded-lg p-4 mb-8">
        <p className="text-sm text-muted-foreground">
          Los productos archivados no son visibles en la tienda. Puedes restaurarlos cuando lo desees.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((p) => (
          <div key={p.id} className="bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col opacity-60">
            <div className="aspect-[4/3] bg-muted flex items-center justify-center p-6 border-b border-border relative">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain mix-blend-multiply grayscale" />
              ) : (
                <span className="text-xs text-muted-foreground font-mono">IMG</span>
              )}
              <span className="absolute top-2 right-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                Archivado
              </span>
            </div>

            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-card-foreground mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 flex-grow line-clamp-2">{p.description}</p>

              <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Categoría: <span className="text-foreground">{p.categories?.name || "N/A"}</span>
              </div>

              <div className="font-extrabold text-primary text-xl mb-4">
                {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(p.price)}
              </div>

              <button
                onClick={() => openUnarchiveConfirm(p.id, p.name)}
                disabled={unarchivingId === p.id}
                className="w-full flex justify-center items-center gap-2 py-2 border border-input rounded-lg text-sm font-bold hover:bg-accent transition disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {unarchivingId === p.id ? "Restaurando..." : "Restaurar"}
              </button>
            </div>
          </div>
        ))}

        {(!products || products.length === 0) && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
            No hay productos archivados.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setConfirmTarget(null)
        }}
        onConfirm={handleUnarchive}
        title="¿Restaurar producto?"
        description={confirmTarget ? `¿Deseas restaurar el producto "${confirmTarget.name}"? Volverá a estar activo en la tienda.` : ""}
        confirmText="Restaurar"
        cancelText="Cancelar"
      />

      <AlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertConfig.title}
        description={alertConfig.description}
      />
    </div>
  )
}
