import { notFound } from "next/navigation";
import { getWorkOrderById, getWorkOrderEvidence } from "@/features/work-orders/actions/workOrderQueries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadEvidenceModal } from "@/features/work-orders/components/UploadEvidenceModal";
import { StatusUpdater } from "@/features/work-orders/components/StatusUpdater";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const workOrder = await getWorkOrderById(id);
  if (!workOrder) {
    notFound();
  }

  const evidence = await getWorkOrderEvidence(id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/work-orders" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orden #{workOrder.tracking_id}</h1>
          <p className="text-muted-foreground">
            Creada el {format(new Date(workOrder.created_at), "PPP", { locale: es })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalles del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Cliente</span>
                <span className="font-medium">{workOrder.customer_name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Teléfono</span>
                <span className="font-medium">{workOrder.customer_phone}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Dispositivo</span>
                <span className="font-medium">{workOrder.device_model}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Costo Estimado</span>
                <span className="font-medium">
                  {workOrder.estimated_cost ? `$${workOrder.estimated_cost}` : "Por definir"}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <span className="text-sm text-muted-foreground block mb-1">Descripción del Problema</span>
              <p className="text-sm">{workOrder.issue_description}</p>
            </div>
            
            {workOrder.notes && (
              <div className="pt-4 border-t">
                <span className="text-sm text-muted-foreground block mb-1">Notas Internas</span>
                <p className="text-sm">{workOrder.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Badge variant="outline" className="text-lg py-1 px-3">
                {workOrder.status}
              </Badge>
            </div>
            <div className="border-t pt-4">
              <span className="text-sm text-muted-foreground block mb-2">Cambiar Estado</span>
              <StatusUpdater workOrderId={workOrder.id} currentStatus={workOrder.status} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Galería de Evidencia</CardTitle>
          <UploadEvidenceModal workOrderId={workOrder.id} />
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay evidencia subida para esta orden.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evidence.map((item: any) => (
                <div key={item.id} className="group relative rounded-md border overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    <Image
                      src={item.image_url}
                      alt={item.notes || "Evidencia"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2 bg-background/90 text-xs">
                    <span className="font-semibold">{item.stage}</span>
                    {item.notes && <p className="text-muted-foreground truncate">{item.notes}</p>}
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      {format(new Date(item.created_at), "PP", { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
