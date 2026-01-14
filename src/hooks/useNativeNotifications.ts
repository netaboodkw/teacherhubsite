import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface NativeNotificationSettings {
  pushEnabled: boolean;
  localEnabled: boolean;
  hapticsEnabled: boolean;
}

export const useNativeNotifications = () => {
  const [isNative, setIsNative] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    setIsNative(platform === 'ios' || platform === 'android');
  }, []);

  const requestPushPermissions = useCallback(async () => {
    if (!isNative) return false;

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notifications permission denied');
        return false;
      }

      await PushNotifications.register();
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      return false;
    }
  }, [isNative]);

  const requestLocalPermissions = useCallback(async () => {
    if (!isNative) return false;

    try {
      const permStatus = await LocalNotifications.requestPermissions();
      return permStatus.display === 'granted';
    } catch (error) {
      console.error('Error requesting local notification permissions:', error);
      return false;
    }
  }, [isNative]);

  useEffect(() => {
    if (!isNative) return;

    // Listen for push notification registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      setPushToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error.error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNative]);

  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    scheduleAt: Date,
    id?: number
  ) => {
    if (!isNative) {
      // Fallback to web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id || Date.now(),
            schedule: { at: scheduleAt },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }, [isNative]);

  const sendImmediateNotification = useCallback(async (
    title: string,
    body: string
  ) => {
    if (!isNative) {
      // Fallback to web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) }, // Almost immediate
            sound: 'beep.wav',
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }, [isNative]);

  const cancelAllNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications
        });
      }
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }, [isNative]);

  const triggerHaptics = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNative) {
      // Fallback to web vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(style === 'light' ? 50 : style === 'medium' ? 100 : 200);
      }
      return;
    }

    try {
      const impactStyle = style === 'light' 
        ? ImpactStyle.Light 
        : style === 'medium' 
          ? ImpactStyle.Medium 
          : ImpactStyle.Heavy;
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error triggering haptics:', error);
    }
  }, [isNative]);

  const vibrate = useCallback(async () => {
    if (!isNative) {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      return;
    }

    try {
      await Haptics.vibrate();
    } catch (error) {
      console.error('Error vibrating:', error);
    }
  }, [isNative]);

  return {
    isNative,
    pushToken,
    permissionGranted,
    requestPushPermissions,
    requestLocalPermissions,
    scheduleLocalNotification,
    sendImmediateNotification,
    cancelAllNotifications,
    triggerHaptics,
    vibrate
  };
};
