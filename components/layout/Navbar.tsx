import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogOut, User, ShoppingBag, Info, Shield, LayoutDashboard } from 'lucide-react';
import { logout } from '@/lib/actions/authActions';
import CartIcon from './CartIcon';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = 'cliente';
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data) role = data.role;
  }

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              WompiStore
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/about" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Info className="w-4 h-4" />
                Sobre Nosotros
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CartIcon />
            
            {user ? (
              <>
                {role === 'administrador' ? (
                  <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition">
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                ) : (
                  <Link href="/profile/orders" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">Panel de Usuario</span>
                  </Link>
                )}
                <form action={logout}>
                  <button type="submit" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Salir</span>
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}