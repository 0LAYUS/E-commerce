export interface INotificationPayload {
  to: string;
  subject: string;
  body: string;
  workOrderId: string;
  status: string;
}

export interface INotificationService {
  sendNotification(payload: INotificationPayload): Promise<boolean>;
}
