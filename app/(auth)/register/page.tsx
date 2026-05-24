"use client";

import { signup } from "@/features/auth/actions/authActions"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { motion } from "framer-motion"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { useState } from "react"
import { StoreLogo } from "@/components/branding/store-logo"

function RegisterForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

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
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <StoreLogo size="lg" />
          </motion.div>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-card-foreground">Crea tu cuenta</h2>
        <p className="mt-2 text-sm text-muted-foreground">Únete a nuestra tienda hoy</p>
      </div>

      {(clientError || error) && (
        <motion.div
          className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {clientError || error}
        </motion.div>
      )}

      <form 
        action={signup} 
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
          const confirmPassword = (e.currentTarget.elements.namedItem("confirm_password") as HTMLInputElement).value;
          
          if (password !== confirmPassword) {
            e.preventDefault();
            setClientError("Las contraseñas no coinciden");
          } else {
            setClientError(null);
          }
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-card-foreground mb-2">
                Nombre
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-card-foreground mb-2">
                Apellido
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Tu apellido"
              />
            </div>
          </div>
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
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
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
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
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
          <div className="relative">
            <label htmlFor="confirm_password" className="block text-sm font-medium text-card-foreground mb-2">
              Confirmar Contraseña
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <motion.button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all border border-border"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Registrarse
          </motion.button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground hover:text-primary transition-colors">
          Inicia sesión aquí
        </Link>
      </p>
    </motion.div>
  )
}

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-muted/10 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="w-full max-w-md p-10 text-center text-muted-foreground">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}