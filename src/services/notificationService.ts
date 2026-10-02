import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { authApi } from '../shared/api/authApi';
import { storageService } from './storage';
import { STORAGE_KEYS } from '../shared/constants';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure foreground notification presentation behavior safely (skip in Expo Go to avoid SDK 53+ push error)
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[NotificationService] Failed to set notification handler:', err);
  }
}

export const notificationService = {
  registerForPushNotifications: async (userId: string): Promise<string | null> => {
    if (isExpoGo) {
      console.warn('[Push] Push notifications are not supported inside Expo Go. Use a development build (npm run android).');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      // Save token locally
      await storageService.setItem(STORAGE_KEYS.PUSH_TOKEN, token);

      // Register with backend
      if (userId) {
        await authApi.registerDeviceToken({
          fcmToken: token,
          platform: Platform.OS
        }).catch(err => console.warn('Could not register device token with backend:', err));
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3E7B74',
        });
      }

      return token;
    } catch (error) {
      console.warn('Error obtaining push token:', error);
      return null;
    }
  },

  addNotificationReceivedListener: (callback: (notification: Notifications.Notification) => void) => {
    if (isExpoGo) return { remove: () => {} } as any;
    try {
      return Notifications.addNotificationReceivedListener(callback);
    } catch {
      return { remove: () => {} } as any;
    }
  },

  addNotificationResponseReceivedListener: (callback: (response: Notifications.NotificationResponse) => void) => {
    if (isExpoGo) return { remove: () => {} } as any;
    try {
      return Notifications.addNotificationResponseReceivedListener(callback);
    } catch {
      return { remove: () => {} } as any;
    }
  }
};

