import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { FeeDetail, LiveClass, Exam, Invoice } from '../types';

export const studentApi = {
  getDashboard: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.DASHBOARD);
    return response.data;
  },

  getFeeDetails: async (): Promise<{ success: boolean; data: { courses: FeeDetail[] } }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.FEE_DETAILS);
    return response.data;
  },

  getPaymentHistory: async (): Promise<{ success: boolean; data: Invoice[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.PAYMENTS_HISTORY);
    return response.data;
  },

  getInvoice: async (transactionId: string): Promise<{ success: boolean; data: Invoice }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.INVOICE(transactionId));
    return response.data;
  },

  getClasses: async (): Promise<{ success: boolean; data: LiveClass[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.CLASSES);
    return response.data;
  },

  getRecordedClasses: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.RECORDED_CLASSES);
    return response.data;
  },

  getEnrolledCourses: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.COURSES_ENROLLED);
    return response.data;
  },

  getAssessments: async (category?: string): Promise<{ success: boolean; data: Exam[] }> => {
    const params = category ? { category } : undefined;
    const response = await api.get(API_ENDPOINTS.STUDENT.ASSESSMENTS, { params });
    return response.data;
  },

  getCertificates: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.CERTIFICATES);
    return response.data;
  },

  getDashboardStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.DASHBOARD_STATS);
    return response.data;
  },

  getCourseCompletion: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.COURSE_COMPLETION);
    return response.data;
  },

  getStudyHours: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.STUDY_HOURS);
    return response.data;
  },

  getUpcomingActivities: async (limit: number = 10): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.UPCOMING_ACTIVITIES(limit));
    return response.data;
  },

  getReferralProgram: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.REFERRAL_PROGRAM);
    return response.data;
  },

  getReferralHistory: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.REFERRAL_HISTORY);
    return response.data;
  },

  getCommunities: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.COMMUNITIES);
    return response.data;
  },

  getCommunityMessages: async (communityId: string): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.COMMUNITY_MESSAGES(communityId));
    return response.data;
  },

  sendCommunityMessage: async (communityId: string, data: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.post(API_ENDPOINTS.STUDENT.COMMUNITY_MESSAGES(communityId), data);
    return response.data;
  },

  getSettings: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.SETTINGS);
    return response.data;
  },

  updateSettings: async (data: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.put(API_ENDPOINTS.STUDENT.UPDATE_SETTINGS, data);
    return response.data;
  },

  updateNotificationSettings: async (data: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(API_ENDPOINTS.STUDENT.UPDATE_NOTIFICATIONS, data);
    return response.data;
  },

  updatePaymentSettings: async (data: any): Promise<{ success: boolean; data: any }> => {
    const response = await api.put(API_ENDPOINTS.STUDENT.UPDATE_PAYMENT, data);
    return response.data;
  },

  deleteAccount: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.delete(API_ENDPOINTS.STUDENT.DELETE_ACCOUNT);
    return response.data;
  },

  getAttendanceAnalytics: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.ATTENDANCE_ANALYTICS);
    return response.data;
  },

  getCoursePerformance: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.STUDENT.COURSE_PERFORMANCE);
    return response.data;
  }
};
