import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getApiClient } from '@nermai/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class PushNotificationsService {
  /**
   * Request permissions and retrieve FCM push token for the device.
   * Note: This requires an active Expo project ID in app.json if using EAS.
   */
  static async registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    try {
      // In a real app with EAS, projectId is required. We'll wrap in try-catch for local dev.
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (e) {
      console.warn('Expo Push Token could not be retrieved. Ensure app.json has a valid projectId.', e);
    }
  }

  /**
   * Sync the push token to the backend student profile
   */
  static async syncTokenToBackend(token: string) {
    try {
      const api = getApiClient();
      await api.patch('/students/me', { fcmToken: token });
      console.log('Push token synced to backend successfully.');
    } catch (e) {
      console.warn('Failed to sync push token to backend.', e);
    }
  }
}
