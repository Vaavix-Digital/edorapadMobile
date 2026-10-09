import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface TokenProvider {
  getToken: () => Promise<string | null> | string | null;
  getRefreshToken?: () => Promise<string | null> | string | null;
  setTokens?: (token: string, refreshToken?: string) => Promise<void> | void;
  clearTokens?: () => Promise<void> | void;
}

let activeTokenProvider: TokenProvider | null = null;
// let apiBaseUrl = 'http://192.168.1.13:5002';
let apiBaseUrl = 'https://server.edorapad.com';

export const configureApiClient = (options: {
  baseUrl: string;
  tokenProvider?: TokenProvider;
}) => {
  apiBaseUrl = options.baseUrl;
  // Also update the singleton instance that was created at import time
  api.defaults.baseURL = options.baseUrl;
  if (options.tokenProvider) {
    activeTokenProvider = options.tokenProvider;
  }
};

export const createApiClient = (baseURL?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseURL || apiBaseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    withCredentials: true
  });

  // Request interceptor: attach token
  instance.interceptors.request.use(
    async (config) => {
      let token: string | null = null;
      if (activeTokenProvider) {
        token = await activeTokenProvider.getToken();
      }
      if (!token) {
        try {
          const { storageService } = await import('../../services/storage');
          token = await storageService.getToken();
        } catch {}
      }
      if (!token) {
        try {
          const { store } = await import('../../store');
          token = store.getState().auth.token;
        } catch {}
      }
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: auto-refresh on 401
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/api/auth/login') &&
        !originalRequest.url?.includes('/api/auth/google') &&
        !originalRequest.url?.includes('/api/auth/signup') &&
        !originalRequest.url?.includes('/api/auth/refresh')
      ) {
        originalRequest._retry = true;
        try {
          const refreshRes = await axios.post(`${apiBaseUrl}/api/auth/refresh`, {}, { withCredentials: true });
          const newToken = refreshRes.data?.accessToken || refreshRes.data?.token;
          if (newToken && activeTokenProvider?.setTokens) {
            await activeTokenProvider.setTokens(newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return instance(originalRequest);
          }
        } catch (refreshErr) {
          if (activeTokenProvider?.clearTokens) {
            await activeTokenProvider.clearTokens();
          }
          return Promise.reject(refreshErr);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = createApiClient();
