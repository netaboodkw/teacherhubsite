import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useHapticFeedback } from './useHapticFeedback';
import type { PeriodTime, EducationSchedule } from '@/lib/periodSchedules';
import type { Classroom } from '@/hooks/useClassrooms';
import { playNotificationSound, type SoundType } from '@/lib/notificationSounds';

// مفتاح التخزين المحلي
const REMINDER_SETTINGS_KEY = 'period_reminder_settings';

export interface ReminderSettings {
  enabled: boolean;
  minutesBefore: number; // كم دقيقة قبل الحصة
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundType: SoundType; // نوع الصوت المختار
  repeatUntilDismissed: boolean; // تكرار الصوت حتى الإيقاف
  repeatIntervalSeconds: number; // الفاصل الزمني للتكرار بالثواني
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  minutesBefore: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  soundType: 'classic',
  repeatUntilDismissed: false,
  repeatIntervalSeconds: 60,
};

// التحقق إذا كان التطبيق يعمل كـ native
const isNativePlatform = () => {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android';
};

// حفظ الإعدادات
export const saveReminderSettings = (settings: ReminderSettings): void => {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.log('Could not save reminder settings');
  }
};

// قراءة الإعدادات
export const getReminderSettings = (): ReminderSettings => {
  try {
    const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    console.log('Could not read reminder settings');
  }
  return DEFAULT_SETTINGS;
};

// اهتزاز الجهاز (Native أو Web)
const vibrateDevice = async (pattern: number | number[]) => {
  try {
    if (isNativePlatform()) {
      // استخدام Capacitor Haptics للأجهزة الأصلية
      await Haptics.vibrate();
    } else if ('vibrate' in navigator) {
      // استخدام Web Vibration API للمتصفح
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.log('Vibration not supported:', error);
  }
};

// اهتزاز قوي للتنبيهات المهمة
const vibrateHeavy = async () => {
  try {
    if (isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (error) {
    console.log('Heavy vibration error:', error);
  }
};

// اهتزاز تنبيه
const vibrateNotification = async () => {
  try {
    if (isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (error) {
    console.log('Notification vibration error:', error);
  }
};

// طلب إذن الإشعارات
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (isNativePlatform()) {
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      return permStatus.display === 'granted';
    } catch (error) {
      console.error('Error requesting native notification permission:', error);
      return false;
    }
  }
  
  // Web Notifications
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// إرسال إشعار (Native أو Web)
const sendNotification = async (title: string, body: string, id?: number) => {
  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id || Date.now(),
            schedule: { at: new Date(Date.now() + 100) }, // شبه فوري
            sound: 'beep.wav',
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Native notification error:', error);
    }
    return;
  }
  
  // Web Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/logo.png',
        tag: 'period-reminder',
      });
    } catch (error) {
      console.log('Web notification error:', error);
    }
  }
};

// جدولة إشعار مستقبلي (للتطبيقات الأصلية فقط)
export const scheduleNotification = async (
  title: string,
  body: string,
  scheduleAt: Date,
  id: number
): Promise<boolean> => {
  if (!isNativePlatform()) {
    return false;
  }
  
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: scheduleAt },
          sound: 'beep.wav',
          actionTypeId: '',
          extra: null
        }
      ]
    });
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
};

// إلغاء جميع الإشعارات المجدولة
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  if (!isNativePlatform()) return;
  
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
};

// تحويل وقت النص إلى دقائق من بداية اليوم
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// الحصول على اليوم الحالي بالإنجليزية
const getCurrentDayKey = (): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

export interface UpcomingPeriod {
  period: PeriodTime;
  classroom: Classroom | null;
  minutesUntilStart: number;
  isStarting: boolean;
}

export function usePeriodReminder(
  schedule: EducationSchedule,
  classrooms: Classroom[],
  enabled: boolean = true
) {
  const [settings, setSettings] = useState<ReminderSettings>(getReminderSettings);
  const [upcomingPeriod, setUpcomingPeriod] = useState<UpcomingPeriod | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isRepeating, setIsRepeating] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const lastNotifiedPeriodRef = useRef<string | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { successFeedback } = useHapticFeedback();

  // التحقق من المنصة
  useEffect(() => {
    setIsNative(isNativePlatform());
  }, []);

  // تحديث الإعدادات
  const updateSettings = useCallback((newSettings: Partial<ReminderSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveReminderSettings(updated);
      return updated;
    });
  }, []);

  // طلب إذن الإشعارات
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  // بدء تكرار الصوت
  const startRepeating = useCallback(() => {
    if (repeatIntervalRef.current) return; // تجنب التكرار المزدوج
    
    setIsRepeating(true);
    
    // تشغيل الصوت فوراً
    if (settings.soundEnabled) {
      playNotificationSound(settings.soundType, false);
    }
    if (settings.vibrationEnabled) {
      vibrateHeavy();
    }
    
    // تكرار كل فترة محددة
    repeatIntervalRef.current = setInterval(() => {
      if (settings.soundEnabled) {
        playNotificationSound(settings.soundType, false);
      }
      if (settings.vibrationEnabled) {
        vibrateHeavy();
      }
    }, settings.repeatIntervalSeconds * 1000);
  }, [settings]);

  // إيقاف تكرار الصوت
  const stopRepeating = useCallback(() => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    setIsRepeating(false);
  }, []);

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }
    };
  }, []);

  // التحقق من الحصص القادمة
  useEffect(() => {
    if (!enabled || !settings.enabled) return;

    const checkUpcoming = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentDay = getCurrentDayKey();

      // فقط أيام العمل (الأحد - الخميس)
      const workDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
      if (!workDays.includes(currentDay)) {
        setUpcomingPeriod(null);
        return;
      }

      const classPeriods = schedule.periods.filter(p => !p.isBreak);

      for (const period of classPeriods) {
        const periodStartMinutes = timeToMinutes(period.startTime);
        const minutesUntilStart = periodStartMinutes - currentMinutes;

        // التحقق إذا كانت الحصة قادمة خلال الوقت المحدد
        if (minutesUntilStart > 0 && minutesUntilStart <= settings.minutesBefore) {
          // البحث عن الصف المجدول لهذه الحصة
          let scheduledClassroom: Classroom | null = null;
          
          for (const classroom of classrooms) {
            if (classroom.class_schedule) {
              const daySchedule = classroom.class_schedule[currentDay];
              if (Array.isArray(daySchedule) && daySchedule.includes(period.period)) {
                scheduledClassroom = classroom;
                break;
              }
            }
          }

          const periodKey = `${currentDay}-${period.period}-${now.toDateString()}`;
          
          // إرسال التنبيه مرة واحدة فقط
          if (lastNotifiedPeriodRef.current !== periodKey) {
            lastNotifiedPeriodRef.current = periodKey;

            // تشغيل الصوت (مع التكرار إذا مفعّل)
            if (settings.repeatUntilDismissed) {
              startRepeating();
            } else {
              if (settings.soundEnabled) {
                playNotificationSound(settings.soundType, false);
              }
              if (settings.vibrationEnabled) {
                vibrateNotification();
              }
            }

            // إرسال إشعار
            const classroomName = scheduledClassroom ? scheduledClassroom.name : '';
            sendNotification(
              `⏰ ${period.nameAr} بعد ${minutesUntilStart} دقيقة`,
              classroomName ? `الصف: ${classroomName}` : 'استعد للحصة القادمة',
            );
          }

          setUpcomingPeriod({
            period,
            classroom: scheduledClassroom,
            minutesUntilStart,
            isStarting: false,
          });
          return;
        }

        // التحقق إذا كانت الحصة تبدأ الآن (خلال دقيقة واحدة)
        if (minutesUntilStart >= -1 && minutesUntilStart <= 0) {
          let scheduledClassroom: Classroom | null = null;
          
          for (const classroom of classrooms) {
            if (classroom.class_schedule) {
              const daySchedule = classroom.class_schedule[currentDay];
              if (Array.isArray(daySchedule) && daySchedule.includes(period.period)) {
                scheduledClassroom = classroom;
                break;
              }
            }
          }

          const periodKey = `start-${currentDay}-${period.period}-${now.toDateString()}`;
          
          if (lastNotifiedPeriodRef.current !== periodKey) {
            lastNotifiedPeriodRef.current = periodKey;

            // صوت بداية الحصة (مع التكرار إذا مفعّل)
            if (settings.repeatUntilDismissed) {
              startRepeating();
            } else {
              if (settings.soundEnabled) {
                playNotificationSound(settings.soundType, true);
              }
              if (settings.vibrationEnabled) {
                vibrateHeavy();
              }
            }

            // إشعار بداية الحصة
            const classroomName = scheduledClassroom ? scheduledClassroom.name : '';
            sendNotification(
              `🔔 بدأت ${period.nameAr}`,
              classroomName ? `الصف: ${classroomName}` : 'الحصة بدأت الآن!',
            );

            successFeedback();
          }

          setUpcomingPeriod({
            period,
            classroom: scheduledClassroom,
            minutesUntilStart: 0,
            isStarting: true,
          });
          return;
        }
      }

      // لا توجد حصص قادمة
      setUpcomingPeriod(null);
    };

    // التحقق فوراً ثم كل 30 ثانية
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 30000);

    return () => clearInterval(interval);
  }, [enabled, settings, schedule, classrooms, successFeedback, startRepeating]);

  return {
    settings,
    updateSettings,
    upcomingPeriod,
    notificationPermission,
    requestPermission,
    isRepeating,
    stopRepeating,
    isNative,
  };
}
