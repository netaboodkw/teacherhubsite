// أنواع الأصوات المتاحة
export type SoundType = 
  | 'classic' 
  | 'chime' 
  | 'schoolBell' 
  | 'digital' 
  | 'melody' 
  | 'gentle'
  | 'alert'
  | 'bell';

export interface SoundOption {
  id: SoundType;
  name: string;
  nameAr: string;
  description: string;
}

export const soundOptions: SoundOption[] = [
  { id: 'classic', name: 'Classic', nameAr: 'كلاسيكي', description: 'صوت تنبيه تقليدي' },
  { id: 'chime', name: 'Chime', nameAr: 'رنين ناعم', description: 'صوت رنين هادئ' },
  { id: 'schoolBell', name: 'School Bell', nameAr: 'جرس المدرسة', description: 'صوت جرس المدرسة' },
  { id: 'digital', name: 'Digital', nameAr: 'رقمي', description: 'صوت إلكتروني حديث' },
  { id: 'melody', name: 'Melody', nameAr: 'لحن موسيقي', description: 'لحن موسيقي قصير' },
  { id: 'gentle', name: 'Gentle', nameAr: 'هادئ', description: 'صوت هادئ ومريح' },
  { id: 'alert', name: 'Alert', nameAr: 'تنبيه سريع', description: 'صوت تنبيه سريع' },
  { id: 'bell', name: 'Bell', nameAr: 'جرس', description: 'صوت جرس واضح' },
];

// إنشاء AudioContext مشترك
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// تشغيل نغمة واحدة
const playTone = (
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number = 0.3,
  type: OscillatorType = 'sine'
) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// صوت كلاسيكي
const playClassic = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  playTone(ctx, 440, now, 0.15, 0.4);
  playTone(ctx, 523, now + 0.15, 0.2, 0.35);
};

// رنين ناعم
const playChime = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  const frequencies = [523, 659, 784]; // C5, E5, G5
  frequencies.forEach((freq, i) => {
    playTone(ctx, freq, now + i * 0.12, 0.4, 0.25);
  });
};

// جرس المدرسة
const playSchoolBell = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  // تكرار صوت الجرس
  for (let i = 0; i < 3; i++) {
    playTone(ctx, 880, now + i * 0.3, 0.2, 0.35, 'triangle');
    playTone(ctx, 440, now + i * 0.3 + 0.05, 0.15, 0.2, 'triangle');
  }
};

// صوت رقمي
const playDigital = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  playTone(ctx, 800, now, 0.08, 0.3, 'square');
  playTone(ctx, 1000, now + 0.1, 0.08, 0.3, 'square');
  playTone(ctx, 1200, now + 0.2, 0.12, 0.25, 'square');
};

// لحن موسيقي
const playMelody = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523, time: 0, dur: 0.15 },      // C5
    { freq: 587, time: 0.15, dur: 0.15 },   // D5
    { freq: 659, time: 0.3, dur: 0.15 },    // E5
    { freq: 784, time: 0.45, dur: 0.25 },   // G5
  ];
  notes.forEach(note => {
    playTone(ctx, note.freq, now + note.time, note.dur, 0.3);
  });
};

// صوت هادئ
const playGentle = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(392, now); // G4
  oscillator.frequency.linearRampToValueAtTime(523, now + 0.3); // to C5
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
  gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  
  oscillator.start(now);
  oscillator.stop(now + 0.5);
};

// تنبيه سريع
const playAlert = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    playTone(ctx, 1000, now + i * 0.15, 0.1, 0.35, 'sawtooth');
  }
};

// جرس واضح
const playBell = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // الجرس الأساسي
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator1.frequency.setValueAtTime(830, now);
  oscillator2.frequency.setValueAtTime(1245, now);
  oscillator1.type = 'sine';
  oscillator2.type = 'sine';
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
  
  oscillator1.start(now);
  oscillator2.start(now);
  oscillator1.stop(now + 0.8);
  oscillator2.stop(now + 0.8);
};

// تشغيل صوت بداية الحصة (أقوى من التنبيه العادي)
const playStartSound = (ctx: AudioContext, soundType: SoundType) => {
  const now = ctx.currentTime;
  
  // صوت مميز لبداية الحصة
  const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
  frequencies.forEach((freq, i) => {
    playTone(ctx, freq, now + i * 0.1, 0.3, 0.35);
  });
};

// الدالة الرئيسية لتشغيل الصوت
export const playNotificationSound = (
  soundType: SoundType = 'classic',
  isStartSound: boolean = false
) => {
  try {
    const ctx = getAudioContext();
    
    // استئناف AudioContext إذا كان معلقاً
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    if (isStartSound) {
      playStartSound(ctx, soundType);
      return;
    }
    
    switch (soundType) {
      case 'classic':
        playClassic(ctx);
        break;
      case 'chime':
        playChime(ctx);
        break;
      case 'schoolBell':
        playSchoolBell(ctx);
        break;
      case 'digital':
        playDigital(ctx);
        break;
      case 'melody':
        playMelody(ctx);
        break;
      case 'gentle':
        playGentle(ctx);
        break;
      case 'alert':
        playAlert(ctx);
        break;
      case 'bell':
        playBell(ctx);
        break;
      default:
        playClassic(ctx);
    }
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};

// تشغيل معاينة الصوت
export const previewSound = (soundType: SoundType) => {
  playNotificationSound(soundType, false);
};
