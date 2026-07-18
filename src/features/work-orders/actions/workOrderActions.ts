"use server";

import { createClient } from "@/lib/supabase/server";
import { WorkOrder, WorkOrderStatus, CreateWorkOrderDTO } from "../types/work-order.types";
import { revalidatePath } from "next/cache";
import { WorkOrderNotifier } from "../services/work-order-notifier";
import { ResendNotificationAdapter } from "../services/resend-notification.adapter";

export async function createWorkOrder(data: CreateWorkOrderDTO) {
  const supabase = await createClient();

  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .insert({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      custom_metadata: data.custom_metadata,
      estimated_cost: data.estimated_cost || null,
      notes: data.notes || null,
      status: "DRAFT",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating work order:", error);
    return { error: error.message };
  }

  // Notify user about creation
  const notifier = new WorkOrderNotifier(new ResendNotificationAdapter());
  await notifier.notifyCreation(workOrder as WorkOrder);

  revalidatePath("/admin/work-orders");
  return { data: workOrder };
}

export async function updateWorkOrderStatus(id: string, newStatus: WorkOrderStatus) {
  const supabase = await createClient();

  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating work order status:", error);
    return { error: error.message };
  }

  // Notify user
  const notifier = new WorkOrderNotifier(new ResendNotificationAdapter());
  await notifier.notifyStatusChange(workOrder as WorkOrder, newStatus);

  revalidatePath(`/admin/work-orders`);
  revalidatePath(`/admin/work-orders/${id}`);
  return { data: workOrder };
}

export async function addEvidence(workOrderId: string, stage: string, imageUrl: string, notes?: string) {
  const supabase = await createClient();

  const { data: evidence, error } = await supabase
    .from("work_order_evidence")
    .insert({
      work_order_id: workOrderId,
      stage,
      image_url: imageUrl,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding evidence:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/work-orders/${workOrderId}`);
  return { data: evidence };
}
