import { useState, useEffect, useCallback, useRef } from 'react';
import { useHapticFeedback } from './useHapticFeedback';
import type { PeriodTime, EducationSchedule } from '@/lib/periodSchedules';
import type { Classroom } from '@/hooks/useClassrooms';

// مفتاح التخزين المحلي
const REMINDER_SETTINGS_KEY = 'period_reminder_settings';
const REMINDER_ENABLED_KEY = 'period_reminder_enabled';

export interface ReminderSettings {
  enabled: boolean;
  minutesBefore: number; // كم دقيقة قبل الحصة
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  minutesBefore: 5,
  soundEnabled: true,
  vibrationEnabled: true,
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

// تشغيل صوت التنبيه
const playReminderSound = (type: 'upcoming' | 'start' = 'upcoming') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'start') {
      // صوت بداية الحصة - نغمتين صاعدتين
      const frequencies = [523, 659, 784]; // C5, E5, G5 - chord
      frequencies.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + 0.6);
      });
    } else {
      // صوت تنبيه قبل الحصة - نغمة واحدة
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.15); // C5
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    }
  } catch (error) {
    console.log('Audio not supported:', error);
  }
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
  const lastNotifiedPeriodRef = useRef<string | null>(null);
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

            // تشغيل الصوت
            if (settings.soundEnabled) {
              playReminderSound('upcoming');
            }

            // تشغيل الاهتزاز
            if (settings.vibrationEnabled) {
              vibrateDevice([100, 50, 100]);
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

            // صوت بداية الحصة
            if (settings.soundEnabled) {
              playReminderSound('start');
            }

            // اهتزاز أطول لبداية الحصة
            if (settings.vibrationEnabled) {
              vibrateDevice([200, 100, 200, 100, 200]);
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
  }, [enabled, settings, schedule, classrooms, successFeedback]);

  return {
    settings,
    updateSettings,
    upcomingPeriod,
    notificationPermission,
    requestPermission,
  };
}
