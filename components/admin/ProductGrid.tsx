"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, Plus, Upload, X, Archive } from "lucide-react"
import { createProduct, updateProduct, deleteProduct, getProductOptions, getProductVariants, toggleProductActive, hasSales } from "@/lib/actions/productActions"
import ProductVariantsEditor from "./ProductVariantsEditor"
import ToggleSwitch from "@/components/ui/ToggleSwitch"
import { AlertDialog, ConfirmDialog } from "@/components/ui/modal"

type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  image_url: string
  active?: boolean
  categories?: { name: string }
}

export default function ProductGrid({ products, categories }: { products: Product[], categories: any[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loadingVariants, setLoadingVariants] = useState(false)

  // Variant state - managed by ProductVariantsEditor
  const [hasVariants, setHasVariants] = useState(false)
  const [variantOptions, setVariantOptions] = useState<{ name: string; values: string[] }[]>([])
  const [variantStocks, setVariantStocks] = useState<{ id: string; sku_code: string; stock: number; active: boolean; price_override: number | null }[]>([])
  const [newProductStock, setNewProductStock] = useState(0)
  const [productActive, setProductActive] = useState(true)

  // Total stock from variants (only active ones)
  const totalVariantStock = variantStocks.reduce((sum, v) => sum + (v.active ? v.stock : 0), 0)

  // Dialog states
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: "", description: "" })
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const openNewModal = () => {
    setEditingProduct(null)
    setPreviewImage(null)
    setHasVariants(false)
    setVariantOptions([])
    setVariantStocks([])
    setNewProductStock(0)
    setProductActive(true)
    setModalOpen(true)
  }

  const openEditModal = async (product: Product) => {
    setEditingProduct(product)
    setPreviewImage(product.image_url)
    setProductActive(product.active ?? true)
    setLoadingVariants(true)
    setModalOpen(true)

    try {
      const [options, variants] = await Promise.all([
        getProductOptions(product.id),
        getProductVariants(product.id),
      ])
      setHasVariants(options.length > 0)
      setVariantOptions(options)
      setVariantStocks(variants.map((v: any) => ({
        id: v.id,
        sku_code: v.sku_code || "",
        stock: v.stock,
        active: v.active ?? true,
        price_override: v.price_override ?? null,
        option_values: v.option_values || []
      })))
    } catch (err) {
      console.error("Error loading variants:", err)
    } finally {
      setLoadingVariants(false)
    }
  }

  const closeModal = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage)
    }
    setModalOpen(false)
    setTimeout(() => {
      setEditingProduct(null)
      setPreviewImage(null)
      setHasVariants(false)
      setVariantOptions([])
      setVariantStocks([])
    }, 300)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
      }
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleHasVariantsChange = (value: boolean) => {
    setHasVariants(value)
    if (value && variantOptions.length === 0) {
      setVariantOptions([{ name: "", values: [] }])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      const hasVariantsVal = formData.get("has_variants") === "true"
      const variantOptions = formData.get("variant_options") as string

      if (hasVariantsVal) {
        const options = JSON.parse(variantOptions || "[]")
        if (options.length === 0 || options.some((o: any) => o.values.length === 0)) {
          setAlertConfig({ title: "Variantes requeridas", description: "Las variantes requieren al menos una opción con valores" })
          setAlertOpen(true)
          setIsSubmitting(false)
          return
        }
      }

      if (editingProduct) {
        await updateProduct(formData)
      } else {
        await createProduct(formData)
      }
      closeModal()
      router.refresh()
    } catch (err) {
      setAlertConfig({ title: "Error", description: String(err) })
      setAlertOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const salesCount = await hasSales(deleteTarget.id)

      if (salesCount > 0) {
        const result = await deleteProduct(deleteTarget.id, true)
        if (result.success) {
          router.refresh()
        }
      } else {
        await deleteProduct(deleteTarget.id)
        router.refresh()
      }
    } catch (err) {
      setAlertConfig({ title: "Error", description: String(err) })
      setAlertOpen(true)
    } finally {
      setDeleteTarget(null)
    }
  }

  const openDeleteConfirm = async (id: string, name: string) => {
    try {
      const salesCount = await hasSales(id)
      setDeleteTarget({ id, name })

      if (salesCount > 0) {
        setAlertConfig({
          title: "Archivar producto",
          description: `Este producto tiene ${salesCount} venta${salesCount > 1 ? "s" : ""} asociada${salesCount > 1 ? "s" : ""}.\n\nSe archivará en lugar de eliminar para preservar los datos de las órdenes.\n\n¿Deseas continuar?`,
        })
        setArchiveConfirmOpen(true)
      } else {
        setDeleteConfirmOpen(true)
      }
    } catch (err) {
      setAlertConfig({ title: "Error", description: String(err) })
      setAlertOpen(true)
    }
  }

  const handleArchiveConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id, true)
      router.refresh()
    } catch (err) {
      setAlertConfig({ title: "Error", description: String(err) })
      setAlertOpen(true)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleProductActive(id, active)
      router.refresh()
    } catch (err) {
      setAlertConfig({ title: "Error", description: String(err) })
      setAlertOpen(true)
    }
  }

  return (
    <div className="flex flex-col h-screen px-4 py-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          Gestionar Productos
        </h1>
        <div className="flex gap-3">
          <Link
            href="/admin/products/archived"
            className="border border-input hover:bg-accent px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition"
          >
            <Archive className="w-4 h-4" /> Ver Archivados
          </Link>
          <button
            onClick={openNewModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-16">
          {products?.map((p) => (
            <div key={p.id} className={`bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition h-full ${(p as any).active === false ? 'opacity-50' : ''}`}>
              <div className="aspect-square bg-muted flex items-center justify-center p-3 border-b border-border relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                  <span className="text-xs text-muted-foreground font-mono">IMG</span>
                )}
                <button
                  onClick={() => handleToggleActive(p.id, !(p as any).active)}
                  className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${(p as any).active === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                >
                  {(p as any).active === false ? 'OFF' : 'ON'}
                </button>
              </div>

              <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-bold text-card-foreground mb-0.5 line-clamp-1">{p.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{p.categories?.name || "N/A"}</p>

                <div className="font-extrabold text-primary text-lg mb-1">
                  {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(p.price)}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Stock: <span className="font-medium text-foreground">{(p as any).effective_stock ?? p.stock}</span>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 flex justify-center items-center gap-1 py-1.5 border border-input rounded-md text-xs font-bold hover:bg-accent transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(p.id, p.name)}
                    className="w-12 flex justify-center items-center border border-input text-destructive rounded-lg hover:bg-destructive/10 hover:border-destructive/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(!products || products.length === 0) && (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
              No hay productos registrados.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl my-8 border" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b flex justify-between items-center p-6 z-10">
              <h2 className="text-xl font-extrabold text-card-foreground">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={closeModal} className="p-1 bg-secondary rounded-full hover:bg-accent transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Hidden ID for edit */}
              {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
              {editingProduct && <input type="hidden" name="active" value={productActive ? "true" : "false"} />}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-1.5">Nombre</label>
                <input
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Active Toggle - only for editing */}
              {editingProduct && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground">Estado</label>
                    <p className="text-xs text-muted-foreground">
                      {productActive ? "Producto visible en la tienda" : "Producto oculto de la tienda"}
                    </p>
                  </div>
                  <ToggleSwitch checked={productActive} onChange={setProductActive} />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-1.5">Descripción</label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description}
                  required
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Precio base</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingProduct?.price}
                    required
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Categoría</label>
                  <select
                    name="category_id"
                    defaultValue={editingProduct?.category_id || ""}
                    required
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar...</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                  {hasVariants ? "Stock total (suma de variantes activas)" : "Stock"}
                </label>
                <input
                  type="number"
                  name="stock"
                  value={hasVariants ? totalVariantStock : (editingProduct ? editingProduct.stock : newProductStock)}
                  disabled={hasVariants}
                  onChange={hasVariants ? undefined : (e) => {
                    const val = e.target.value
                    if (val === "") {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, stock: 0 })
                      } else {
                        setNewProductStock(0)
                      }
                    } else {
                      const num = parseInt(val, 10)
                      if (!isNaN(num)) {
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, stock: num })
                        } else {
                          setNewProductStock(num)
                        }
                      }
                    }
                  }}
                  required={!hasVariants}
                  readOnly={hasVariants}
                  className={`w-full h-10 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasVariants ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-background"
                    }`}
                />
                {hasVariants && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock calculado desde variantes activas
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-1.5">Imagen</label>
                <div className="relative border-2 border-dashed border-input rounded-xl p-8 flex flex-col items-center justify-center bg-muted hover:bg-accent transition group cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">Sube una imagen</p>
                  <button type="button" className="mt-2 px-4 py-2 border border-input rounded-md text-sm font-semibold bg-card shadow-sm pointer-events-none">
                    Seleccionar Imagen
                  </button>
                </div>
              </div>

              {/* Image Preview */}
              {previewImage && (
                <div className="border rounded-lg p-2 bg-card inline-block">
                  <img src={previewImage} className="w-24 h-24 object-contain" alt="Preview" />
                </div>
              )}

              {/* Loading or Variants Editor */}
              {loadingVariants ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ProductVariantsEditor
                  initialOptions={variantOptions}
                  initialVariants={variantStocks.map(v => ({
                    id: v.id,
                    sku_code: v.sku_code,
                    stock: v.stock,
                    active: v.active,
                    price_override: v.price_override,
                    option_values: []
                  }))}
                  hasVariants={hasVariants}
                  onHasVariantsChange={handleHasVariantsChange}
                />
              )}

              {/* Submit */}
              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : editingProduct ? "Actualizar Producto" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        description={deleteTarget ? `¿Estás seguro que deseas eliminar el producto "${deleteTarget.name}"?` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
      />

      <ConfirmDialog
        open={archiveConfirmOpen}
        onClose={() => {
          setArchiveConfirmOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={() => {
          handleArchiveConfirm()
          setArchiveConfirmOpen(false)
        }}
        title="Archivar producto"
        description={alertConfig.description}
        confirmText="Archivar"
        cancelText="Cancelar"
        destructive
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
