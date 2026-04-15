"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Plus, Upload, X } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions/adminActions';

export default function ProductGrid({ products, categories }: { products: any[], categories: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const openNewModal = () => {
    setEditingProduct(null);
    setPreviewImage(null);
    setModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setPreviewImage(product.image_url);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setEditingProduct(null);
      setPreviewImage(null);
    }, 300);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(formData);
      } else {
        await createProduct(formData);
      }
      closeModal();
    } catch (err) {
      alert("Error al guardar: " + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro que deseas eliminar el producto "${name}"?`)) {
      try {
        await deleteProduct(id);
      } catch (err) {
        alert("Error al eliminar: " + String(err));
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 mt-4 px-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition" title="Volver al panel">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          Gestionar Productos
        </h1>
        <button onClick={openNewModal} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition">
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 relative z-0">
        {products?.map(p => (
          <div key={p.id} className="bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition">
            <div className="aspect-[4/3] bg-muted flex items-center justify-center p-6 border-b border-border">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <span className="text-xs text-muted-foreground font-mono">IMG</span>
              )}
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-card-foreground mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 flex-grow line-clamp-2 leading-relaxed">{p.description}</p>
              
              <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Categoría: <span className="text-foreground">{p.categories?.name || 'N/A'}</span></div>
              
              <div className="font-extrabold text-primary text-xl mb-1">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.price)}
              </div>
              <div className="text-sm text-muted-foreground mb-5">Stock: <span className="font-medium text-foreground">{p.stock}</span></div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => openEditModal(p)} className="flex-1 flex justify-center items-center gap-2 py-2 border border-input rounded-lg text-sm font-bold text-foreground hover:bg-accent transition">
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => handleDelete(p.id, p.name)} className="w-12 flex justify-center items-center border border-input text-destructive rounded-lg hover:bg-destructive/10 hover:border-destructive/20 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {(!products || products.length === 0) && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
            No hay productos registrados en la plataforma.
          </div>
        )}
      </div>

      {/* MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-opacity">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b flex justify-between items-center p-6 z-10">
              <h2 className="text-xl font-extrabold text-card-foreground">
                {editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition p-1 bg-secondary rounded-full hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form action={handleSubmit} className="space-y-5">
                {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
                
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Nombre</label>
                  <input name="name" defaultValue={editingProduct?.name} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Descripción</label>
                  <textarea name="description" defaultValue={editingProduct?.description} required className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows={4}></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-1.5">Precio</label>
                    <input type="number" name="price" defaultValue={editingProduct?.price} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-1.5">Stock</label>
                    <input type="number" name="stock" defaultValue={editingProduct?.stock} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Categoría</label>
                  <select name="category_id" defaultValue={editingProduct?.category_id || ""} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Seleccione una categoría...</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Imágenes</label>
                  <div className="relative border-2 border-dashed border-input rounded-xl p-8 flex flex-col items-center justify-center bg-muted hover:bg-accent transition group cursor-pointer overflow-hidden">
                    <input 
                      type="file" 
                      name="image" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    
                    <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition mb-3" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">Sube imágenes del producto</p>
                    <button type="button" className="mt-2 px-4 py-2 border border-input rounded-md text-sm font-semibold text-foreground bg-card shadow-sm pointer-events-none">
                      Seleccionar Imágenes
                    </button>
                  </div>
                </div>

                {previewImage && (
                  <div className="flex gap-4 mt-4">
                    <div className="relative border rounded-lg p-2 bg-card inline-block">
                       <img src={previewImage} className="w-24 h-24 object-contain" alt="Preview" />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-lg font-bold transition shadow-sm disabled:opacity-50">
                    {isSubmitting ? "Guardando..." : "Guardar Producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
