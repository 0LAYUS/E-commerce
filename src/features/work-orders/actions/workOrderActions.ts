"use server";

import { createClient } from "@/lib/supabase/server";
import { WorkOrder, WorkOrderStatus, CreateWorkOrderDTO } from "../types/work-order.types";
import { revalidatePath } from "next/cache";

export async function createWorkOrder(data: CreateWorkOrderDTO) {
  const supabase = await createClient();

  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .insert({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      device_model: data.device_model,
      issue_description: data.issue_description,
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
