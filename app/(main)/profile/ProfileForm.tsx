"use client";

import { useState, useEffect } from "react";
import { updateProfile } from "@/features/profile/actions/profileActions";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { PasswordChangeSection } from "@/components/profile/PasswordChangeSection";
import type { ProfileData } from "@/features/auth/types/user.types";

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
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        const passwordInput = form.elements.namedItem("password") as HTMLInputElement | null;
        const confirmInput = form.elements.namedItem("confirm_password") as HTMLInputElement | null;
        if (passwordInput) passwordInput.value = "";
        if (confirmInput) confirmInput.value = "";
      } else {
        setMessage({ type: "error", text: result.message });
      }
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
        <div
          className={`p-4 rounded-xl border text-sm ${
            message.type === "success"
              ? "bg-success-muted/50 border-success/30 text-success"
              : "bg-destructive/10 border-destructive text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <PersonalInfoSection
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        address={address}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onPhoneChange={setPhone}
        onAddressChange={setAddress}
      />

      <hr className="border-border my-8" />

      <PasswordChangeSection />

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
