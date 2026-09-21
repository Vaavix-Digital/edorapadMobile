import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { User, AuthResponse } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string; role?: string }): Promise<AuthResponse> => {
    // Backend expects 'identifier', not 'email'
    const { email, ...rest } = credentials;
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { identifier: email, ...rest });
    return response.data;
  },

  register: async (userData: Record<string, any>): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  logout: async (): Promise<boolean> => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return true;
    } catch {
      return true;
    }
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await api.post<{ accessToken: string }>(API_ENDPOINTS.AUTH.REFRESH);
    return response.data;
  },

  forgotPassword: async (identifier: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { identifier });
    return response.data;
  },

  resetPassword: async (data: { identifier: string; otp: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  },

  registerDeviceToken: async (deviceData: { token: string; platform: string; userId: string }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER_DEVICE, deviceData);
    return response.data;
  }
};
