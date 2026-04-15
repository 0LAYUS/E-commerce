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
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition" title="Volver al panel">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          Gestionar Categorías
        </h1>
        <button onClick={openNewModal} className="bg-[#60A5FA] hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition">
          <Plus className="w-4 h-4" /> Nueva Categoría
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 relative z-0">
        {categories?.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-[#60A5FA] rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex gap-2 text-gray-400">
                <button onClick={() => openEditModal(c)} className="hover:text-gray-700 transition p-1.5" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} className="hover:text-red-500 transition p-1.5" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{c.name}</h3>
            <p className="text-sm text-gray-500 mb-5 flex-grow line-clamp-2">
              {c.description || 'Sin descripción detallada.'}
            </p>
            <span className="text-sm font-semibold text-[#60A5FA]">{c.products?.length || 0} productos</span>
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
            Aún no hay categorías registradas.
          </div>
        )}
      </div>

      {/* MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0">
              <h2 className="text-xl font-extrabold text-gray-900">
                {editingCategory ? 'Editar Categoría' : 'Añadir Nueva Categoría'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition p-1 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form action={handleSubmit} className="space-y-5">
                {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la Categoría</label>
                  <input 
                    name="name" 
                    defaultValue={editingCategory?.name} 
                    required 
                    className="w-full rounded-md border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 outline-none border transition" 
                    placeholder="Ej: Electrónica, Ropa, Hogar..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción (Opcional)</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingCategory?.description} 
                    className="w-full rounded-md border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 outline-none border transition" 
                    rows={4}
                    placeholder="Escribe una breve descripción de lo que incluye esta categoría..."
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-[#60A5FA] text-white py-3.5 rounded-lg font-bold hover:bg-blue-500 transition shadow-sm disabled:opacity-50"
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
