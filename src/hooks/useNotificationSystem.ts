import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  push_enabled: boolean;
  fingerprint_reminder: boolean;
  schedule_reminder: boolean;
  reminder_minutes_before: number;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  fingerprint_reminder: true,
  schedule_reminder: true,
  reminder_minutes_before: 10,
  sound_enabled: true,
  vibration_enabled: true,
};

export const useNotificationSystem = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const queryClient = useQueryClient();

  // Detect platform
  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform();
    setPlatform(currentPlatform as 'ios' | 'android' | 'web');
    setIsNative(currentPlatform === 'ios' || currentPlatform === 'android');
  }, []);

  // Fetch notification preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultPreferences;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as NotificationPreferences) || defaultPreferences;
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(newPrefs)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({ ...defaultPreferences, ...newPrefs, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('تم حفظ إعدادات الإشعارات');
    },
    onError: (error) => {
      toast.error('فشل في حفظ الإعدادات: ' + error.message);
    },
  });

  // Save push token to database
  const saveToken = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert token
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert(
          {
            user_id: user.id,
            token,
            platform,
            device_name: navigator.userAgent.substring(0, 100),
            is_active: true,
          },
          { onConflict: 'user_id,token' }
        );

      if (error) throw error;
      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, [platform]);

  // Request push notification permissions
  const requestPushPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      // Web fallback
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission as 'granted' | 'denied' | 'prompt');
        return permission === 'granted';
      }
      return false;
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setPermissionStatus('denied');
        toast.error('تم رفض إذن الإشعارات');
        return false;
      }

      setPermissionStatus('granted');
      await PushNotifications.register();
      return true;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      toast.error('حدث خطأ أثناء تفعيل الإشعارات');
      return false;
    }
  }, [isNative]);

  // Request local notification permissions
  const requestLocalPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return true;

    try {
      const permStatus = await LocalNotifications.requestPermissions();
      return permStatus.display === 'granted';
    } catch (error) {
      console.error('Error requesting local permissions:', error);
      return false;
    }
  }, [isNative]);

  // Initialize push notification listeners
  useEffect(() => {
    if (!isNative) return;

    const setupListeners = async () => {
      // Check current permission status
      const permStatus = await PushNotifications.checkPermissions();
      setPermissionStatus(permStatus.receive as 'granted' | 'denied' | 'prompt');

      // Registration success
      await PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success:', token.value);
        setPushToken(token.value);
        await saveToken(token.value);
      });

      // Registration error
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error.error);
      });

      // Notification received while app is open
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        toast.info(notification.title || 'إشعار جديد', {
          description: notification.body,
        });
      });

      // User tapped on notification
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action:', action);
      });
    };

    setupListeners();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNative, saveToken]);

  // Schedule local notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduleAt: Date,
    id?: number
  ) => {
    if (!isNative) {
      // Web fallback using setTimeout
      const delay = scheduleAt.getTime() - Date.now();
      if (delay > 0 && 'Notification' in window && Notification.permission === 'granted') {
        setTimeout(() => {
          new Notification(title, { body, icon: '/logo.png' });
        }, delay);
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
            sound: preferences?.sound_enabled ? 'beep.wav' : undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
      console.log('Notification scheduled for:', scheduleAt);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, [isNative, preferences?.sound_enabled]);

  // Send immediate notification
  const sendNotification = useCallback(async (title: string, body: string) => {
    if (!isNative) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
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
            schedule: { at: new Date(Date.now() + 100) },
            sound: preferences?.sound_enabled ? 'beep.wav' : undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [isNative, preferences?.sound_enabled]);

  // Cancel all pending notifications
  const cancelAllNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }, [isNative]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!preferences?.vibration_enabled) return;

    if (!isNative) {
      if ('vibrate' in navigator) {
        navigator.vibrate(style === 'light' ? 50 : style === 'medium' ? 100 : 200);
      }
      return;
    }

    try {
      const impactStyle = 
        style === 'light' ? ImpactStyle.Light :
        style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error triggering haptic:', error);
    }
  }, [isNative, preferences?.vibration_enabled]);

  return {
    // State
    isNative,
    platform,
    pushToken,
    permissionStatus,
    preferences: preferences || defaultPreferences,
    preferencesLoading,
    
    // Actions
    requestPushPermissions,
    requestLocalPermissions,
    scheduleNotification,
    sendNotification,
    cancelAllNotifications,
    triggerHaptic,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
};
