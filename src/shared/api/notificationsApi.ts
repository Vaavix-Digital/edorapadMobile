import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { AppNotification } from '../types';

export const notificationsApi = {
  getInstituteNotifications: async (): Promise<{
    success: boolean;
    data?: AppNotification[];
    notifications?: AppNotification[];
    count?: number;
    unreadCount?: number;
  }> => {
    try {
      const response = await api.get(API_ENDPOINTS.INSTITUTE.NOTIFICATIONS);
      return response.data;
    } catch {
      const response = await api.get(API_ENDPOINTS.INSTITUTE.NOTIFICATIONS_ALT);
      return response.data;
    }
  },

  markRead: async (id: string): Promise<any> => {
    try {
      const response = await api.get(API_ENDPOINTS.INSTITUTE.MARK_NOTIFICATION_READ(id));
      return response.data;
    } catch {
      const response = await api.post(`/api/institute/notifications/${id}/read`);
      return response.data;
    }
  },

  markAllRead: async (): Promise<any> => {
    try {
      const response = await api.put(API_ENDPOINTS.INSTITUTE.MARK_ALL_NOTIFICATIONS_READ);
      return response.data;
    } catch {
      const response = await api.post('/api/institute/notifications/mark-all-read');
      return response.data;
    }
  },
};
