import { INotificationService } from '../types/notification.types';
import { WorkOrder } from '../types/work-order.types';

export class WorkOrderNotifier {
  constructor(private readonly notificationService: INotificationService) {}

  async notifyStatusChange(order: WorkOrder, newStatus: string) {
    const to = order.customer_phone || order.customer_name; // Simulating email/phone destination
    
    await this.notificationService.sendNotification({
      to,
      subject: `Actualización de tu orden ${order.tracking_id}`,
      body: `Tu orden ha cambiado al estado: ${newStatus}`,
      workOrderId: order.id,
      status: newStatus
    });
  }
}
