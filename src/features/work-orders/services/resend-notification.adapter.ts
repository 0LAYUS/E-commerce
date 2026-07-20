import { INotificationService, INotificationPayload } from '../types/notification.types';

import { Resend } from 'resend';

export class ResendNotificationAdapter implements INotificationService {
  async sendNotification(payload: INotificationPayload): Promise<boolean> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'PRIGMA <onboarding@resend.dev>';
      
      if (!apiKey) {
        console.warn('⚠️ [WorkOrderNotifier] RESEND_API_KEY is not defined. Skipping email dispatch.');
        return false;
      }

      console.log(`📧 [WorkOrderNotifier] Intentando enviar correo a: ${payload.to} desde: ${fromEmail}`);

      const resend = new Resend(apiKey);
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.body
      });

      if (error) {
        console.error('❌ [WorkOrderNotifier] Resend API Error:', error);
        return false;
      }

      console.log('✅ [WorkOrderNotifier] Email successfully sent. ID:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ [WorkOrderNotifier] Unexpected error sending email:', error);
      return false;
    }
  }
}
