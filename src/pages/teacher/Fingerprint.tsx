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
  Settings,
  RotateCcw,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { playNotificationSound, soundOptions, SoundType, previewSound } from '@/lib/notificationSounds';
import { format, addHours, addMinutes, differenceInMinutes, differenceInSeconds, subMonths, addMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { useFingerprintScheduler } from '@/hooks/useFingerprintScheduler';
import { isBannerDisabled, setBannerDisabled } from '@/components/notifications/WelcomeAttendanceBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { useFingerprintStats, useRecordFingerprint } from '@/hooks/useFingerprintRecords';

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
  
  // Stats month navigation
  const [statsMonth, setStatsMonth] = useState(new Date());
  const { stats, records, isLoading: loadingStats } = useFingerprintStats(statsMonth);
  const recordFingerprint = useRecordFingerprint();
  
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
  const [welcomeBannerEnabled, setWelcomeBannerEnabled] = useState(() => !isBannerDisabled());
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const handleWelcomeBannerToggle = (enabled: boolean) => {
    setWelcomeBannerEnabled(enabled);
    setBannerDisabled(!enabled);
    toast.success(enabled ? 'تم تفعيل بانر الترحيب ✓' : 'تم إخفاء بانر الترحيب بشكل كامل');
  };

  // Show toast when settings change
  const handleSettingsChange = (newSettings: Partial<FingerprintSettings>, message: string) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast.success(`تم حفظ الإعدادات ✓`, { description: message });
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
    
    // Save to database
    if (fingerprintWindow) {
      try {
        await recordFingerprint.mutateAsync({
          attendanceTime: settings.attendanceTime,
          windowStart: format(fingerprintWindow.start, 'HH:mm:ss'),
          windowEnd: format(fingerprintWindow.end, 'HH:mm:ss'),
          status: status === 'urgent' ? 'late' : 'on_time',
        });
      } catch (error) {
        console.error('Failed to save fingerprint record:', error);
      }
    }
    
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
        <div className="min-h-screen bg-background">
          {/* Simple Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
            <div className="flex items-center justify-between px-4 h-14">
              <h1 className="font-bold text-lg">بصمة التواجد</h1>
              <Button
                variant={showSettings ? "default" : "ghost"}
                size="sm"
                className="rounded-full gap-2"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className={cn("w-4 h-4 transition-transform", showSettings && "rotate-90")} />
                {showSettings ? "إغلاق" : "الإعدادات"}
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-24">
            {/* Settings Section - At Top When Open */}
            {showSettings && (
              <div className="space-y-3 animate-in slide-in-from-top duration-200">
                {/* Welcome Banner Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border-2 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">بانر الترحيب والحضور</p>
                      <p className="text-xs text-muted-foreground">يظهر عند فتح التطبيق صباحاً</p>
                    </div>
                  </div>
                  <div dir="ltr">
                    <Switch
                      checked={welcomeBannerEnabled}
                      onCheckedChange={handleWelcomeBannerToggle}
                    />
                  </div>
                </div>

                {/* Other Settings */}
                <div className="p-4 rounded-2xl bg-muted/30 space-y-4">
                  {/* Reminder Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BellRing className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">تذكيرات البصمة</p>
                        <p className="text-xs text-muted-foreground">تنبيه عند بداية ونهاية الفترة</p>
                      </div>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={settings.reminderEnabled}
                        onCheckedChange={(checked) => handleSettingsChange({ reminderEnabled: checked }, checked ? 'تم تفعيل التذكيرات' : 'تم إيقاف التذكيرات')}
                      />
                    </div>
                  </div>

                  {settings.reminderEnabled && (
                    <>
                      {/* Reminder Time */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">التنبيه قبل الانتهاء</span>
                        <Select
                          value={settings.reminderMinutesBefore.toString()}
                          onValueChange={(value) => handleSettingsChange({ reminderMinutesBefore: parseInt(value) }, `التنبيه قبل ${value} دقائق`)}
                        >
                          <SelectTrigger className="w-28 h-9 rounded-lg">
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
                          <span className="text-sm">التنبيه الصوتي</span>
                        </div>
                        <div dir="ltr">
                          <Switch
                            checked={settings.soundEnabled}
                            onCheckedChange={(checked) => handleSettingsChange({ soundEnabled: checked }, checked ? 'تم تفعيل الصوت' : 'تم إيقاف الصوت')}
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
                            <SelectTrigger className="flex-1 h-10 rounded-lg">
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
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" onClick={handlePreviewSound}>
                            <BellRing className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Current Time */}
            <div className="text-center py-3">
              <p className="text-4xl font-mono font-bold tracking-tight">
                {format(currentTime, 'HH:mm')}
                <span className="text-xl text-muted-foreground">:{format(currentTime, 'ss')}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">التوقيت الكويتي</p>
            </div>

            {/* Main Status Card */}
            <div className={cn(
              "rounded-3xl p-5 text-center",
              "bg-gradient-to-br shadow-lg",
              statusConfig.color,
              statusConfig.borderColor,
              "border-2",
              status === 'urgent' && "animate-pulse"
            )}>
              {/* Status Icon */}
              <div className={cn(
                "w-16 h-16 rounded-full mx-auto mb-3",
                "bg-background/70 backdrop-blur-sm shadow-md",
                "flex items-center justify-center",
                status === 'completed' && "ring-4 ring-primary/30"
              )}>
                <StatusIcon className={cn("w-8 h-8", statusConfig.iconColor)} />
              </div>

              {/* Status Text */}
              <h2 className="text-xl font-bold mb-1">{statusConfig.label}</h2>
              <p className="text-sm text-muted-foreground mb-4">{statusConfig.sublabel}</p>

              {/* Time Window */}
              {fingerprintWindow && !fingerprintDone && status !== 'expired' && (
                <div className="bg-background/50 rounded-2xl p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-muted-foreground">البداية</p>
                      <p className="text-lg font-bold font-mono">{format(fingerprintWindow.start, 'HH:mm')}</p>
                    </div>
                    <div className="text-center flex-1 border-x border-border/30">
                      <Timer className="w-3 h-3 mx-auto text-muted-foreground" />
                      <p className="text-lg font-bold font-mono text-primary">{timeRemaining}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-muted-foreground">النهاية</p>
                      <p className="text-lg font-bold font-mono">{format(fingerprintWindow.end, 'HH:mm')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!fingerprintDone ? (
                <Button 
                  size="lg" 
                  onClick={markFingerprintDone}
                  className="w-full h-12 text-base rounded-xl shadow-md"
                  disabled={status === 'waiting'}
                >
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  تم تسجيل البصمة
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={resetFingerprint}
                  className="w-full h-12 text-base rounded-xl bg-background/50"
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              )}
            </div>

            {/* Attendance Time Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">وقت الحضور</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {commonTimes.map((time) => (
                  <Button
                    key={time}
                    variant={settings.attendanceTime === time ? 'default' : 'outline'}
                    onClick={() => handleAttendanceTimeChange(time)}
                    className="font-mono text-sm h-11 rounded-xl"
                  >
                    {time}
                  </Button>
                ))}
              </div>
              
              <Input
                type="time"
                value={settings.attendanceTime}
                onChange={(e) => handleAttendanceTimeChange(e.target.value)}
                className="h-11 font-mono text-center rounded-xl"
              />
            </div>

            {/* Monthly Stats */}
            <div className="rounded-2xl bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">إحصائيات الشهر</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => setStatsMonth(subMonths(statsMonth, 1))}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  <span className="text-xs min-w-[80px] text-center">
                    {format(statsMonth, 'MMM yyyy', { locale: ar })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => setStatsMonth(addMonths(statsMonth, 1))}
                    disabled={format(statsMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {loadingStats ? (
                <div className="text-center py-3 text-muted-foreground text-sm">جاري التحميل...</div>
              ) : stats.total === 0 ? (
                <div className="text-center py-3 text-muted-foreground text-sm">
                  <Calendar className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p>لا توجد سجلات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-xl bg-emerald-500/10">
                      <p className="text-xl font-bold text-emerald-600">{stats.onTime}</p>
                      <p className="text-[10px] text-muted-foreground">في الوقت</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-amber-500/10">
                      <p className="text-xl font-bold text-amber-600">{stats.late}</p>
                      <p className="text-[10px] text-muted-foreground">متأخر</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-primary/10">
                      <p className="text-xl font-bold text-primary">{stats.total}</p>
                      <p className="text-[10px] text-muted-foreground">إجمالي</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-background/50">
                    <span className="text-xs text-muted-foreground">نسبة الحضور في الوقت</span>
                    <span className={cn(
                      "text-base font-bold",
                      stats.onTimeRate >= 80 ? "text-emerald-600" : stats.onTimeRate >= 50 ? "text-amber-600" : "text-destructive"
                    )}>
                      {stats.onTimeRate}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex gap-2 p-3 rounded-xl bg-muted/20 text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>القرار رقم 6 لسنة 2024: بصمة التواجد خلال 60 دقيقة بعد ساعتين من الحضور</p>
            </div>
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
                  <Label className="text-base font-semibold">بانر الترحيب والحضور</Label>
                  <p className="text-sm text-muted-foreground">عرض بانر عند فتح التطبيق</p>
                </div>
                <div dir="ltr">
                  <Switch
                    checked={welcomeBannerEnabled}
                    onCheckedChange={handleWelcomeBannerToggle}
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
                    onCheckedChange={(checked) => handleSettingsChange({ reminderEnabled: checked }, checked ? 'تم تفعيل التذكيرات' : 'تم إيقاف التذكيرات')}
                  />
                </div>
              </div>

              {/* Reminder Time */}
              <div className="space-y-2">
                <Label>التنبيه قبل انتهاء الفترة</Label>
                <Select
                  value={settings.reminderMinutesBefore.toString()}
                  onValueChange={(value) => handleSettingsChange({ reminderMinutesBefore: parseInt(value) }, `التنبيه قبل ${value} دقائق`)}
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
                      onCheckedChange={(checked) => handleSettingsChange({ soundEnabled: checked }, checked ? 'تم تفعيل الصوت' : 'تم إيقاف الصوت')}
                    />
                  </div>
                </div>
                {settings.soundEnabled && (
                  <div className="flex gap-2">
                    <Select
                      value={settings.soundType}
                      onValueChange={(value) => handleSettingsChange({ soundType: value as SoundType }, 'تم تغيير نغمة التنبيه')}
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

        {/* Monthly Stats Card - Desktop */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                إحصائيات البصمة الشهرية
              </GlassCardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  onClick={() => setStatsMonth(subMonths(statsMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-base font-medium min-w-[120px] text-center">
                  {format(statsMonth, 'MMMM yyyy', { locale: ar })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  onClick={() => setStatsMonth(addMonths(statsMonth, 1))}
                  disabled={format(statsMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {loadingStats ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : stats.total === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">لا توجد سجلات لهذا الشهر</p>
                <p className="text-sm">ستظهر إحصائياتك هنا عند تسجيل البصمة</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-4xl font-bold text-emerald-600">{stats.onTime}</p>
                  <p className="text-sm text-muted-foreground mt-1">في الوقت</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                  <p className="text-4xl font-bold text-amber-600">{stats.late}</p>
                  <p className="text-sm text-muted-foreground mt-1">متأخر</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/20">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-4xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">إجمالي الأيام</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-background border">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className={cn(
                    "text-4xl font-bold",
                    stats.onTimeRate >= 80 ? "text-emerald-600" : stats.onTimeRate >= 50 ? "text-amber-600" : "text-destructive"
                  )}>
                    {stats.onTimeRate}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">نسبة الانضباط</p>
                </div>
              </div>
            )}
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
