import { useState, useEffect, useCallback, useMemo } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Fingerprint as FingerprintIcon, 
  Clock, 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  Timer, 
  Info,
  ChevronLeft,
  Settings,
  RotateCcw
} from 'lucide-react';
import { playNotificationSound, soundOptions, SoundType, previewSound } from '@/lib/notificationSounds';
import { format, addHours, addMinutes, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { useFingerprintScheduler } from '@/hooks/useFingerprintScheduler';
import { getAttendancePref, setAttendancePref } from '@/components/notifications/AttendanceNotificationBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface FingerprintSettings {
  attendanceTime: string;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  soundEnabled: boolean;
  soundType: SoundType;
  autoDetectAttendance: boolean;
}

const getKuwaitTime = (): Date => {
  const now = new Date();
  const kuwaitOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const totalOffset = localOffset + kuwaitOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
};

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

type FingerprintStatus = 'waiting' | 'active' | 'urgent' | 'expired' | 'completed';

// Common attendance times
const commonTimes = ['06:30', '07:00', '07:30', '08:00'];

const FingerprintPage = () => {
  const isMobile = useIsMobile();
  const { sendImmediateNotification, triggerHaptics } = useNativeNotifications();
  
  const [settings, setSettings] = useState<FingerprintSettings>(() => {
    const saved = localStorage.getItem('fingerprint-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      attendanceTime: '07:00',
      reminderEnabled: true,
      reminderMinutesBefore: 10,
      soundEnabled: true,
      soundType: 'schoolBell' as SoundType,
      autoDetectAttendance: false,
    };
  });

  const [currentTime, setCurrentTime] = useState(getKuwaitTime());
  const [status, setStatus] = useState<FingerprintStatus>('waiting');
  const [fingerprintDone, setFingerprintDone] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState<Date | null>(null);
  const [dailyNotificationEnabled, setDailyNotificationEnabled] = useState(() => getAttendancePref() === 'daily');
  const [showSettings, setShowSettings] = useState(false);

  const handleDailyNotificationToggle = (enabled: boolean) => {
    setDailyNotificationEnabled(enabled);
    setAttendancePref(enabled ? 'daily' : 'never');
    toast.success(enabled ? 'تم تفعيل إشعار الحضور اليومي' : 'تم إيقاف إشعار الحضور اليومي');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getKuwaitTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('fingerprint-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const checkNewDay = () => {
      const lastDoneDate = localStorage.getItem('fingerprint-done-date');
      const today = format(currentTime, 'yyyy-MM-dd');
      
      if (lastDoneDate !== today) {
        setFingerprintDone(false);
        localStorage.removeItem('fingerprint-done-date');
      }
    };
    checkNewDay();
  }, [currentTime]);

  const fingerprintWindow = useMemo(() => {
    return calculateFingerprintWindow(settings.attendanceTime);
  }, [settings.attendanceTime]);

  const { timeRemaining, minutesRemaining } = useMemo(() => {
    if (!fingerprintWindow || fingerprintDone) {
      return { timeRemaining: '', minutesRemaining: 0 };
    }

    const { start, end } = fingerprintWindow;
    
    if (currentTime < start) {
      const mins = differenceInMinutes(start, currentTime);
      const secs = differenceInSeconds(start, currentTime) % 60;
      return {
        timeRemaining: `${mins}:${secs.toString().padStart(2, '0')}`,
        minutesRemaining: mins,
      };
    } else if (currentTime >= start && currentTime <= end) {
      const mins = differenceInMinutes(end, currentTime);
      const secs = differenceInSeconds(end, currentTime) % 60;
      return {
        timeRemaining: `${mins}:${secs.toString().padStart(2, '0')}`,
        minutesRemaining: mins,
      };
    } else {
      return { timeRemaining: '00:00', minutesRemaining: 0 };
    }
  }, [fingerprintWindow, currentTime, fingerprintDone]);

  useEffect(() => {
    if (fingerprintDone) {
      setStatus('completed');
      return;
    }

    if (!fingerprintWindow) {
      setStatus('waiting');
      return;
    }

    const { start, end } = fingerprintWindow;

    if (currentTime < start) {
      setStatus('waiting');
    } else if (currentTime >= start && currentTime <= end) {
      if (minutesRemaining <= 10) {
        setStatus('urgent');
      } else {
        setStatus('active');
      }
    } else {
      setStatus('expired');
    }
  }, [fingerprintWindow, currentTime, fingerprintDone, minutesRemaining]);

  const playReminder = useCallback(async (title: string, body: string) => {
    if (settings.soundEnabled) {
      playNotificationSound(settings.soundType, true);
    }
    
    try {
      await sendImmediateNotification(title, body);
    } catch (error) {
      console.error('Failed to send fingerprint notification:', error);
    }
    
    triggerHaptics('heavy');
  }, [settings.soundEnabled, settings.soundType, sendImmediateNotification, triggerHaptics]);

  useEffect(() => {
    if (!settings.reminderEnabled || !fingerprintWindow || fingerprintDone) return;

    if (status === 'active' && !lastReminderTime) {
      playReminder('⏰ بدأت فترة بصمة التواجد!', 'يرجى التوجه لجهاز البصمة الآن');
      setLastReminderTime(currentTime);
      toast.warning('⏰ بدأت فترة بصمة التواجد!', {
        description: 'يرجى التوجه لجهاز البصمة الآن',
        duration: 10000,
      });
    }

    if (status === 'urgent' && minutesRemaining === settings.reminderMinutesBefore) {
      const now = currentTime.getTime();
      const lastReminder = lastReminderTime?.getTime() || 0;
      
      if (now - lastReminder > 55000) {
        playReminder('⚠️ تنبيه عاجل!', `متبقي ${minutesRemaining} دقيقة على انتهاء فترة البصمة`);
        setLastReminderTime(currentTime);
        toast.error('⚠️ تنبيه عاجل!', {
          description: `متبقي ${minutesRemaining} دقيقة على انتهاء فترة البصمة`,
          duration: 15000,
        });
      }
    }

    if (status === 'urgent' && minutesRemaining > 0 && minutesRemaining % 5 === 0 && minutesRemaining !== settings.reminderMinutesBefore) {
      const now = currentTime.getTime();
      const lastReminder = lastReminderTime?.getTime() || 0;
      
      if (now - lastReminder > 55000) {
        playReminder('⏰ تذكير البصمة', `متبقي ${minutesRemaining} دقيقة على انتهاء فترة البصمة`);
        setLastReminderTime(currentTime);
      }
    }
  }, [status, minutesRemaining, settings, fingerprintWindow, fingerprintDone, lastReminderTime, playReminder, currentTime]);

  const { scheduleFingerprintNotifications, cancelFingerprintNotifications, markAttendanceTimeSet } = useFingerprintScheduler();
  
  useEffect(() => {
    if (settings.reminderEnabled && !fingerprintDone) {
      scheduleFingerprintNotifications(settings);
    }
  }, [settings.attendanceTime, settings.reminderEnabled, settings.reminderMinutesBefore, fingerprintDone, scheduleFingerprintNotifications, settings]);

  const markFingerprintDone = async () => {
    setFingerprintDone(true);
    localStorage.setItem('fingerprint-done-date', format(currentTime, 'yyyy-MM-dd'));
    await cancelFingerprintNotifications();
    triggerHaptics('heavy');
    toast.success('تم تسجيل البصمة بنجاح! ✅');
  };

  const resetFingerprint = async () => {
    setFingerprintDone(false);
    setLastReminderTime(null);
    localStorage.removeItem('fingerprint-done-date');
    await scheduleFingerprintNotifications(settings);
    toast.info('تم إعادة تعيين حالة البصمة');
  };
  
  const handleAttendanceTimeChange = async (time: string) => {
    const newSettings = { ...settings, attendanceTime: time };
    setSettings(newSettings);
    markAttendanceTimeSet();
    
    if (newSettings.reminderEnabled && !fingerprintDone) {
      await scheduleFingerprintNotifications(newSettings);
      toast.success('تم تحديث وقت الحضور');
    }
  };

  const handlePreviewSound = () => {
    previewSound(settings.soundType);
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'waiting':
        return {
          color: 'from-secondary/20 to-secondary/5',
          borderColor: 'border-secondary/30',
          iconColor: 'text-muted-foreground',
          label: 'في الانتظار',
          sublabel: 'لم تبدأ الفترة بعد',
          icon: Clock,
        };
      case 'active':
        return {
          color: 'from-emerald-500/20 to-emerald-500/5',
          borderColor: 'border-emerald-500/40',
          iconColor: 'text-emerald-500',
          label: 'الفترة مفتوحة',
          sublabel: 'يمكنك تسجيل البصمة الآن',
          icon: CheckCircle2,
        };
      case 'urgent':
        return {
          color: 'from-destructive/20 to-destructive/5',
          borderColor: 'border-destructive/40',
          iconColor: 'text-destructive',
          label: 'وقت عاجل!',
          sublabel: 'سارع لتسجيل البصمة',
          icon: AlertTriangle,
        };
      case 'expired':
        return {
          color: 'from-destructive/10 to-destructive/5',
          borderColor: 'border-destructive/30',
          iconColor: 'text-destructive',
          label: 'انتهت الفترة',
          sublabel: 'فاتك وقت البصمة',
          icon: AlertTriangle,
        };
      case 'completed':
        return {
          color: 'from-primary/20 to-primary/5',
          borderColor: 'border-primary/40',
          iconColor: 'text-primary',
          label: 'تم التسجيل ✓',
          sublabel: 'أحسنت! سجلت البصمة',
          icon: CheckCircle2,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Mobile Layout
  if (isMobile) {
    return (
      <TeacherLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          {/* iOS-style Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FingerprintIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">بصمة التواجد</h1>
                  <p className="text-xs text-muted-foreground">التوقيت الكويتي</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className={cn("w-5 h-5 transition-transform", showSettings && "rotate-90")} />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-24">
            {/* Current Time Display */}
            <div className="text-center py-2">
              <p className="text-5xl font-mono font-bold tracking-tight">
                {format(currentTime, 'HH:mm')}
                <span className="text-2xl text-muted-foreground">:{format(currentTime, 'ss')}</span>
              </p>
            </div>

            {/* Status Card */}
            <GlassCard className={cn(
              "relative overflow-hidden",
              "bg-gradient-to-br",
              statusConfig.color,
              statusConfig.borderColor,
              status === 'urgent' && "animate-pulse"
            )}>
              <GlassCardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Status Icon */}
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    "bg-background/60 backdrop-blur-sm shadow-lg",
                    status === 'completed' && "ring-4 ring-primary/30"
                  )}>
                    <StatusIcon className={cn("w-10 h-10", statusConfig.iconColor)} />
                  </div>

                  {/* Status Text */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{statusConfig.label}</h2>
                    <p className="text-muted-foreground">{statusConfig.sublabel}</p>
                  </div>

                  {/* Time Remaining */}
                  {fingerprintWindow && !fingerprintDone && status !== 'expired' && (
                    <div className="w-full mt-2">
                      <div className="flex justify-between items-center bg-background/40 rounded-2xl p-4">
                        <div className="text-center flex-1">
                          <p className="text-xs text-muted-foreground mb-1">البداية</p>
                          <p className="text-xl font-bold font-mono">{format(fingerprintWindow.start, 'HH:mm')}</p>
                        </div>
                        <div className="h-12 w-px bg-border/50" />
                        <div className="text-center flex-1">
                          <Timer className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xl font-bold font-mono">{timeRemaining}</p>
                        </div>
                        <div className="h-12 w-px bg-border/50" />
                        <div className="text-center flex-1">
                          <p className="text-xs text-muted-foreground mb-1">النهاية</p>
                          <p className="text-xl font-bold font-mono">{format(fingerprintWindow.end, 'HH:mm')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="w-full mt-2">
                    {!fingerprintDone ? (
                      <Button 
                        size="lg" 
                        onClick={markFingerprintDone}
                        className="w-full h-14 text-lg rounded-2xl shadow-lg"
                        disabled={status === 'waiting'}
                      >
                        <CheckCircle2 className="w-6 h-6 ml-2" />
                        تم تسجيل البصمة
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={resetFingerprint}
                        className="w-full h-14 text-lg rounded-2xl"
                      >
                        <RotateCcw className="w-5 h-5 ml-2" />
                        إعادة تعيين
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Quick Time Selection */}
            <GlassCard>
              <GlassCardHeader className="pb-2">
                <GlassCardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  وقت الحضور
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {commonTimes.map((time) => (
                    <Button
                      key={time}
                      variant={settings.attendanceTime === time ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleAttendanceTimeChange(time)}
                      className="font-mono text-base h-12 rounded-xl"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={settings.attendanceTime}
                    onChange={(e) => handleAttendanceTimeChange(e.target.value)}
                    className="flex-1 h-12 font-mono text-lg rounded-xl text-center"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Settings Section */}
            {showSettings && (
              <GlassCard>
                <GlassCardHeader className="pb-2">
                  <GlassCardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    إعدادات التنبيهات
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                  {/* Daily Notification */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex-1">
                      <Label className="font-semibold">إشعار الحضور اليومي</Label>
                      <p className="text-xs text-muted-foreground">عند فتح التطبيق</p>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={dailyNotificationEnabled}
                        onCheckedChange={handleDailyNotificationToggle}
                      />
                    </div>
                  </div>

                  {/* Reminder Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label>تفعيل التذكيرات</Label>
                      <p className="text-xs text-muted-foreground">تنبيهات بداية ونهاية الفترة</p>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={settings.reminderEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, reminderEnabled: checked })}
                      />
                    </div>
                  </div>

                  {/* Reminder Time */}
                  <div className="space-y-2">
                    <Label className="text-sm">التنبيه قبل انتهاء الفترة</Label>
                    <Select
                      value={settings.reminderMinutesBefore.toString()}
                      onValueChange={(value) => setSettings({ ...settings, reminderMinutesBefore: parseInt(value) })}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 دقائق</SelectItem>
                        <SelectItem value="10">10 دقائق</SelectItem>
                        <SelectItem value="15">15 دقيقة</SelectItem>
                        <SelectItem value="20">20 دقيقة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {settings.soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-primary" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <Label>التنبيه الصوتي</Label>
                        <p className="text-xs text-muted-foreground">تشغيل صوت عند التذكير</p>
                      </div>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                      />
                    </div>
                  </div>

                  {/* Sound Type */}
                  {settings.soundEnabled && (
                    <div className="flex gap-2">
                      <Select
                        value={settings.soundType}
                        onValueChange={(value) => setSettings({ ...settings, soundType: value as SoundType })}
                      >
                        <SelectTrigger className="flex-1 h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {soundOptions.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={handlePreviewSound}>
                        <BellRing className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Info Card */}
            <GlassCard className="bg-muted/30">
              <GlassCardContent className="pt-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">القرار رقم 6 لسنة 2024</p>
                    <p>بصمة التواجد خلال 60 دقيقة بعد ساعتين من الحضور</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  // Desktop Layout
  return (
    <TeacherLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FingerprintIcon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">بصمة التواجد</h1>
              <p className="text-muted-foreground">نظام تذكير بصمة التواجد - الكويت</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">التوقيت الكويتي</p>
            <p className="text-3xl font-mono font-bold">
              {format(currentTime, 'HH:mm:ss')}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Status Card - Takes 2 columns */}
          <GlassCard className={cn(
            "col-span-2 relative overflow-hidden",
            "bg-gradient-to-br",
            statusConfig.color,
            statusConfig.borderColor,
            status === 'urgent' && "animate-pulse"
          )}>
            <GlassCardContent className="pt-8 pb-8">
              <div className="flex items-center gap-8">
                {/* Status Icon */}
                <div className={cn(
                  "w-28 h-28 rounded-3xl flex items-center justify-center",
                  "bg-background/60 backdrop-blur-sm shadow-xl",
                  status === 'completed' && "ring-4 ring-primary/30"
                )}>
                  <StatusIcon className={cn("w-14 h-14", statusConfig.iconColor)} />
                </div>

                <div className="flex-1">
                  {/* Status Text */}
                  <h2 className="text-3xl font-bold mb-1">{statusConfig.label}</h2>
                  <p className="text-lg text-muted-foreground mb-4">{statusConfig.sublabel}</p>

                  {/* Time Info */}
                  {fingerprintWindow && !fingerprintDone && status !== 'expired' && (
                    <div className="flex items-center gap-6 text-lg">
                      <div>
                        <span className="text-muted-foreground ml-2">البداية:</span>
                        <span className="font-mono font-bold">{format(fingerprintWindow.start, 'HH:mm')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground ml-2">النهاية:</span>
                        <span className="font-mono font-bold">{format(fingerprintWindow.end, 'HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5" />
                        <span className="font-mono font-bold text-2xl">{timeRemaining}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-6">
                    {!fingerprintDone ? (
                      <Button 
                        size="lg" 
                        onClick={markFingerprintDone}
                        className="h-14 px-10 text-lg rounded-xl shadow-lg"
                        disabled={status === 'waiting'}
                      >
                        <CheckCircle2 className="w-6 h-6 ml-2" />
                        تم تسجيل البصمة
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={resetFingerprint}
                        className="h-14 px-10 text-lg rounded-xl"
                      >
                        <RotateCcw className="w-5 h-5 ml-2" />
                        إعادة تعيين
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Time Selection Card */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                وقت الحضور
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {commonTimes.map((time) => (
                  <Button
                    key={time}
                    variant={settings.attendanceTime === time ? 'default' : 'outline'}
                    onClick={() => handleAttendanceTimeChange(time)}
                    className="font-mono h-12 rounded-xl"
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <Input
                type="time"
                value={settings.attendanceTime}
                onChange={(e) => handleAttendanceTimeChange(e.target.value)}
                className="h-12 font-mono text-lg rounded-xl text-center"
              />
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Settings Card */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              إعدادات التنبيهات
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Daily Notification */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div>
                  <Label className="text-base font-semibold">إشعار الحضور اليومي</Label>
                  <p className="text-sm text-muted-foreground">عرض إشعار عند فتح التطبيق</p>
                </div>
                <div dir="ltr">
                  <Switch
                    checked={dailyNotificationEnabled}
                    onCheckedChange={handleDailyNotificationToggle}
                  />
                </div>
              </div>

              {/* Reminder Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <Label className="text-base">تفعيل التذكيرات</Label>
                  <p className="text-sm text-muted-foreground">تنبيهات بداية ونهاية الفترة</p>
                </div>
                <div dir="ltr">
                  <Switch
                    checked={settings.reminderEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, reminderEnabled: checked })}
                  />
                </div>
              </div>

              {/* Reminder Time */}
              <div className="space-y-2">
                <Label>التنبيه قبل انتهاء الفترة</Label>
                <Select
                  value={settings.reminderMinutesBefore.toString()}
                  onValueChange={(value) => setSettings({ ...settings, reminderMinutesBefore: parseInt(value) })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 دقائق</SelectItem>
                    <SelectItem value="10">10 دقائق</SelectItem>
                    <SelectItem value="15">15 دقيقة</SelectItem>
                    <SelectItem value="20">20 دقيقة</SelectItem>
                    <SelectItem value="30">30 دقيقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sound Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                    <Label>التنبيه الصوتي</Label>
                  </div>
                  <div dir="ltr">
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                    />
                  </div>
                </div>
                {settings.soundEnabled && (
                  <div className="flex gap-2">
                    <Select
                      value={settings.soundType}
                      onValueChange={(value) => setSettings({ ...settings, soundType: value as SoundType })}
                    >
                      <SelectTrigger className="flex-1 h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundOptions.map((sound) => (
                          <SelectItem key={sound.id} value={sound.id}>
                            {sound.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={handlePreviewSound}>
                      <BellRing className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Examples Card */}
        <GlassCard className="bg-muted/20">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              أمثلة على أوقات البصمة
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { arrival: '7:00', start: '9:01', end: '10:00' },
                { arrival: '7:30', start: '9:31', end: '10:30' },
                { arrival: '8:00', start: '10:01', end: '11:00' },
              ].map((example) => (
                <div key={example.arrival} className="bg-background/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">إذا حضرت</p>
                  <p className="text-2xl font-bold text-primary font-mono">{example.arrival} ص</p>
                  <p className="text-sm text-muted-foreground mt-2">فترة البصمة</p>
                  <p className="font-semibold font-mono">{example.start} - {example.end} ص</p>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </TeacherLayout>
  );
};

export default FingerprintPage;
