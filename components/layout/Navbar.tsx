import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogOut } from 'lucide-react';
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
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              WompiStore
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              Sobre Nosotros
            </Link>
            <CartIcon />
            
            {user ? (
              <div className="flex items-center gap-4">
                {role === 'administrador' && (
                  <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                    Admin
                  </Link>
                )}
                <Link href="/profile/orders" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                  Órdenes
                </Link>
                <form action={logout}>
                  <button type="submit" className="text-sm font-medium text-gray-600 hover:text-red-600">
                    Salir
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
