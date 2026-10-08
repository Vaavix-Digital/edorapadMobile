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

  resetPassword: async (data: { identifier: string; otp: string; newPassword: string; confirmPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  },

  verifyPhone: async (data: { phoneNumber: string; otp: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_PHONE, data);
    return response.data;
  },

  resendOtp: async (data: { phoneNumber: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.RESEND_OTP, data);
    return response.data;
  },

  /**
   * Sign in / sign up with Google ID token.
   * Mirrors the web's POST /api/auth/google endpoint.
   * A new user must supply `role`; existing users can omit it.
   */
  googleLogin: async (payload: {
    idToken?: string;
    credential?: string;
    role?: string;
    fcmToken?: string;
    platform?: string;
  }): Promise<AuthResponse> => {
    const tokenStr = payload.idToken || payload.credential;
    const body: Record<string, any> = {
      idToken: tokenStr,
      credential: payload.credential || tokenStr,
      ...(payload.role ? { role: payload.role } : {}),
      ...(payload.fcmToken
        ? {
            fcmToken: payload.fcmToken,
            platform: payload.platform || 'android',
          }
        : {}),
    };
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.GOOGLE, body);
    return response.data;
  },

  registerDeviceToken: async (deviceData: { fcmToken: string; platform: string }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.PUSH.DEVICE_TOKEN, deviceData);
    return response.data;
  },

  /**
   * Request liveness challenge steps from backend
   * POST /api/auth/face-challenge
   */
  faceChallenge: async (
    extra?: { token?: string; userId?: string }
  ): Promise<{
    success?: boolean;
    challengeId: string;
    steps: Array<'CENTER' | 'TURN_LEFT' | 'TURN_RIGHT' | string>;
    expiresInSeconds?: number;
    raw?: any;
  }> => {
    const headers: Record<string, string> = {};
    if (extra?.token) {
      headers.Authorization = `Bearer ${extra.token}`;
    }
    const body: Record<string, any> = {};
    if (extra?.userId) {
      body.userId = extra.userId;
    }
    const response = await api.post(
      API_ENDPOINTS.AUTH.FACE_CHALLENGE,
      body,
      { headers, timeout: 15000 }
    );
    const raw = response.data;
    console.log('[authApi.faceChallenge] Server response:', JSON.stringify(raw));

    // The backend returns: { success: true, data: { challengeId, steps, expiresInSeconds } }
    // Support nested data.data, flat data, and challenge sub-objects
    const inner = raw?.data && typeof raw.data === 'object' ? raw.data : raw;

    const challengeId =
      inner?.challengeId ||
      raw?.challengeId ||
      inner?.challenge?.id ||
      raw?.challenge?.id ||
      inner?.id ||
      raw?.id ||
      '';

    const steps =
      inner?.steps ||
      raw?.steps ||
      inner?.challenge?.steps ||
      raw?.challenge?.steps ||
      ['CENTER', 'TURN_LEFT', 'TURN_RIGHT'];

    const expiresInSeconds =
      inner?.expiresInSeconds ||
      raw?.expiresInSeconds ||
      90;

    return {
      success: raw?.success ?? true,
      challengeId,
      steps,
      expiresInSeconds,
      raw,
    };
  },

  /**
   * First-time face enrolment — sends liveness frames or multipart image
   * POST /api/auth/face-init
   */
  faceInit: async (
    payload: { challengeId: string; frames: string[] } | string | { uri?: string; base64?: string },
    extra?: { userId?: string; token?: string }
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const headers: Record<string, string> = {};
    if (extra?.token) {
      headers.Authorization = `Bearer ${extra.token}`;
    }

    if (typeof payload === 'object' && 'challengeId' in payload) {
      const response = await api.post(
        API_ENDPOINTS.AUTH.FACE_INIT,
        {
          challengeId: payload.challengeId,
          frames: payload.frames.map((f) => (f.startsWith('data:') ? f : `data:image/jpeg;base64,${f}`)),
          ...(extra?.userId ? { userId: extra.userId } : {}),
        },
        { headers, timeout: 60000 }
      );
      const resData = response.data;
      console.log('[authApi.faceInit] Server response:', JSON.stringify(resData));
      const isSuccess =
        resData?.success === true ||
        resData?.status === 'success' ||
        resData?.data?.success === true ||
        (response.status >= 200 && response.status < 300 && resData?.success !== false);
      return {
        success: isSuccess,
        message:
          resData?.message ||
          resData?.msg ||
          resData?.data?.message ||
          (isSuccess ? 'Face enrolled successfully' : 'Face enrolment failed'),
        data: resData?.data || resData,
      };
    }

    const formData = new FormData();
    const fileUri = typeof payload === 'object' ? payload.uri : undefined;
    const base64Data = typeof payload === 'string' ? payload : (payload as any).base64;

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

    const response = await api.post(API_ENDPOINTS.AUTH.FACE_INIT, formData, {
      headers,
      transformRequest: (data, reqHeaders) => {
        if (reqHeaders) delete (reqHeaders as any)['Content-Type'];
        return data;
      },
      timeout: 60000,
    });
    const resData = response.data;
    console.log('[authApi.faceInit] Multipart response:', JSON.stringify(resData));
    const isSuccess =
      resData?.success === true ||
      resData?.status === 'success' ||
      resData?.data?.success === true ||
      (response.status >= 200 && response.status < 300 && resData?.success !== false);
    return {
      success: isSuccess,
      message:
        resData?.message ||
        resData?.msg ||
        resData?.data?.message ||
        (isSuccess ? 'Face enrolled successfully' : 'Face enrolment failed'),
      data: resData?.data || resData,
    };
  },

  /**
   * Subsequent face verification — sends captured liveness challenge + frames
   * POST /api/auth/face-verify
   */
  faceVerify: async (
    payload: { challengeId: string; frames: string[] } | string,
    extra?: { userId?: string; token?: string }
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const headers: Record<string, string> = {};
    if (extra?.token) {
      headers.Authorization = `Bearer ${extra.token}`;
    }

    const body: Record<string, any> = typeof payload === 'string'
      ? {
          capturedImage: payload.startsWith('data:') ? payload : `data:image/jpeg;base64,${payload}`,
          ...(extra?.userId ? { userId: extra.userId } : {}),
        }
      : {
          challengeId: payload.challengeId,
          frames: payload.frames.map((f) => (f.startsWith('data:') ? f : `data:image/jpeg;base64,${f}`)),
          ...(extra?.userId ? { userId: extra.userId } : {}),
        };

    const response = await api.post(
      API_ENDPOINTS.AUTH.VERIFY_FACE,
      body,
      {
        headers,
        timeout: 60000,
      }
    );
    const resData = response.data;
    console.log('[authApi.faceVerify] Server response:', JSON.stringify(resData));
    const isSuccess =
      resData?.success === true ||
      resData?.status === 'success' ||
      resData?.data?.success === true ||
      (response.status >= 200 && response.status < 300 && resData?.success !== false);
    return {
      success: isSuccess,
      message:
        resData?.message ||
        resData?.msg ||
        resData?.data?.message ||
        (isSuccess ? 'Face verified successfully' : 'Biometric mismatch'),
      data: resData?.data || resData,
    };
  },

  /**
   * Deactivate/soft-delete the user's account
   * DELETE /api/auth/delete-account
   */
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(API_ENDPOINTS.AUTH.DELETE_ACCOUNT);
    return response.data;
  },
};


