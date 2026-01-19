import { useCallback, useEffect } from 'react';
import { format, addHours, addMinutes } from 'date-fns';
import { useNotificationSystem } from './useNotificationSystem';

interface FingerprintSettings {
  attendanceTime: string;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  soundEnabled: boolean;
}

// دالة للحصول على التوقيت الكويتي
const getKuwaitTime = (): Date => {
  const now = new Date();
  const kuwaitOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const totalOffset = localOffset + kuwaitOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
};

// حساب فترة البصمة
const calculateFingerprintWindow = (attendanceTime: string): { start: Date; end: Date } | null => {
  if (!attendanceTime) return null;
  
  const [hours, minutes] = attendanceTime.split(':').map(Number);
  const now = getKuwaitTime();
  
  const attendanceDate = new Date(now);
  attendanceDate.setHours(hours, minutes, 0, 0);
  
  const windowStart = addMinutes(addHours(attendanceDate, 2), 1);
  const windowEnd = addMinutes(windowStart, 59);
  
  return { start: windowStart, end: windowEnd };
};

export const useFingerprintScheduler = () => {
  const { 
    scheduleNotification, 
    cancelAllNotifications, 
    isNative,
    requestLocalPermissions,
  } = useNotificationSystem();

  // جدولة تنبيهات البصمة مسبقاً
  const scheduleFingerprintNotifications = useCallback(async (settings: FingerprintSettings) => {
    if (!settings.reminderEnabled) return;

    // طلب الإذن أولاً
    const hasPermission = await requestLocalPermissions();
    if (!hasPermission) {
      console.log('No permission for local notifications');
      return;
    }

    // إلغاء التنبيهات السابقة أولاً
    await cancelAllNotifications();

    const window = calculateFingerprintWindow(settings.attendanceTime);
    if (!window) return;

    const now = getKuwaitTime();
    const today = format(now, 'yyyy-MM-dd');
    
    // التحقق من أن البصمة لم تُسجل بعد
    const lastDoneDate = localStorage.getItem('fingerprint-done-date');
    if (lastDoneDate === today) {
      console.log('Fingerprint already done today, skipping notifications');
      return;
    }

    // تنبيه 1: عند بداية الفترة
    if (window.start > now) {
      await scheduleNotification(
        '⏰ بدأت فترة بصمة التواجد!',
        'يرجى التوجه لجهاز البصمة الآن',
        window.start,
        1001 // ID ثابت لتنبيه البداية
      );
      console.log('Scheduled start notification for:', window.start);
    }

    // تنبيه 2: قبل انتهاء الفترة بالوقت المحدد
    const warningTime = addMinutes(window.end, -settings.reminderMinutesBefore);
    if (warningTime > now) {
      await scheduleNotification(
        `⚠️ تنبيه عاجل!`,
        `متبقي ${settings.reminderMinutesBefore} دقيقة على انتهاء فترة البصمة`,
        warningTime,
        1002 // ID ثابت لتنبيه التحذير
      );
      console.log('Scheduled warning notification for:', warningTime);
    }

    // تنبيه 3: قبل 5 دقائق من الانتهاء (إذا كان مختلفاً عن التنبيه السابق)
    if (settings.reminderMinutesBefore !== 5) {
      const fiveMinWarning = addMinutes(window.end, -5);
      if (fiveMinWarning > now) {
        await scheduleNotification(
          '🚨 آخر 5 دقائق!',
          'أسرع! البصمة على وشك الانتهاء!',
          fiveMinWarning,
          1003
        );
        console.log('Scheduled 5-min warning for:', fiveMinWarning);
      }
    }

    // تنبيه 4: قبل دقيقة واحدة من الانتهاء
    const oneMinWarning = addMinutes(window.end, -1);
    if (oneMinWarning > now) {
      await scheduleNotification(
        '🔴 دقيقة واحدة متبقية!',
        'هذا آخر تذكير - البصمة الآن!',
        oneMinWarning,
        1004
      );
      console.log('Scheduled 1-min warning for:', oneMinWarning);
    }

    console.log('All fingerprint notifications scheduled successfully');
  }, [scheduleNotification, cancelAllNotifications, requestLocalPermissions]);

  // إلغاء تنبيهات البصمة (عند تسجيل البصمة)
  const cancelFingerprintNotifications = useCallback(async () => {
    await cancelAllNotifications();
    console.log('Fingerprint notifications cancelled');
  }, [cancelAllNotifications]);

  // التحقق مما إذا كان أول دخول اليوم
  const checkFirstLoginToday = useCallback((): boolean => {
    const today = format(getKuwaitTime(), 'yyyy-MM-dd');
    const lastLogin = localStorage.getItem('last-login-date');
    
    if (lastLogin !== today) {
      localStorage.setItem('last-login-date', today);
      return true;
    }
    return false;
  }, []);

  // التحقق مما إذا تم تعيين وقت الحضور اليوم
  const checkAttendanceTimeSetToday = useCallback((): boolean => {
    const today = format(getKuwaitTime(), 'yyyy-MM-dd');
    const lastSet = localStorage.getItem('attendance-time-set-date');
    return lastSet === today;
  }, []);

  // تسجيل تعيين وقت الحضور
  const markAttendanceTimeSet = useCallback(() => {
    const today = format(getKuwaitTime(), 'yyyy-MM-dd');
    localStorage.setItem('attendance-time-set-date', today);
  }, []);

  return {
    scheduleFingerprintNotifications,
    cancelFingerprintNotifications,
    checkFirstLoginToday,
    checkAttendanceTimeSetToday,
    markAttendanceTimeSet,
    getKuwaitTime,
  };
};
