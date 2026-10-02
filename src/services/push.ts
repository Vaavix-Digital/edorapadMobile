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

let notifeeModule: any = null;
let AndroidImportance: any = { HIGH: 4 };
let EventType: any = { PRESS: 1 };
try {
  const notifee = require('@notifee/react-native');
  notifeeModule = notifee.default || notifee;
  if (notifee.AndroidImportance) AndroidImportance = notifee.AndroidImportance;
  if (notifee.EventType) EventType = notifee.EventType;
} catch (e) {
  console.warn('[Push] @notifee/react-native not available in current runtime:', e);
}

/**
 * Route user based on push notification data payload type
 */
export function routeForPush(data: any, navigate?: (screen: string, params?: any) => void) {
  if (!data || !navigate) return;

  switch (data.type) {
    case 'COURSE':
      return navigate('CourseNotifications');

    case 'STAFF':
    case 'INSTITUTE':
      return navigate('InstituteNotifications');

    default:
      return navigate('Notifications', {
        id: data.notificationId,
      });
  }
}

/**
 * Start push listeners for foreground notifications, background taps, and closed app taps
 */
export function startPushListeners(navigate?: (screen: string, params?: any) => void): () => void {
  const unsubscribers: Array<() => void> = [];

  if (!messagingModule) {
    return () => {};
  }

  const openFrom = (data: any) => {
    if (data && navigate) {
      routeForPush(data, navigate);
    }
  };

  try {
    // 1. Foreground notification handler (display banner using Notifee)
    const unsubForeground = messagingModule().onMessage(async (msg: any) => {
      console.log('[Push] Foreground message received:', msg);
      if (notifeeModule) {
        try {
          const channelId = await notifeeModule.createChannel({
            id: 'default',
            name: 'General',
            importance: AndroidImportance.HIGH,
          });

          await notifeeModule.displayNotification({
            title: msg.notification?.title || msg.data?.title || 'Notification',
            body: msg.notification?.body || msg.data?.body || '',
            data: msg.data,
            android: {
              channelId,
              pressAction: {
                id: 'default',
              },
            },
          });
        } catch (err) {
          console.warn('[Push] Error displaying Notifee notification:', err);
        }
      }
    });
    unsubscribers.push(unsubForeground);

    // 2. Notification tap handler when app was in background
    const unsubOpenedApp = messagingModule().onNotificationOpenedApp((msg: any) => {
      console.log('[Push] Notification opened app from background:', msg);
      openFrom(msg?.data);
    });
    unsubscribers.push(unsubOpenedApp);

    // 3. Notification tap handler when app was completely closed
    messagingModule()
      .getInitialNotification()
      .then((msg: any) => {
        if (msg) {
          console.log('[Push] Notification opened app from closed state:', msg);
          openFrom(msg?.data);
        }
      })
      .catch((err: any) => {
        console.warn('[Push] getInitialNotification error:', err);
      });

    // 4. Notifee foreground press event listener
    if (notifeeModule && typeof notifeeModule.onForegroundEvent === 'function') {
      const unsubNotifee = notifeeModule.onForegroundEvent(({ type, detail }: any) => {
        if (type === EventType.PRESS) {
          openFrom(detail.notification?.data);
        }
      });
      unsubscribers.push(unsubNotifee);
    }
  } catch (error) {
    console.warn('[Push] Error setting up push notification listeners:', error);
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}

