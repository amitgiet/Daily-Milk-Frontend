export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string | number;
  title: string;
  message: string;
  createdAt?: string;
  type: NotificationType;
}

export interface NotificationsResponse {
  success: boolean;
  message?: string;
  data: AppNotification[];
}
