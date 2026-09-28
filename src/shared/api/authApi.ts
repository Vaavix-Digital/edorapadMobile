import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { User, AuthResponse } from '../types';

export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
    role?: string;
    fcmToken?: string;
    platform?: string;
  }): Promise<AuthResponse> => {
    // Backend expects 'identifier', not 'email'
    const { email, fcmToken, platform, ...rest } = credentials;
    const payload: Record<string, any> = {
      identifier: email,
      ...rest,
    };
    if (fcmToken) {
      payload.fcmToken = fcmToken;
      payload.platform = platform || 'android';
    }
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
  },

  register: async (userData: Record<string, any>): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  logout: async (data?: { fcmToken?: string | null }): Promise<boolean> => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT, data?.fcmToken ? { fcmToken: data.fcmToken } : {});
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

  registerDeviceToken: async (deviceData: { fcmToken: string; platform: string }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.PUSH.DEVICE_TOKEN, deviceData);
    return response.data;
  },

  /**
   * First-time face enrolment — sends face image as multipart/form-data
   * POST /api/auth/face-init
   */
  faceInit: async (
    imageInput: string | { uri?: string; base64?: string },
    extra?: { userId?: string; token?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    const fileUri = typeof imageInput === 'object' ? imageInput.uri : undefined;
    const base64Data = typeof imageInput === 'string' ? imageInput : imageInput.base64;

    if (fileUri) {
      formData.append('face', {
        uri: fileUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);
    } else if (base64Data) {
      formData.append('face', {
        uri: base64Data,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);
    }

    if (extra?.userId) {
      formData.append('userId', extra.userId);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (extra?.token) {
      headers.Authorization = `Bearer ${extra.token}`;
    }

    const response = await api.post(API_ENDPOINTS.AUTH.FACE_INIT, formData, {
      headers,
      timeout: 30000,
    });
    return response.data;
  },

  /**
   * Subsequent face verification — sends captured base64 image
   * POST /api/auth/face-verify
   */
  faceVerify: async (
    imageBase64: string,
    extra?: { userId?: string; token?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const headers: Record<string, string> = {};
    if (extra?.token) {
      headers.Authorization = `Bearer ${extra.token}`;
    }

    const response = await api.post(
      API_ENDPOINTS.AUTH.VERIFY_FACE,
      {
        capturedImage: imageBase64,
        ...(extra?.userId ? { userId: extra.userId } : {}),
      },
      {
        headers,
        timeout: 30000,
      }
    );
    return response.data;
  },
};


