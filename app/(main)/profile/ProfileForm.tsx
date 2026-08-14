"use client";

import { useState, useEffect } from "react";
import { updateProfile } from "@/features/profile/actions/profileActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type ProfileData = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address?: string | null
}

export default function ProfileForm({ initialProfile }: { initialProfile: ProfileData | null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [firstName, setFirstName] = useState(initialProfile?.first_name || "");
  const [lastName, setLastName] = useState(initialProfile?.last_name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [address, setAddress] = useState(initialProfile?.address || "");

  useEffect(() => {
    setFirstName(initialProfile?.first_name || "");
    setLastName(initialProfile?.last_name || "");
    setPhone(initialProfile?.phone || "");
    setAddress(initialProfile?.address || "");
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setMessage(null);

    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      setLoading(false);
      return;
    }

    try {
      const result = await updateProfile(formData);
      setMessage({ type: "success", text: result.message });
      (form.elements.namedItem("password") as HTMLInputElement).value = "";
      (form.elements.namedItem("confirm_password") as HTMLInputElement).value = "";
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Error al actualizar el perfil";
      setMessage({ type: "error", text: messageText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl border text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido</Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 3001234567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección de residencia</Label>
          <Input
            id="address"
            name="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Principal #123"
          />
        </div>
      </div>

      <hr className="border-border my-8" />

      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Actualizar Contraseña</h3>
        <p className="text-sm text-muted-foreground mb-6">Deja estos campos en blanco si no deseas cambiar tu contraseña actual.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
