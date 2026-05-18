"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Archive } from "lucide-react"
import {
  createProduct,
  updateProduct,
  getProductOptions,
  getProductVariants,
  getProductImages,
} from "@/lib/actions/productActions"
import ProductVariantsEditor from "./ProductVariantsEditor"
import { AlertDialog, ConfirmDialog } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/admin/ProductCard"
import { ProductFormModal } from "@/components/admin/ProductFormModal"
import { useProductImages } from "@/hooks/useProductImages"
import { useProductDelete } from "@/hooks/useProductDelete"

import type { Product } from "@/types/product.types"

export default function ProductGrid({ products, categories }: { products: Product[]; categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [hasVariants, setHasVariants] = useState(false)
  const [variantOptions, setVariantOptions] = useState<{ name: string; values: string[] }[]>([])
  const [variantStocks, setVariantStocks] = useState<
    { id: string; sku_code: string; stock: number; active: boolean; price_override: number | null; option_values: string[] }[]
  >([])
  const [newProductStock, setNewProductStock] = useState(0)
  const [productActive, setProductActive] = useState(true)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: "", description: "" })

  const totalVariantStock = variantStocks.reduce((sum, v) => sum + (v.active ? v.stock : 0), 0)

  const {
    imageItems,
    draggingImageId,
    fileInputRef,
    handleImageChange,
    handleRemoveImage,
    handleDragStart,
    handleDrop,
    closeCleanup,
    setImageItems,
  } = useProductImages()

  const handleAlert = (title: string, description: string) => {
    setAlertConfig({ title, description })
    setAlertOpen(true)
  }

  const {
    deleteConfirmOpen,
    archiveConfirmOpen,
    deleteTarget,
    openDeleteConfirm,
    handleDelete,
    handleArchiveConfirm,
    setDeleteConfirmOpen,
    setArchiveConfirmOpen,
    setDeleteTarget,
  } = useProductDelete(handleAlert)

  const openNewModal = () => {
    setEditingProduct(null)
    setImageItems([])
    setHasVariants(false)
    setVariantOptions([])
    setVariantStocks([])
    setNewProductStock(0)
    setProductActive(true)
    setModalOpen(true)
  }

  const openEditModal = async (product: Product) => {
    setEditingProduct(product)
    setImageItems([])
    setProductActive(product.active ?? true)
    setLoadingVariants(true)
    setModalOpen(true)

    try {
      const [options, variants, images] = await Promise.all([
        getProductOptions(product.id),
        getProductVariants(product.id),
        getProductImages(product.id),
      ])
      setHasVariants(options.length > 0)
      setVariantOptions(options)
      setVariantStocks(
        variants.map((v) => ({
          id: v.id,
          sku_code: v.sku_code || "",
          stock: v.stock,
          active: v.active ?? true,
          price_override: v.price_override ?? null,
          option_values: v.option_values || [],
        }))
      )
      if (images.length > 0) {
        setImageItems(images.map((img) => ({ id: img.id, url: img.url, type: "existing" })))
      }
    } catch (err) {
      console.error("Error loading variants:", err)
    } finally {
      setLoadingVariants(false)
    }
  }

  const closeModal = () => {
    closeCleanup()
    setModalOpen(false)
    setTimeout(() => {
      setEditingProduct(null)
      setImageItems([])
      setHasVariants(false)
      setVariantOptions([])
      setVariantStocks([])
    }, 300)
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
      const variantOptionsStr = formData.get("variant_options") as string

      formData.delete("images")
      formData.delete("image")

      const imageOrder = imageItems.map((item) =>
        item.type === "existing" ? { type: "existing" as const, id: item.id } : { type: "new" as const }
      )
      formData.set("image_order", JSON.stringify(imageOrder))

      imageItems
        .filter((item) => item.type === "new" && item.file)
        .forEach((item) => {
          formData.append("images", item.file as File)
        })

      if (hasVariantsVal) {
        const options = JSON.parse(variantOptionsStr || "[]")
        if (options.length === 0 || options.some((o: { values: string[] }) => o.values.length === 0)) {
          handleAlert("Variantes requeridas", "Las variantes requieren al menos una opción con valores")
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
      handleAlert("Error", String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { toggleProductActive } = await import("@/lib/actions/productActions")
      await toggleProductActive(id, active)
      router.refresh()
    } catch (err) {
      handleAlert("Error", String(err))
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          Gestionar Productos
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/products/archived">
              <Archive className="w-4 h-4" /> Ver Archivados
            </Link>
          </Button>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-16">
          {products?.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
              onToggleActive={handleToggleActive}
            />
          ))}
          {(!products || products.length === 0) && (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
              No hay productos registrados.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          categories={categories}
          hasVariants={hasVariants}
          productActive={productActive}
          totalVariantStock={totalVariantStock}
          isSubmitting={isSubmitting}
          imageItems={imageItems}
          draggingImageId={draggingImageId}
          loadingVariants={loadingVariants}
          fileInputRef={fileInputRef}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onProductActiveChange={setProductActive}
          onNewProductStockChange={setNewProductStock}
          newProductStock={newProductStock}
          variantsEditor={
            <ProductVariantsEditor
              initialOptions={variantOptions}
              initialVariants={variantStocks.map((v) => ({
                id: v.id,
                sku_code: v.sku_code,
                stock: v.stock,
                price_override: v.price_override,
                active: v.active,
                option_values: [],
              }))}
              hasVariants={hasVariants}
              onHasVariantsChange={handleHasVariantsChange}
            />
          }
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        description={deleteTarget ? `¿Eliminar "${deleteTarget.name}"?` : ""}
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
      <AlertDialog open={alertOpen} onClose={() => setAlertOpen(false)} title={alertConfig.title} description={alertConfig.description} />
    </div>
  )
}
