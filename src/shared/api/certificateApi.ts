import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import {
  CertificateStats,
  CertificateRequest,
  CertificateTemplate,
  IssuedCertificate,
} from '../types';

export const certificateApi = {
  getStats: async (): Promise<{ success: boolean; data: CertificateStats }> => {
    const response = await api.get(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.STATS);
    return response.data;
  },

  getRequests: async (status?: string | null): Promise<{ success: boolean; data: CertificateRequest[] }> => {
    let apiStatus = status;
    if (status) {
      apiStatus = status.toLowerCase() === 'pending' ? 'Pending' : status.toLowerCase();
    }
    const response = await api.get(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.REQUESTS(apiStatus));
    return response.data;
  },

  approveRequest: async (
    requestId: string,
    data: { status: 'approved' | 'rejected' | string; statusReason?: string }
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.post(
      API_ENDPOINTS.CERTIFICATE_MANAGEMENT.APPROVE_REQUEST(requestId),
      data
    );
    return response.data;
  },

  bulkApproveRequests: async (data: {
    requestIds: string[];
    status: 'approved' | 'rejected' | string;
    statusReason?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.put(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.BULK_APPROVE, data);
    return response.data;
  },

  getTemplates: async (status?: string | null): Promise<{ success: boolean; data: CertificateTemplate[] }> => {
    const response = await api.get(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.TEMPLATES(status));
    return response.data;
  },

  getTemplateDetails: async (templateId: string): Promise<{ success: boolean; data: CertificateTemplate }> => {
    const response = await api.get(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.TEMPLATE_BY_ID(templateId));
    return response.data;
  },

  createTemplate: async (templateData: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const isFormData = templateData instanceof FormData;
    const response = await api.post(
      API_ENDPOINTS.CERTIFICATE_MANAGEMENT.CREATE_TEMPLATE,
      templateData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  updateTemplate: async (
    templateId: string,
    templateData: any
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    const isFormData = templateData instanceof FormData;
    const response = await api.put(
      API_ENDPOINTS.CERTIFICATE_MANAGEMENT.UPDATE_TEMPLATE(templateId),
      templateData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  deleteTemplate: async (templateId: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.DELETE_TEMPLATE(templateId));
    return response.data;
  },

  getCertificates: async (params?: Record<string, any>): Promise<{ success: boolean; data: IssuedCertificate[] }> => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const response = await api.get(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.ALL_CERTIFICATES(query));
    return response.data;
  },

  generateCertificate: async (data: {
    studentId: string;
    courseId: string;
    batchId: string;
    templateId: string;
    certificateType?: string;
    issueDate?: string;
    issuedBy: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.post(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.GENERATE, data);
    return response.data;
  },

  uploadCertificate: async (formData: FormData): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await api.post(
      API_ENDPOINTS.CERTIFICATE_MANAGEMENT.UPLOAD,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteCertificate: async (certificateId: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(
      API_ENDPOINTS.CERTIFICATE_MANAGEMENT.CERTIFICATE_BY_ID(certificateId)
    );
    return response.data;
  },

  searchStudents: async (params: Record<string, any>): Promise<{ success: boolean; data: any[] }> => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(API_ENDPOINTS.CERTIFICATE_MANAGEMENT.SEARCH_STUDENTS(query));
    return response.data;
  },
};
