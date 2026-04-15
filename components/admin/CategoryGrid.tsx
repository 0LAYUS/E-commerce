"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag, Pencil, Trash2, Plus, X } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/adminActions';

export default function CategoryGrid({ categories }: { categories: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(formData);
      } else {
        await createCategory(formData);
      }
      closeModal();
    } catch (err) {
      alert("Error al guardar: " + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro que deseas eliminar la categoría "${name}"? Esto podría afectar a los productos asociados.`)) {
      try {
        await deleteCategory(id);
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
          Gestionar Categorías
        </h1>
        <button onClick={openNewModal} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition">
          <Plus className="w-4 h-4" /> Nueva Categoría
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 relative z-0">
        {categories?.map(c => (
          <div key={c.id} className="bg-card rounded-xl shadow-sm border p-6 flex flex-col hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex gap-2 text-muted-foreground">
                <button onClick={() => openEditModal(c)} className="hover:text-foreground transition p-1.5" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} className="hover:text-destructive transition p-1.5" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-card-foreground mb-2">{c.name}</h3>
            <p className="text-sm text-muted-foreground mb-5 flex-grow line-clamp-2">
              {c.description || 'Sin descripción detallada.'}
            </p>
            <span className="text-sm font-semibold text-primary">{c.products?.length || 0} productos</span>
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
            Aún no hay categorías registradas.
          </div>
        )}
      </div>

      {/* MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-opacity">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b bg-card sticky top-0">
              <h2 className="text-xl font-extrabold text-card-foreground">
                {editingCategory ? 'Editar Categoría' : 'Añadir Nueva Categoría'}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition p-1 bg-secondary rounded-full hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form action={handleSubmit} className="space-y-5">
                {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
                
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Nombre de la Categoría</label>
                  <input 
                    name="name" 
                    defaultValue={editingCategory?.name} 
                    required 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ej: Electrónica, Ropa, Hogar..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Descripción (Opcional)</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingCategory?.description} 
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    rows={4}
                    placeholder="Escribe una breve descripción de lo que incluye esta categoría..."
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-border mt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Categoría"}
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
