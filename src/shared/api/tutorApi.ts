import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { Batch, LiveClass } from '../types';

export const tutorApi = {
  getDashboard: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.DASHBOARD);
    return response.data;
  },

  getDashboardStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.STATS);
    return response.data;
  },

  getDashboardTasks: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.DASHBOARD_TASKS);
    return response.data;
  },

  getDashboardAttendance: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.DASHBOARD_ATTENDANCE);
    return response.data;
  },

  getDashboardBatchAttendance: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.DASHBOARD_BATCH_ATTENDANCE);
    return response.data;
  },

  getUpcomingActivities: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.DASHBOARD_UPCOMING_ACTIVITIES);
    return response.data;
  },

  getMonthlyAttendance: async (month: string | number, year: string | number): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.MONTHLY_ATTENDANCE(month, year));
    return response.data;
  },

  getBatches: async (): Promise<{ success: boolean; data: Batch[] }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.BATCHES);
    return response.data;
  },

  getTasks: async (filters: any = {}): Promise<{ success: boolean; data: any[] }> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.date) params.append('date', filters.date);
    if (filters.batchId && filters.batchId !== 'All Batches') params.append('batchId', filters.batchId);
    const queryString = params.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.TUTOR.TASKS}?${queryString}` : API_ENDPOINTS.TUTOR.TASKS;
    const response = await api.get(endpoint);
    return response.data;
  },

  createTask: async (taskData: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.post(API_ENDPOINTS.TUTOR.TASKS, taskData);
    return response.data;
  },

  updateTaskStatus: async (taskId: string, isCompleted: boolean): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(API_ENDPOINTS.TUTOR.TASK_BY_ID(taskId), { isCompleted });
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.delete(API_ENDPOINTS.TUTOR.TASK_BY_ID(taskId));
    return response.data;
  },

  getLiveClasses: async (): Promise<{ success: boolean; data: LiveClass[] }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.LIVE_CLASSES);
    return response.data;
  },

  scheduleLiveClass: async (classData: Partial<LiveClass>): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.TUTOR.SCHEDULE_LIVE_CLASS, classData);
    return response.data;
  },

  applyLeave: async (leaveData: { startDate: string; endDate: string; reason: string; type?: string }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.TUTOR.LEAVE_REQUEST, leaveData);
    return response.data;
  },

  getLeaveHistory: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.LEAVE_HISTORY);
    return response.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.TUTOR.PROFILE);
    return response.data;
  },

  updateProfile: async (payload: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const isFormData = payload instanceof FormData;
    const response = await api.put(
      API_ENDPOINTS.TUTOR.UPDATE_SETTINGS_PROFILE,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  updateBank: async (bankData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.TUTOR.UPDATE_SETTINGS_BANK, bankData);
    return response.data;
  },

  updateNotifications: async (notifData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.patch(API_ENDPOINTS.TUTOR.UPDATE_SETTINGS_NOTIFICATIONS, notifData);
    return response.data;
  },
};
