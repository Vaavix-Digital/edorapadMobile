import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { LeaveRequest } from '../types';

export const instituteApi = {
  getStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.STATS);
    return response.data;
  },

  getStaffDistribution: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.STAFF_DISTRIBUTION);
    return response.data;
  },

  getAllStaff: async (search?: string): Promise<{ success: boolean; data: any[] }> => {
    const url = search ? `${API_ENDPOINTS.INSTITUTE.STAFF_ALL}?search=${encodeURIComponent(search)}` : API_ENDPOINTS.INSTITUTE.STAFF_ALL;
    const response = await api.get(url);
    return response.data;
  },

  getStaffById: async (id: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(`/api/institute/staff/${id}`);
    return response.data;
  },

  addStaff: async (staffData: any): Promise<{ success: boolean; data: any; message?: string }> => {
    const response = await api.post('/api/institute/staff/add', staffData);
    return response.data;
  },

  updateStaff: async (id: string, staffData: any): Promise<{ success: boolean; data: any; message?: string }> => {
    const response = await api.put(`/api/institute/staff/${id}`, staffData);
    return response.data;
  },

  deleteStaff: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(`/api/institute/staff/${id}`);
    return response.data;
  },

  getAllCourses: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.COURSES);
    return response.data;
  },

  getAllBatches: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.BATCHES);
    return response.data;
  },

  getBatchById: async (batchId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.BATCH_BY_ID(batchId));
    return response.data;
  },

  createBatch: async (batchData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.post(API_ENDPOINTS.INSTITUTE.CREATE_BATCH, batchData);
    return response.data;
  },

  updateBatch: async (batchId: string, batchData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.UPDATE_BATCH(batchId), batchData);
    return response.data;
  },

  deleteBatch: async (batchId: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(API_ENDPOINTS.INSTITUTE.DELETE_BATCH(batchId));
    return response.data;
  },

  getAllStudents: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.STUDENTS_ALL);
    return response.data;
  },

  getLeaves: async (): Promise<{ success: boolean; data: LeaveRequest[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.LEAVES);
    return response.data;
  },

  updateLeaveStatus: async (leaveId: string, status: 'Approved' | 'Rejected'): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.UPDATE_LEAVE_STATUS(leaveId), { status });
    return response.data;
  },

  approveLeave: async (leaveId: string): Promise<any> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.APPROVE_LEAVE(leaveId), { status: 'Approved' });
    return response.data;
  },

  rejectLeave: async (leaveId: string, reason?: string): Promise<any> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.REJECT_LEAVE(leaveId), { status: 'Rejected', reason });
    return response.data;
  },

  getFinancialOverview: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.FINANCIAL_OVERVIEW);
    return response.data;
  },

  getDepartmentBreakdown: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.DEPARTMENT_BREAKDOWN);
    return response.data;
  },

  getAdmissionRequests: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.ADMISSION_REQUESTS);
    return response.data;
  },

  getAdmissionRequestById: async (id: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.ADMISSION_REQUEST_BY_ID(id));
    return response.data;
  },

  updateAdmissionStatus: async (id: string, status: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.patch(API_ENDPOINTS.INSTITUTE.UPDATE_ADMISSION_STATUS(id), { status });
    return response.data;
  },

  getSignedUrl: async (fileUrl: string): Promise<{ success: boolean; data: { signedUrl: string } }> => {
    const response = await api.post(API_ENDPOINTS.INSTITUTE.VIEW_DOCUMENT, { fileUrl });
    return response.data;
  },

  getDepartments: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.DEPARTMENTS);
    return response.data;
  },

  getCertificates: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.CERTIFICATES);
    return response.data;
  },

  getCommunities: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.COMMUNITIES);
    return response.data;
  },

  createCommunity: async (payload: any): Promise<{ success: boolean; data: any }> => {
    const isFormData = payload instanceof FormData;
    const response = await api.post(
      API_ENDPOINTS.INSTITUTE.COMMUNITIES,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  addCommunityMembers: async (communityId: string, userIds: string[]): Promise<{ success: boolean; data: any }> => {
    const response = await api.post(API_ENDPOINTS.INSTITUTE.COMMUNITY_MEMBERS(communityId), { userIds });
    return response.data;
  },

  deleteCommunity: async (communityId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(API_ENDPOINTS.INSTITUTE.COMMUNITY_BY_ID(communityId));
    return response.data;
  },

  removeCommunityMember: async (communityId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(API_ENDPOINTS.INSTITUTE.COMMUNITY_MEMBER_BY_ID(communityId, userId));
    return response.data;
  },

  getCommunityMessages: async (communityId: string): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.COMMUNITY_MESSAGES(communityId));
    return response.data;
  },

  sendCommunityMessage: async (communityId: string, formData: FormData | { content: string }): Promise<{ success: boolean; data: any }> => {
    const isFormData = formData instanceof FormData;
    const response = await api.post(
      API_ENDPOINTS.INSTITUTE.SEND_COMMUNITY_MESSAGE(communityId),
      formData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  getSettings: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.SETTINGS);
    return response.data;
  },

  updateSettings: async (settingsData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.UPDATE_SETTINGS, settingsData);
    return response.data;
  },

  updateBasicSettings: async (payload: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const isFormData = payload instanceof FormData;
    const response = await api.put(
      API_ENDPOINTS.INSTITUTE.UPDATE_SETTINGS_BASIC,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  updateBankSettings: async (payload: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.UPDATE_SETTINGS_BANK, payload);
    return response.data;
  },

  updateAlertSettings: async (payload: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.INSTITUTE.UPDATE_SETTINGS_ALERTS, payload);
    return response.data;
  },

  getStripeStatus: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.STRIPE_STATUS);
    return response.data;
  },

  onboardStripe: async (): Promise<{ success: boolean; url?: string; data?: any }> => {
    const response = await api.post(API_ENDPOINTS.INSTITUTE.STRIPE_ONBOARD, {});
    return response.data;
  },
};
