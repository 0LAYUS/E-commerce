"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoreLogo } from "@/components/branding/store-logo";
import { StoreName } from "@/components/branding/store-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackingGatewayPage() {
  const [trackingId, setTrackingId] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId || !phone) return;
    
    // Redirect to the detail page, passing phone as query param for validation
    router.push(`/tracking/${trackingId}?phone=${encodeURIComponent(phone)}`);
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
            <div className="space-y-2">
              <Label htmlFor="trackingId">ID de Rastreo</Label>
              <Input 
                id="trackingId" 
                placeholder="Ej: A1B2C3D4" 
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
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
