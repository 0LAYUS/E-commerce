"use client"

import Image from "next/image"
import { X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ToggleSwitch from "@/components/ui/ToggleSwitch"
import type { Product } from "@/features/products/types/product.types"

type ProductFormModalProps = {
  editingProduct: Product | null
  categories: { id: string; name: string }[]
  hasVariants: boolean
  productActive: boolean
  totalVariantStock: number
  isSubmitting: boolean
  imageItems: { id: string; url: string; type: "existing" | "new"; file?: File }[]
  draggingImageId: string | null
  loadingVariants: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (id: string) => void
  onDragStart: (id: string) => void
  onDrop: (targetId: string) => void
  onProductActiveChange: (value: boolean) => void
  onNewProductStockChange: (value: number) => void
  newProductStock: number
  variantsEditor: React.ReactNode
}

export function ProductFormModal({
  editingProduct,
  categories,
  hasVariants,
  productActive,
  totalVariantStock,
  isSubmitting,
  imageItems,
  draggingImageId,
  loadingVariants,
  fileInputRef,
  onClose,
  onSubmit,
  onImageChange,
  onRemoveImage,
  onDragStart,
  onDrop,
  onProductActiveChange,
  onNewProductStockChange,
  newProductStock,
  variantsEditor,
}: ProductFormModalProps) {
  const stockValue = hasVariants ? totalVariantStock : editingProduct ? editingProduct.stock : newProductStock

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl my-8 border" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b flex justify-between items-center p-6 z-10">
          <h2 className="text-xl font-extrabold text-card-foreground">
            {editingProduct ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button onClick={onClose} className="p-1 transition" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
          {editingProduct && <input type="hidden" name="active" value={productActive ? "true" : "false"} />}
          <div>
            <label className="block text-sm font-semibold text-card-foreground mb-1.5">Nombre</label>
            <Input
              name="name"
              defaultValue={editingProduct?.name}
              required
            />
          </div>
          {editingProduct && (
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-card-foreground">Estado</label>
                <p className="text-xs text-muted-foreground">{productActive ? "Producto visible" : "Producto oculto"}</p>
              </div>
              <ToggleSwitch checked={productActive} onChange={onProductActiveChange} />
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Precio base</label>
              <Input
                type="number"
                name="price"
                defaultValue={editingProduct?.price}
                required
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
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-card-foreground mb-1.5">
              {hasVariants ? "Stock total" : "Stock"}
            </label>
            <Input
              type="number"
              name="stock"
              value={stockValue}
              disabled={hasVariants}
              onChange={(e) => {
                const val = e.target.value
                if (val === "") {
                  onNewProductStockChange(0)
                } else {
                  const num = parseInt(val, 10)
                  if (!isNaN(num)) {
                    onNewProductStockChange(num)
                  }
                }
              }}
              required={!hasVariants}
              readOnly={hasVariants}
              className={hasVariants ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
            />
            {hasVariants && <p className="text-xs text-muted-foreground mt-1">Stock calculado desde variantes activas</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-card-foreground mb-1.5">Imagenes</label>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" /> Agregar imagenes
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={onImageChange}
                className="hidden"
              />
              <span className="text-xs text-muted-foreground">Arrastra para reordenar</span>
            </div>
            {imageItems.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imageItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => onDragStart(item.id)}
                    onDragEnd={() => {}}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => onDrop(item.id)}
                    className={`relative border rounded-lg bg-card p-2 flex items-center justify-center aspect-square cursor-grab ${
                      draggingImageId === item.id ? "opacity-70" : ""
                    }`}
                  >
                    <Image src={item.url} alt="Preview" fill className="object-contain" />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(item.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                      aria-label="Eliminar imagen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-input rounded-xl p-6 text-center text-sm text-muted-foreground">
                Todavia no hay imagenes cargadas.
              </div>
            )}
          </div>
          {loadingVariants ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            variantsEditor
          )}
          <div className="pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editingProduct ? "Actualizar Producto" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
