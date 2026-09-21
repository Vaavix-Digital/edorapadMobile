import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { AppNotification } from '../types';

export const parentApi = {
  getDashboard: async (): Promise<{
    success: boolean;
    data: any[];
    parentName?: string;
    totalAssignmentCount?: number;
    studentSubmittedCount?: number;
  }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.DASHBOARD);
    return response.data;
  },

  getStudentAttendance: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.ATTENDANCE);
    return response.data;
  },

  getNotifications: async (): Promise<{ success: boolean; data: AppNotification[] }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.NOTIFICATIONS);
    return response.data;
  },

  getAllNotifications: async (
    page: number = 1,
    search: string = ''
  ): Promise<{
    success: boolean;
    data: any[];
    summary: { total: number; page: number; pages: number };
  }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.NOTIFICATIONS_ALL(page, search));
    return response.data;
  },

  clearAllNotifications: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(API_ENDPOINTS.PARENT.CLEAR_ALL_NOTIFICATIONS);
    return response.data;
  },

  getPendingExams: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.PENDING_EXAMS);
    return response.data;
  },

  getExamResults: async (page: number = 1): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.EXAM_RESULTS(page));
    return response.data;
  },

  getAssignmentResults: async (page: number = 1): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.ASSIGNMENT_RESULTS(page));
    return response.data;
  },

  getQuizResults: async (page: number = 1): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.QUIZ_RESULTS(page));
    return response.data;
  },

  getProfile: async (): Promise<{
    success: boolean;
    data: {
      profile: any;
      settings: any;
      children: any[];
    };
  }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.PROFILE);
    return response.data;
  },

  updatePreferences: async (preferences: {
    emailAlerts?: boolean;
    whatsappAlerts?: boolean;
  }): Promise<{ success: boolean; message?: string; data: any }> => {
    const response = await api.patch(API_ENDPOINTS.PARENT.UPDATE_PREFERENCES, preferences);
    return response.data;
  },

  updateProfile: async (profileData: any): Promise<{ success: boolean; message?: string; data: any }> => {
    const response = await api.put(API_ENDPOINTS.PARENT.UPDATE_PROFILE, profileData);
    return response.data;
  },

  getFeeDues: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.PARENT.FEES);
    return response.data;
  },
};
