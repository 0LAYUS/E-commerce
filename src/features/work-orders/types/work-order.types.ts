export type WorkOrderStatus = 
  | 'DRAFT'
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface WorkOrder {
  id: string;
  tracking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  status: WorkOrderStatus;
  custom_metadata: Record<string, any>;
  estimated_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderEvidence {
  id: string;
  work_order_id: string;
  stage: string;
  image_url: string;
  notes: string | null;
  created_at: string;
}

export interface CreateWorkOrderDTO {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  custom_metadata: Record<string, any>;
  estimated_cost?: number;
  notes?: string;
}

export interface WorkOrderTemplate {
  id: string;
  tenant_id: string;
  name: string;
  schema: Record<string, any>;
  created_at: string;
  updated_at: string;
}
