import { useCallback } from 'react';

// مفتاح التخزين المحلي
const HAPTIC_ENABLED_KEY = 'haptic_feedback_enabled';

// التحقق من تفعيل الاهتزاز والصوت
const isHapticEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(HAPTIC_ENABLED_KEY);
    // افتراضياً مفعل
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
};

// تعيين حالة الاهتزاز والصوت
export const setHapticEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(HAPTIC_ENABLED_KEY, String(enabled));
  } catch {
    // تجاهل الأخطاء
  }
};

// قراءة حالة الاهتزاز والصوت
export const getHapticEnabled = (): boolean => {
  return isHapticEnabled();
};

// صوت نجاح بسيط باستخدام Web Audio API
const playSuccessSound = () => {
  if (!isHapticEnabled()) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.log('Audio not supported');
  }
};

// اهتزاز الجهاز
const vibrate = (pattern: number | number[] = 50) => {
  if (!isHapticEnabled()) return;
  
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.log('Vibration not supported');
  }
};

export function useHapticFeedback() {
  // ردة فعل نجاح - اهتزاز قصير + صوت
  const successFeedback = useCallback(() => {
    vibrate(50);
    playSuccessSound();
  }, []);

  // ردة فعل خطأ - اهتزاز مزدوج
  const errorFeedback = useCallback(() => {
    vibrate([50, 50, 50]);
  }, []);

  // اهتزاز خفيف للتفاعل
  const lightTap = useCallback(() => {
    vibrate(20);
  }, []);

  return {
    successFeedback,
    errorFeedback,
    lightTap,
  };
}
