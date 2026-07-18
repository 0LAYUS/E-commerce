import { INotificationService, INotificationPayload } from '../types/notification.types';

export class ResendNotificationAdapter implements INotificationService {
  async sendNotification(payload: INotificationPayload): Promise<boolean> {
    try {
      // In a real app we would use resend here.
      // import { Resend } from 'resend';
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({
      //   from: 'onboarding@resend.dev',
      //   to: payload.to,
      //   subject: payload.subject,
      //   html: `<p>${payload.body}</p>`
      // });
      
      console.log('Mocking Resend email sent to:', payload.to, 'Subject:', payload.subject, 'Body:', payload.body);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
