"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoreLogo } from "@/components/branding/store-logo";
import { StoreName } from "@/components/branding/store-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function TrackingForm() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [trackingId, setTrackingId] = useState(initialId);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Remover caracteres especiales y dar advertencia
    if (/[^A-Z0-9]/.test(value)) {
      setError("El ID de rastreo solo puede contener letras y números.");
    } else {
      setError("");
    }
    setTrackingId(value.replace(/[^A-Z0-9]/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) {
      setError("Por favor ingresa un ID de rastreo");
      return;
    }
    if (!phone) {
      setError("Por favor ingresa tu número de teléfono");
      return;
    }
    setError("");
    router.push(`/tracking/${trackingId}${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 flex flex-col items-center">
        <StoreLogo size="lg" className="mb-4" />
        <StoreName as="h1" className="text-3xl font-bold tracking-tight" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Rastrear Servicio</CardTitle>
          <CardDescription>
            Ingresa tu ID de rastreo y tu número de teléfono para ver el estado de tu servicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="trackingId">ID de Rastreo</Label>
              <Input 
                id="trackingId" 
                placeholder="Ej: A1B2C3D4" 
                value={trackingId}
                onChange={handleIdChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="El número registrado en la orden"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Consultar Estado
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrackingGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    }>
      <TrackingForm />
    </Suspense>
  );
}
