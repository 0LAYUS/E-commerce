import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProductList from "@/components/products/ProductList";

async function ProductsDataLoader() {
  const supabase = await createClient();

  const { data: categories } = await supabase.from('categories').select('*');
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });

  return <ProductList initialProducts={products || []} categories={categories || []} />;
}

export default function Index() {
  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border mt-4 border-gray-100">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Bienvenido a WompiStore</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Descubre nuestros increíbles productos y compra de forma segura con Wompi.
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-20 text-gray-400 font-medium">Cargando catálogo...</div>}>
        <ProductsDataLoader />
      </Suspense>
    </div>
  );
}
