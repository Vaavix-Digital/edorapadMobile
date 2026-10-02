import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

// Step 8: Register FCM background message handler
try {
  const messaging = require('@react-native-firebase/messaging').default;
  if (messaging) {
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('[Push] Background message received:', remoteMessage);
    });
  }
} catch (e) {
  console.warn('[Push] Background message handler registration skipped:', e);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

