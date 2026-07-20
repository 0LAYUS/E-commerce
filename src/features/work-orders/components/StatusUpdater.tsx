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
import { WorkOrderBillingModal } from "./WorkOrderBillingModal";

export function StatusUpdater({
  workOrderId,
  currentStatus,
  estimatedCost,
}: {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
  estimatedCost: number | null;
}) {
  const [status, setStatus] = useState<WorkOrderStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

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
    if (status === "DELIVERED") {
      setIsBillingModalOpen(true);
      return;
    }

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

  const handleBillingConfirm = async (billingData: any) => {
    setIsUpdating(true);
    try {
      const { closeWorkOrderAndBill } = await import("../actions/workOrderActions");
      const res = await closeWorkOrderAndBill(workOrderId, billingData);
      if (res.error) alert("Error: " + res.error);
      else setIsBillingModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Error inesperado al facturar");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch sm:items-start gap-4">
      <Select 
        value={status} 
        onValueChange={(val) => setStatus(val as WorkOrderStatus)}
        disabled={currentStatus === "DELIVERED"}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
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
        disabled={status === currentStatus || isUpdating || currentStatus === "DELIVERED"}
        className="w-full sm:w-auto"
      >
        {isUpdating ? "Actualizando..." : "Actualizar Estado"}
      </Button>

      {isBillingModalOpen && (
        <WorkOrderBillingModal
          isOpen={isBillingModalOpen}
          onClose={() => setIsBillingModalOpen(false)}
          estimatedCost={estimatedCost}
          onConfirm={handleBillingConfirm}
          isSubmitting={isUpdating}
        />
      )}
    </div>
  );
}
