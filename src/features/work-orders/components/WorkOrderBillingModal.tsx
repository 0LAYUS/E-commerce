"use client";

import { useMemo, useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CashPaymentSection,
  PaymentMethodSelector,
  SplitPaymentSection,
} from "@/components/pos/CashPaymentSection";
import type { PaymentMethod } from "@/types/pos.types";

type WorkOrderBillingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  estimatedCost: number | null;
  onConfirm: (data: {
    final_cost: number;
    resolution_note: string;
    payment_method: string;
    amount_received?: number;
    change_amount?: number;
    payments?: { method: string; amount: number }[];
  }) => void;
  isSubmitting?: boolean;
};

const DEFAULT_SPLIT = { efectivo: "", tarjeta: "", transferencia: "" };

export function WorkOrderBillingModal({
  isOpen,
  onClose,
  estimatedCost,
  onConfirm,
  isSubmitting,
}: WorkOrderBillingModalProps) {
  const [finalCost, setFinalCost] = useState(estimatedCost ? String(estimatedCost) : "");
  const [resolutionNote, setResolutionNote] = useState("");
  
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [amountReceived, setAmountReceived] = useState("");
  const [splitPayments, setSplitPayments] = useState(DEFAULT_SPLIT);

  useEffect(() => {
    if (isOpen) {
      setMethod("efectivo");
      setAmountReceived("");
      setSplitPayments(DEFAULT_SPLIT);
      setFinalCost(estimatedCost ? String(estimatedCost) : "");
      setResolutionNote("");
    }
  }, [isOpen, estimatedCost]);

  const parsedCost = useMemo(() => parseFloat(finalCost) || 0, [finalCost]);
  const parsedAmount = useMemo(() => parseFloat(amountReceived) || 0, [amountReceived]);
  
  const splitValues = useMemo(() => {
    const efectivo = parseFloat(splitPayments.efectivo || "0") || 0;
    const tarjeta = parseFloat(splitPayments.tarjeta || "0") || 0;
    const transferencia = parseFloat(splitPayments.transferencia || "0") || 0;
    return { efectivo, tarjeta, transferencia };
  }, [splitPayments]);

  const totalSplit = splitValues.efectivo + splitValues.tarjeta + splitValues.transferencia;
  const cashDue = Math.max(parsedCost - splitValues.tarjeta - splitValues.transferencia, 0);
  const changeAmount = Math.max(splitValues.efectivo - cashDue, 0);

  const canConfirm = useMemo(() => {
    if (parsedCost <= 0) return false;
    if (!resolutionNote.trim()) return false;
    
    if (method === "efectivo") return parsedAmount >= parsedCost;
    if (method === "mixto") return totalSplit >= parsedCost && totalSplit > 0;
    return true;
  }, [method, parsedAmount, parsedCost, totalSplit, resolutionNote]);

  const handleConfirm = () => {
    if (!canConfirm) return;

    if (method === "efectivo") {
      onConfirm({
        final_cost: parsedCost,
        resolution_note: resolutionNote,
        payment_method: "efectivo",
        amount_received: parsedAmount,
        change_amount: Math.max(parsedAmount - parsedCost, 0),
      });
      return;
    }

    if (method === "mixto") {
      const payments = [
        { method: "efectivo", amount: splitValues.efectivo },
        { method: "tarjeta", amount: splitValues.tarjeta },
        { method: "transferencia", amount: splitValues.transferencia },
      ].filter((p) => p.amount > 0);

      onConfirm({
        final_cost: parsedCost,
        resolution_note: resolutionNote,
        payment_method: "mixto",
        amount_received: splitValues.efectivo || undefined,
        change_amount: changeAmount,
        payments,
      });
      return;
    }

    onConfirm({
      final_cost: parsedCost,
      resolution_note: resolutionNote,
      payment_method: method,
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose} className="p-6 max-w-lg" preventCloseOnOverlayClick>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-card-foreground">Entregar y Facturar Orden</h2>
          <p className="text-sm text-muted-foreground">
            Ingresa el costo final y el método de pago del servicio técnico.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Costo Final ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
              className="text-lg font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label>Nota de Resolución / Evidencia</Label>
            <Textarea
              placeholder="¿Qué se le arregló o cambió al dispositivo?"
              value={resolutionNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolutionNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <PaymentMethodSelector method={method} onSelect={setMethod} />
        </div>

        {method === "efectivo" && (
          <CashPaymentSection total={parsedCost} amountReceived={amountReceived} onChange={setAmountReceived} />
        )}

        {method === "mixto" && (
          <SplitPaymentSection total={parsedCost} splitPayments={splitPayments} onChange={setSplitPayments} />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || isSubmitting}>
            {isSubmitting ? "Facturando..." : "Facturar y Cerrar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
