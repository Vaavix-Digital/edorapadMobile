import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../shared/constants';
import { TokenProvider } from '../shared/api/client';

export const storageService = {
  // Secure Storage for Tokens
  setToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  setRefreshToken: async (refreshToken: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  clearAuthTokens: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {}
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // General App Cache
  setItem: async (key: string, value: any): Promise<void> => {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  },

  getItem: async <T>(key: string): Promise<T | null> => {
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  }
};

export const mobileTokenProvider: TokenProvider = {
  getToken: () => storageService.getToken(),
  getRefreshToken: () => storageService.getRefreshToken(),
  setTokens: async (token, refreshToken) => {
    await storageService.setToken(token);
    if (refreshToken) {
      await storageService.setRefreshToken(refreshToken);
    }
  },
  clearTokens: () => storageService.clearAuthTokens()
};
