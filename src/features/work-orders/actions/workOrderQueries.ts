import { createClient } from "@/lib/supabase/server";
import { WorkOrder } from "../types/work-order.types";

export async function getWorkOrders(
  status?: string,
  search?: string
): Promise<WorkOrder[]> {
  const supabase = await createClient();

  let query = supabase
    .from("work_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,tracking_id.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching work orders:", error);
    return [];
  }

  return data as WorkOrder[];
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching work order by id:", error);
    return null;
  }
  return data as WorkOrder;
}

export async function getWorkOrderEvidence(workOrderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_order_evidence")
    .select("*")
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching evidence:", error);
    return [];
  }
  return data;
}
