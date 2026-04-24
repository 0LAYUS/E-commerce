"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Shield, Layout, List, X, ShoppingBag, SignOut, Package } from '@phosphor-icons/react'
import { logout } from '@/lib/actions/authActions'
import CartIcon from './CartIcon'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState('cliente')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const getUser = async () => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (data) setRole(data.role)
      }
    }
    getUser()
  }, [])

  if (!mounted) {
    return (
      <motion.nav
        className="bg-card border-b sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-8 h-8 bg-gray-700 rounded-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <div className="w-20 h-5 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </motion.nav>
    )
  }

  return (
    <motion.nav
      className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" className="flex items-center gap-2">
                <motion.div
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-700"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <ShoppingBag className="w-5 h-5 text-white" weight="fill" />
                </motion.div>
                <span className="text-xl font-black text-card-foreground tracking-tight">Store</span>
              </Link>
            </motion.div>

            <motion.div
              className="hidden md:flex items-center gap-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {[
                { href: "/", label: "Inicio" },
                { href: "/products", label: "Productos" },
                { href: "/about", label: "Nosotros" },
                { href: "/contact", label: "Contacto" },
              ].map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="flex items-center gap-3">
            <CartIcon />

            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  key="user-logged"
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {role === 'administrador' && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/admin"
                        className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                      >
                        <Shield className="w-4 h-4" weight="fill" />
                        Admin
                      </Link>
                    </motion.div>
                  )}
                  {role !== 'administrador' && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/profile/orders"
                        className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-accent"
                      >
                        <Layout className="w-4 h-4" weight="duotone" />
                        Mi Cuenta
                      </Link>
                    </motion.div>
                  )}
                  <motion.form
                    action={logout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-red-400 transition-colors rounded-xl hover:bg-destructive/10"
                    >
                      <SignOut className="w-4 h-4" weight="duotone" />
                      <span className="hidden md:inline">Salir</span>
                    </button>
                  </motion.form>
                </motion.div>
              ) : (
                <motion.div
                  key="user-guest"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/login"
                      className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                    >
                      <User className="w-4 h-4" weight="bold" />
                      Iniciar Sesión
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" weight="bold" />
              ) : (
                <List className="w-6 h-6" weight="bold" />
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-1 pb-2">
                {[
                  { href: "/", label: "Inicio", icon: ShoppingBag },
                  { href: "/products", label: "Productos", icon: Package },
                  { href: "/about", label: "Nosotros", icon: User },
                  { href: "/contact", label: "Contacto", icon: User },
                ].map((item) => (
                  <motion.div
                    key={item.href}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors"
                    >
                      <item.icon className="w-5 h-5" weight="duotone" />
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                {!user && (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 px-4 py-3 mt-2 text-sm font-bold bg-gray-800 text-white rounded-xl border border-gray-700"
                    >
                      <User className="w-5 h-5" weight="bold" />
                      Iniciar Sesión
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}