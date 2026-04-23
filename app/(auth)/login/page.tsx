"use client";

import { login } from "@/lib/actions/authActions"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { motion } from "framer-motion"
import { ShoppingBag, Eye, EyeSlash } from "@phosphor-icons/react"
import { useState } from "react"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <motion.div
      className="w-full max-w-md space-y-8 rounded-2xl bg-card p-10 shadow-2xl border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <motion.div
            className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-700"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingBag className="w-6 h-6 text-white" weight="fill" />
          </motion.div>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-card-foreground">Bienvenido de vuelta</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ingresa a tu cuenta para continuar</p>
      </div>

      {error && (
        <motion.div
          className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {error}
        </motion.div>
      )}

      <form action={login} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-card-foreground placeholder:text-muted-foreground focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 transition-colors"
              placeholder="tu@correo.com"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-card-foreground placeholder:text-muted-foreground focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeSlash className="w-5 h-5" weight="bold" />
              ) : (
                <Eye className="w-5 h-5" weight="bold" />
              )}
            </button>
          </div>
          <div className="flex justify-end mt-2">
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <div>
          <motion.button
            type="submit"
            className="w-full rounded-xl bg-gray-800 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-gray-700 transition-all border border-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Iniciar Sesión
          </motion.button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link href="/register" className="font-medium text-foreground hover:text-gray-400 transition-colors">
          Regístrate aquí
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="w-full max-w-md p-10 text-center text-muted-foreground">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}