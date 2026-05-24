import type { Metadata } from "next";
import { storeBranding } from "@/lib/constants/branding-store";
import {
  EnvelopeSimple,
  Phone,
  WhatsappLogo,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactPage() {
  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-card-foreground mb-2">
        Contacto
      </h1>
      <p className="text-muted-foreground mb-10">
        ¿Tenés alguna pregunta? Estamos para ayudarte.
      </p>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 border border-border">
            <Phone className="w-6 h-6" weight="duotone" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Teléfono</p>
            <p className="font-medium text-card-foreground">
              {storeBranding.contact.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 border border-border">
            <EnvelopeSimple className="w-6 h-6" weight="duotone" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <a
              href={`mailto:${storeBranding.contact.email}`}
              className="font-medium text-card-foreground hover:text-primary transition-colors"
            >
              {storeBranding.contact.email}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 border border-border">
            <Clock className="w-6 h-6" weight="duotone" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Horario</p>
            <p className="font-medium text-card-foreground">
              {storeBranding.contact.schedule}
            </p>
          </div>
        </div>

        <Button className="w-full" size="lg" asChild>
          <a
            href={`https://wa.me/${storeBranding.whatsapp}?text=Hola%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappLogo className="w-5 h-5" weight="fill" />
            Escribinos por WhatsApp
          </a>
        </Button>
      </div>
    </main>
  );
}
