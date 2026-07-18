import { INotificationService } from '../types/notification.types';
import { WorkOrder } from '../types/work-order.types';

export class WorkOrderNotifier {
  private readonly appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  constructor(private readonly notificationService: INotificationService) {}

  private buildEmailTemplate(title: string, message: string, trackingUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-w-xl mx-auto; p-4; color: #333;">
        <h2 style="color: #2E3A59;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${trackingUrl}" style="background-color: #2E3A59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Rastrear mi Orden</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">Si el botón no funciona, copia y pega este enlace en tu navegador: <br>${trackingUrl}</p>
      </div>
    `;
  }

  async notifyCreation(order: WorkOrder) {
    if (!order.customer_email) return;

    const trackingUrl = `${this.appUrl}/tracking?id=${order.tracking_id}`;
    
    await this.notificationService.sendNotification({
      to: order.customer_email,
      subject: `Hemos recibido tu orden: ${order.tracking_id}`,
      body: this.buildEmailTemplate(
        "Orden de Servicio Recibida",
        `Hola ${order.customer_name}, hemos creado una nueva orden de servicio para ti. Puedes hacer seguimiento del progreso, ver las fotos y el costo estimado en tiempo real a través de nuestro portal de rastreo.`,
        trackingUrl
      ),
      workOrderId: order.id,
      status: order.status
    });
  }

  async notifyStatusChange(order: WorkOrder, newStatus: string) {
    if (!order.customer_email) return;
    
    const trackingUrl = `${this.appUrl}/tracking?id=${order.tracking_id}`;

    // Optionally map standard statuses to Spanish in the email body
    const statusMap: Record<string, string> = {
      DRAFT: 'Borrador',
      RECEIVED: 'Recibido',
      IN_PROGRESS: 'En Progreso',
      ON_HOLD: 'En Pausa',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado'
    };
    
    const statusEs = statusMap[newStatus] || newStatus;

    await this.notificationService.sendNotification({
      to: order.customer_email,
      subject: `Actualización de tu orden ${order.tracking_id}`,
      body: this.buildEmailTemplate(
        "Actualización de Servicio",
        `Hola ${order.customer_name}, tu orden de servicio ha cambiado al estado: <strong>${statusEs}</strong>. Para más detalles, ingresa al portal de rastreo.`,
        trackingUrl
      ),
      workOrderId: order.id,
      status: newStatus
    });
  }
}
