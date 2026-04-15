import Link from 'next/link';
import { Package, Tag, ShoppingBag, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-gray-50 rounded-lg overflow-hidden border">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5"/>
            Dashboard
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <Tag className="w-5 h-5"/>
            Categorías
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <Package className="w-5 h-5"/>
            Productos
          </Link>
          <Link href="/admin/sales" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors">
            <ShoppingBag className="w-5 h-5"/>
            Ventas
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}
