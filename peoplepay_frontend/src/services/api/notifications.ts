import { apiFetch, ApiResponse } from './client';

export interface NotificationItem {
  id: number;
  payslip_id?: number | null;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export const notificationsApi = {
  async getNotifications(): Promise<ApiResponse<NotificationResponse>> {
    return apiFetch<NotificationResponse>('/api/notifications/', {}, { notifications: [], unread_count: 0 });
  },

  async markAllRead(): Promise<ApiResponse<{ unread_count: number }>> {
    return apiFetch<{ unread_count: number }>('/api/notifications/mark-all-read/', { method: 'POST' });
  },

  async markRead(id: number): Promise<ApiResponse<any>> {
    return apiFetch<any>(`/api/notifications/${id}/read/`, { method: 'POST' });
  },
};
