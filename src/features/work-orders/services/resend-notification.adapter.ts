import { INotificationService, INotificationPayload } from '../types/notification.types';

import { Resend } from 'resend';

export class ResendNotificationAdapter implements INotificationService {
  async sendNotification(payload: INotificationPayload): Promise<boolean> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn('RESEND_API_KEY is not defined. Skipping email dispatch.');
        return false;
      }

      const resend = new Resend(apiKey);
      
      const { data, error } = await resend.emails.send({
        from: 'PRIGMA <onboarding@resend.dev>', // In production, use your verified domain
        to: payload.to,
        subject: payload.subject,
        html: payload.body
      });

      if (error) {
        console.error('Resend API Error:', error);
        return false;
      }

      console.log('Email successfully sent. ID:', data?.id);
      return true;
    } catch (error) {
      console.error('Unexpected error sending email:', error);
      return false;
    }
  }
}
