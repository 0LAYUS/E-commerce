import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEVELOPER_CONTACT } from "@/lib/constants/admin";
import { prigmaBranding } from "@/lib/constants/branding-prigma";

export function AdminFooter() {
  return (
    <footer className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {prigmaBranding.company}. Todos los derechos reservados
      </p>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`mailto:${DEVELOPER_CONTACT.email}`}
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Contactar {DEVELOPER_CONTACT.company}
        </a>
      </Button>
    </footer>
  );
}
