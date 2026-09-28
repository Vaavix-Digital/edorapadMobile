import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../shared/api/client';
import { API_ENDPOINTS } from '../shared/constants/endpoints';

let messagingModule: any = null;
try {
  messagingModule = require('@react-native-firebase/messaging').default;
} catch (e) {
  console.warn('[Push] @react-native-firebase/messaging not available in current runtime:', e);
}

const FCM_TOKEN_KEY = 'fcmToken';
export const devicePlatform = Platform.OS;

/**
 * Request notification permissions (Android 13+ and iOS)
 */
export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[Push] POST_NOTIFICATIONS permission denied');
        return false;
      }
    } catch (err) {
      console.warn('[Push] Error requesting Android 13 POST_NOTIFICATIONS permission:', err);
    }
  }

  if (!messagingModule) {
    return false;
  }

  try {
    const authStatus = await messagingModule().requestPermission();
    return (
      authStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
      authStatus === messagingModule.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('[Push] Firebase requestPermission error:', error);
    return false;
  }
}

/**
 * Get current FCM device token from Firebase
 */
export async function getFcmToken(): Promise<string | null> {
  if (!messagingModule) {
    return null;
  }

  try {
    const permissionGranted = await requestPushPermission();
    if (!permissionGranted) {
      return null;
    }

    if (Platform.OS === 'ios') {
      await messagingModule().registerDeviceForRemoteMessages();
    }

    const token = await messagingModule().getToken();
    return token || null;
  } catch (error) {
    console.warn('[Push] FCM token unavailable:', error);
    return null;
  }
}

/**
 * Save FCM token to local storage
 */
export async function saveFcmToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    }
  } catch (error) {
    console.warn('[Push] Failed to persist FCM token locally:', error);
  }
}

/**
 * Load FCM token from local storage
 */
export async function loadFcmToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Initialize token refresh listener (Firebase rotates token)
 */
export function initPushTokenListeners(): () => void {
  if (!messagingModule) {
    return () => {};
  }

  try {
    const unsubscribe = messagingModule().onTokenRefresh(async (fcmToken: string) => {
      try {
        console.log('[Push] Token refreshed by Firebase:', fcmToken);
        await api.post(API_ENDPOINTS.PUSH.DEVICE_TOKEN, {
          fcmToken,
          platform: devicePlatform,
        });
        await saveFcmToken(fcmToken);
      } catch (error) {
        console.warn('[Push] Failed to register refreshed token with backend:', error);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.warn('[Push] Failed to subscribe to onTokenRefresh:', error);
    return () => {};
  }
}

/**
 * Sync device token with backend on app start for existing logged-in sessions
 */
export async function syncPushTokenWithBackend(): Promise<void> {
  try {
    const token = await getFcmToken();
    if (token) {
      await saveFcmToken(token);
      await api.post(API_ENDPOINTS.PUSH.DEVICE_TOKEN, {
        fcmToken: token,
        platform: devicePlatform,
      });
      console.log('[Push] Successfully synced device token on app start');
    }
  } catch (error) {
    console.warn('[Push] Failed to sync device token on app start:', error);
  }
}
