"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPasswordForEmail } from "@/features/auth/actions/authActions";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await resetPasswordForEmail(formData);
      setMessage({ type: "success", text: result.message });
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Error al enviar el enlace";
      setMessage({ type: "error", text: messageText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-card-foreground tracking-tight">Recuperar contraseña</h1>
          <p className="text-muted-foreground mt-2">Ingresa tu correo para enviarte un enlace mágico.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm ${
            message.type === 'success' ? 'bg-success-muted text-success border border-success' : 'bg-danger-muted text-danger border border-danger'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-input bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              placeholder="tu@correo.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/login" className="font-bold text-foreground hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
