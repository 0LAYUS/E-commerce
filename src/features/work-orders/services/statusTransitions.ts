import { WorkOrderStatus } from "../types/work-order.types";

const statusFlow: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionTo(current: WorkOrderStatus, next: WorkOrderStatus): boolean {
  if (current === next) return true;
  return statusFlow[current].includes(next);
}
