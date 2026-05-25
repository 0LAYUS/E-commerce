import type { Metadata } from "next";
import { storeBranding } from "@/lib/constants/branding-store";

export const runtime = 'edge'
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-card-foreground mb-2">
        Términos y Condiciones
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Última actualización: {new Date().getFullYear()}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground">
        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            1. Aceptación de los términos
          </h2>
          <p>
            Al acceder y utilizar el sitio web de {storeBranding.name} (en
            adelante, &quot;el Sitio&quot;), usted acepta cumplir con los
            presentes Términos y Condiciones y la Política de Privacidad. Si no
            está de acuerdo con alguna parte, le recomendamos no utilizar
            nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            2. Uso del sitio
          </h2>
          <p>
            Usted se compromete a utilizar el Sitio únicamente para fines
            lícitos y de acuerdo con la legislación colombiana vigente. Queda
            prohibido el uso del Sitio para actividades fraudulentas,
            difamatorias o que violen derechos de terceros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            3. Productos y precios
          </h2>
          <p>
            Todos los precios mostrados en el Sitio están expresados en pesos
            colombianos (COP) e incluyen IVA cuando corresponda. Nos reservamos
            el derecho de modificar precios, descripciones y disponibilidad de
            productos sin previo aviso.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            4. Pedidos y pagos
          </h2>
          <p>
            Al realizar un pedido, usted declara que la información
            proporcionada es veraz y completa. Nos reservamos el derecho de
            rechazar o cancelar pedidos por razones de stock, errores en el
            precio o sospecha de fraude. Los pagos se procesan a través de
            pasarelas seguras y no almacenamos información de tarjetas de
            crédito.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            5. Envíos
          </h2>
          <p>
            Realizamos envíos a todo el territorio colombiano. Los tiempos de
            entrega son estimados y pueden variar según la ubicación y la
            disponibilidad del producto. No nos hacemos responsables por demoras
            causadas por terceros o por fuerza mayor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            6. Propiedad intelectual
          </h2>
          <p>
            Todo el contenido del Sitio —incluyendo textos, imágenes, logotipos,
            gráficos y software— es propiedad de {storeBranding.name} o de sus
            respectivos titulares y está protegido por las leyes de propiedad
            intelectual.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            7. Política de privacidad
          </h2>
          <p>
            {storeBranding.name} recopila información personal que usted nos
            proporciona voluntariamente al registrarse, realizar un pedido o
            contactarnos. Utilizamos sus datos exclusivamente para procesar
            pedidos, brindar soporte y mejorar nuestros servicios. No vendemos
            ni compartimos su información con terceros, excepto cuando sea
            necesario para procesar pagos o cumplir con obligaciones legales.
            Implementamos medidas de seguridad técnicas para proteger su
            información. De acuerdo con la Ley 1581 de 2012 de Colombia, usted
            tiene derecho a conocer, actualizar, rectificar y suprimir sus datos
            personales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            8. Limitación de responsabilidad
          </h2>
          <p>
            {storeBranding.name} no será responsable por daños directos,
            indirectos, incidentales o consecuentes derivados del uso o la
            imposibilidad de uso del Sitio o de los productos adquiridos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            9. Modificaciones
          </h2>
          <p>
            Nos reservamos el derecho de actualizar estos Términos y Condiciones
            en cualquier momento. Los cambios entrarán en vigor desde su
            publicación en el Sitio. Se recomienda revisar periódicamente esta
            página.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-card-foreground mb-3">
            10. Contacto
          </h2>
          <p>
            Si tiene preguntas sobre estos Términos y Condiciones, puede
            contactarnos en{" "}
            <a
              href={`mailto:${storeBranding.contact.email}`}
              className="text-primary hover:underline"
            >
              {storeBranding.contact.email}
            </a>{" "}
            o al teléfono {storeBranding.contact.phone}.
          </p>
        </section>
      </div>
    </main>
  );
}
