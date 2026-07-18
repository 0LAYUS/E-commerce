"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkOrderStatus } from "../types/work-order.types";
import { updateWorkOrderStatus } from "../actions/workOrderActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusUpdater({
  workOrderId,
  currentStatus,
}: {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
}) {
  const [status, setStatus] = useState<WorkOrderStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const STATUS_TRANSLATIONS: Record<WorkOrderStatus, string> = {
    DRAFT: "Borrador",
    RECEIVED: "Recibido",
    IN_PROGRESS: "En Progreso",
    ON_HOLD: "En Pausa",
    COMPLETED: "Completado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado"
  };

  const statuses: WorkOrderStatus[] = [
    "DRAFT",
    "RECEIVED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "DELIVERED",
    "CANCELLED",
  ];

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const res = await updateWorkOrderStatus(workOrderId, status);
      if (res.error) alert("Error: " + res.error);
    } catch (e) {
      console.error(e);
      alert("Error inesperado");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Select value={status} onValueChange={(val) => setStatus(val as WorkOrderStatus)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_TRANSLATIONS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        onClick={handleUpdate} 
        disabled={status === currentStatus || isUpdating}
      >
        {isUpdating ? "Actualizando..." : "Actualizar Estado"}
      </Button>
    </div>
  );
}
