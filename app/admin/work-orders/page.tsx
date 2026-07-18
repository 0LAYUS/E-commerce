import { getWorkOrders } from "@/features/work-orders/actions/workOrderQueries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WorkOrderStatus } from "@/features/work-orders/types/work-order.types";

function getStatusBadgeVariant(status: WorkOrderStatus) {
  switch (status) {
    case "DRAFT":
      return "secondary";
    case "RECEIVED":
      return "default";
    case "IN_PROGRESS":
      return "outline"; // Ideally warning/blue but shadcn default outlines work
    case "ON_HOLD":
      return "destructive";
    case "COMPLETED":
      return "default"; // green would be good, using default for now
    case "DELIVERED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "default";
  }
}

export default async function WorkOrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const workOrders = await getWorkOrders(params.status, params.search);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
        <Button asChild>
          <Link href="/admin/work-orders/new">Nueva Orden</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No se encontraron órdenes de trabajo.
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell className="font-mono">{wo.tracking_id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{wo.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {wo.customer_phone}
                    </div>
                  </TableCell>
                  <TableCell>{wo.device_model}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(wo.status)}>
                      {wo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(wo.created_at), "PP", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/work-orders/${wo.id}`}>Ver detalle</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
