"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Al cargar esta vista, el cliente de Supabase (createClient) 
    // automáticamente intercepta el #access_token del correo y recupera la sesión.
    // Opcionalmente podríamos verificar si hay sesión activa, pero supabase lo maneja.
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw new Error(error.message);
      }

      setMessage({ type: "success", text: "Iniciando sesión con tu nueva contraseña..." });
      
      // Redirigir al inicio o perfil después de un par de segundos
      setTimeout(() => {
        router.push("/profile");
      }, 2000);

    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Error al actualizar la contraseña";
      setMessage({ type: "error", text: messageText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-card-foreground tracking-tight">Crear nueva contraseña</h1>
          <p className="text-muted-foreground mt-2">Por favor, establece tu nueva contraseña segura.</p>
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
            <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-card-foreground mb-2">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Guardar contraseña y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
