import { CreateWorkOrderForm } from "@/features/work-orders/components/CreateWorkOrderForm";
import { getWorkOrderTemplates } from "@/features/work-orders/actions/workOrderQueries";
import { WorkOrderTemplate } from "@/features/work-orders/types/work-order.types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewWorkOrderPage() {
  const templates = await getWorkOrderTemplates();
  let template: WorkOrderTemplate | null = templates[0] || null;

  if (!template) {
    // Mock fallback if DB is empty
    template = {
      id: "mock-id",
      tenant_id: "mock-tenant",
      name: "Servicio Técnico Estándar",
      schema: {
        properties: {
          device_model: { type: "string", title: "Modelo del Dispositivo", required: true },
          issue_description: { type: "string", title: "Descripción del Problema", required: true },
          password: { type: "string", title: "Contraseña / PIN del dispositivo", required: false }
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/work-orders" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h1>
          <p className="text-muted-foreground">
            Crear orden usando la plantilla: {template.name}
          </p>
        </div>
      </div>
      
      <CreateWorkOrderForm template={template} />
    </div>
  );
}
