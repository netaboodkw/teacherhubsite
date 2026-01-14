import { useState, useEffect, useCallback, useRef } from 'react';
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

// اهتزاز الجهاز
const vibrateDevice = (pattern: number | number[]) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.log('Vibration not supported');
  }
};

// طلب إذن الإشعارات
export const requestNotificationPermission = async (): Promise<boolean> => {
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

// إرسال إشعار
const sendNotification = (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/logo.png',
        tag: 'period-reminder',
      });
    } catch (error) {
      console.log('Notification error:', error);
    }
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
  const lastNotifiedPeriodRef = useRef<string | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { successFeedback } = useHapticFeedback();

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
      vibrateDevice([200, 100, 200]);
    }
    
    // تكرار كل فترة محددة
    repeatIntervalRef.current = setInterval(() => {
      if (settings.soundEnabled) {
        playNotificationSound(settings.soundType, false);
      }
      if (settings.vibrationEnabled) {
        vibrateDevice([200, 100, 200]);
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
                vibrateDevice([100, 50, 100]);
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
                vibrateDevice([200, 100, 200, 100, 200]);
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
  };
}
