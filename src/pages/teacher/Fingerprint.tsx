import { useState, useEffect, useCallback, useMemo } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fingerprint as FingerprintIcon, Clock, Bell, BellRing, Volume2, VolumeX, AlertTriangle, CheckCircle2, Timer, Info } from 'lucide-react';
import { playNotificationSound, soundOptions, SoundType, previewSound } from '@/lib/notificationSounds';
import { format, addHours, addMinutes, isWithinInterval, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/common/PageHeader';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { useFingerprintScheduler } from '@/hooks/useFingerprintScheduler';

interface FingerprintSettings {
  attendanceTime: string; // وقت الحضور الفعلي
  reminderEnabled: boolean;
  reminderMinutesBefore: number; // كم دقيقة قبل انتهاء الفترة
  soundEnabled: boolean;
  soundType: SoundType;
  autoDetectAttendance: boolean;
}

// دالة للحصول على التوقيت الكويتي الحالي
const getKuwaitTime = (): Date => {
  const now = new Date();
  // Kuwait is UTC+3
  const kuwaitOffset = 3 * 60; // in minutes
  const localOffset = now.getTimezoneOffset();
  const totalOffset = localOffset + kuwaitOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
};

// حساب فترة بصمة التواجد
const calculateFingerprintWindow = (attendanceTime: string): { start: Date; end: Date } | null => {
  if (!attendanceTime) return null;
  
  const [hours, minutes] = attendanceTime.split(':').map(Number);
  const now = getKuwaitTime();
  
  // إنشاء تاريخ الحضور لليوم
  const attendanceDate = new Date(now);
  attendanceDate.setHours(hours, minutes, 0, 0);
  
  // بداية الفترة = الحضور + ساعتين + دقيقة واحدة
  const windowStart = addMinutes(addHours(attendanceDate, 2), 1);
  
  // نهاية الفترة = بداية الفترة + 59 دقيقة (إجمالي 60 دقيقة)
  const windowEnd = addMinutes(windowStart, 59);
  
  return { start: windowStart, end: windowEnd };
};

// حالة البصمة
type FingerprintStatus = 'waiting' | 'active' | 'urgent' | 'expired' | 'completed';

const FingerprintPage = () => {
  const { sendImmediateNotification, isNative, permissionGranted, triggerHaptics } = useNativeNotifications();
  
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

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getKuwaitTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // حفظ الإعدادات
  useEffect(() => {
    localStorage.setItem('fingerprint-settings', JSON.stringify(settings));
  }, [settings]);

  // إعادة تعيين حالة البصمة في بداية اليوم
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

  // حساب فترة البصمة
  const fingerprintWindow = useMemo(() => {
    return calculateFingerprintWindow(settings.attendanceTime);
  }, [settings.attendanceTime]);

  // حساب الحالة والوقت المتبقي
  const { timeRemaining, minutesRemaining, secondsRemaining } = useMemo(() => {
    if (!fingerprintWindow || fingerprintDone) {
      return { timeRemaining: '', minutesRemaining: 0, secondsRemaining: 0 };
    }

    const { start, end } = fingerprintWindow;
    
    if (currentTime < start) {
      // قبل بدء الفترة
      const mins = differenceInMinutes(start, currentTime);
      const secs = differenceInSeconds(start, currentTime) % 60;
      return {
        timeRemaining: `${mins} دقيقة ${secs} ثانية حتى بداية الفترة`,
        minutesRemaining: mins,
        secondsRemaining: secs,
      };
    } else if (currentTime >= start && currentTime <= end) {
      // داخل الفترة
      const mins = differenceInMinutes(end, currentTime);
      const secs = differenceInSeconds(end, currentTime) % 60;
      return {
        timeRemaining: `${mins} دقيقة ${secs} ثانية متبقية`,
        minutesRemaining: mins,
        secondsRemaining: secs,
      };
    } else {
      // بعد انتهاء الفترة
      return { timeRemaining: 'انتهت الفترة', minutesRemaining: 0, secondsRemaining: 0 };
    }
  }, [fingerprintWindow, currentTime, fingerprintDone]);

  // تحديث الحالة
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

  // تشغيل التنبيه الصوتي وإرسال إشعار
  const playReminder = useCallback(async (title: string, body: string) => {
    // تشغيل الصوت داخل التطبيق
    if (settings.soundEnabled) {
      playNotificationSound(settings.soundType, true);
    }
    
    // إرسال إشعار محلي (يعمل حتى لو التطبيق في الخلفية)
    try {
      await sendImmediateNotification(title, body);
      console.log('Fingerprint notification sent:', title);
    } catch (error) {
      console.error('Failed to send fingerprint notification:', error);
    }
    
    // اهتزاز
    triggerHaptics('heavy');
  }, [settings.soundEnabled, settings.soundType, sendImmediateNotification, triggerHaptics]);

  // نظام التذكير
  useEffect(() => {
    if (!settings.reminderEnabled || !fingerprintWindow || fingerprintDone) return;

    const { start, end } = fingerprintWindow;
    
    // تذكير عند بداية الفترة
    if (status === 'active' && !lastReminderTime) {
      playReminder('⏰ بدأت فترة بصمة التواجد!', 'يرجى التوجه لجهاز البصمة الآن');
      setLastReminderTime(currentTime);
      toast.warning('⏰ بدأت فترة بصمة التواجد!', {
        description: 'يرجى التوجه لجهاز البصمة الآن',
        duration: 10000,
      });
    }

    // تذكير عند اقتراب انتهاء الفترة
    if (status === 'urgent' && minutesRemaining === settings.reminderMinutesBefore) {
      const now = currentTime.getTime();
      const lastReminder = lastReminderTime?.getTime() || 0;
      
      // تأكد من عدم تكرار التنبيه في نفس الدقيقة
      if (now - lastReminder > 55000) {
        playReminder('⚠️ تنبيه عاجل!', `متبقي ${minutesRemaining} دقيقة على انتهاء فترة البصمة`);
        setLastReminderTime(currentTime);
        toast.error('⚠️ تنبيه عاجل!', {
          description: `متبقي ${minutesRemaining} دقيقة على انتهاء فترة البصمة`,
          duration: 15000,
        });
      }
    }

    // تذكير كل 5 دقائق خلال الفترة العاجلة
    if (status === 'urgent' && minutesRemaining > 0 && minutesRemaining % 5 === 0 && minutesRemaining !== settings.reminderMinutesBefore) {
      const now = currentTime.getTime();
      const lastReminder = lastReminderTime?.getTime() || 0;
      
      if (now - lastReminder > 55000) {
        playReminder('⏰ تذكير البصمة', `متبقي ${minutesRemaining} دقيقة على انتهاء فترة البصمة`);
        setLastReminderTime(currentTime);
      }
    }
  }, [status, minutesRemaining, settings, fingerprintWindow, fingerprintDone, lastReminderTime, playReminder, currentTime]);


  // تكامل مع جدولة التنبيهات المسبقة
  const { scheduleFingerprintNotifications, cancelFingerprintNotifications, markAttendanceTimeSet } = useFingerprintScheduler();
  
  // جدولة التنبيهات عند تغيير الإعدادات
  useEffect(() => {
    if (settings.reminderEnabled && !fingerprintDone) {
      scheduleFingerprintNotifications(settings);
    }
  }, [settings.attendanceTime, settings.reminderEnabled, settings.reminderMinutesBefore, fingerprintDone, scheduleFingerprintNotifications, settings]);

  // تسجيل إتمام البصمة
  const markFingerprintDone = async () => {
    setFingerprintDone(true);
    localStorage.setItem('fingerprint-done-date', format(currentTime, 'yyyy-MM-dd'));
    
    // إلغاء التنبيهات المجدولة
    await cancelFingerprintNotifications();
    
    toast.success('تم تسجيل البصمة بنجاح! ✅');
  };

  // إعادة تعيين
  const resetFingerprint = async () => {
    setFingerprintDone(false);
    setLastReminderTime(null);
    localStorage.removeItem('fingerprint-done-date');
    
    // إعادة جدولة التنبيهات
    await scheduleFingerprintNotifications(settings);
    
    toast.info('تم إعادة تعيين حالة البصمة');
  };
  
  // تحديث وقت الحضور
  const handleAttendanceTimeChange = async (time: string) => {
    const newSettings = { ...settings, attendanceTime: time };
    setSettings(newSettings);
    markAttendanceTimeSet();
    
    // إعادة جدولة التنبيهات مع الوقت الجديد
    if (newSettings.reminderEnabled && !fingerprintDone) {
      await scheduleFingerprintNotifications(newSettings);
      toast.success('تم تحديث وقت الحضور وجدولة التنبيهات');
    }
  };

  // معاينة الصوت
  const handlePreviewSound = () => {
    previewSound(settings.soundType);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="text-lg px-4 py-2"><Clock className="w-4 h-4 ml-2" />في انتظار بدء الفترة</Badge>;
      case 'active':
        return <Badge className="text-lg px-4 py-2 bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-4 h-4 ml-2" />الفترة مفتوحة الآن</Badge>;
      case 'urgent':
        return <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse"><AlertTriangle className="w-4 h-4 ml-2" />وقت عاجل!</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-lg px-4 py-2"><AlertTriangle className="w-4 h-4 ml-2" />انتهت الفترة</Badge>;
      case 'completed':
        return <Badge className="text-lg px-4 py-2 bg-primary"><CheckCircle2 className="w-4 h-4 ml-2" />تم تسجيل البصمة ✓</Badge>;
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={FingerprintIcon}
          title="بصمة التواجد"
          subtitle="نظام تذكير بصمة التواجد للمعلمين - الكويت"
          iconVariant="rose"
          actions={
            <div className="text-left">
              <p className="text-sm text-muted-foreground">التوقيت الحالي (الكويت)</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {format(currentTime, 'HH:mm:ss')}
              </p>
            </div>
          }
        />

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>ما هي بصمة التواجد؟</AlertTitle>
          <AlertDescription>
            وفقاً للقرار رقم 6 لسنة 2024، يجب على المعلم تسجيل بصمة التواجد خلال <strong>60 دقيقة</strong> تبدأ بعد مرور <strong>ساعتين</strong> من وقت حضوره الفعلي.
            <br />
            مثال: إذا حضرت الساعة 7:00 صباحاً، فإن فترة البصمة تكون من 9:01 إلى 10:00 صباحاً.
          </AlertDescription>
        </Alert>

        {/* Status Card */}
        <Card className={`border-2 ${status === 'urgent' ? 'border-destructive bg-destructive/5' : status === 'active' ? 'border-green-500 bg-green-500/5' : status === 'completed' ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">حالة البصمة</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              {getStatusBadge()}
            </div>

            {fingerprintWindow && !fingerprintDone && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">بداية الفترة</p>
                    <p className="text-xl font-bold">{format(fingerprintWindow.start, 'HH:mm')}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">نهاية الفترة</p>
                    <p className="text-xl font-bold">{format(fingerprintWindow.end, 'HH:mm')}</p>
                  </div>
                </div>

                {timeRemaining && (
                  <div className={`text-center p-4 rounded-lg ${status === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                    <Timer className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{timeRemaining}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center gap-4">
              {!fingerprintDone ? (
                <Button 
                  size="lg" 
                  onClick={markFingerprintDone}
                  className="text-lg px-8"
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
                  className="text-lg px-8"
                >
                  إعادة تعيين
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              إعدادات التذكير
            </CardTitle>
            <CardDescription>
              ضبط وقت الحضور وإعدادات التنبيهات الصوتية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* وقت الحضور */}
            <div className="space-y-2">
              <Label htmlFor="attendanceTime">وقت الحضور الفعلي</Label>
              <Input
                id="attendanceTime"
                type="time"
                value={settings.attendanceTime}
                onChange={(e) => handleAttendanceTimeChange(e.target.value)}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                أدخل وقت حضورك الفعلي لحساب فترة بصمة التواجد
                <br />
                <strong className="text-primary">التنبيهات ستعمل حتى عند إغلاق التطبيق! 🔔</strong>
              </p>
            </div>

            {/* تفعيل التذكير */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تفعيل التذكيرات</Label>
                <p className="text-sm text-muted-foreground">
                  استلام تنبيهات عند بدء الفترة واقتراب انتهائها
                </p>
              </div>
              <Switch
                checked={settings.reminderEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, reminderEnabled: checked })}
              />
            </div>

            {/* التنبيه قبل الانتهاء */}
            <div className="space-y-2">
              <Label>التنبيه قبل انتهاء الفترة بـ</Label>
              <Select
                value={settings.reminderMinutesBefore.toString()}
                onValueChange={(value) => setSettings({ ...settings, reminderMinutesBefore: parseInt(value) })}
              >
                <SelectTrigger className="max-w-[200px]">
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

            {/* تفعيل الصوت */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <Label>التنبيه الصوتي</Label>
                  <p className="text-sm text-muted-foreground">
                    تشغيل صوت عند التذكير
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
              />
            </div>

            {/* نوع الصوت */}
            {settings.soundEnabled && (
              <div className="space-y-2">
                <Label>نوع الصوت</Label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={settings.soundType}
                    onValueChange={(value) => setSettings({ ...settings, soundType: value as SoundType })}
                  >
                    <SelectTrigger className="max-w-[200px]">
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
                  <Button variant="outline" size="icon" onClick={handlePreviewSound}>
                    <BellRing className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Examples Card */}
        <Card>
          <CardHeader>
            <CardTitle>أمثلة على أوقات البصمة</CardTitle>
            <CardDescription>
              حسب القرار رقم 6 لسنة 2024
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">إذا حضرت</p>
                <p className="text-xl font-bold text-primary">7:00 ص</p>
                <p className="text-sm text-muted-foreground mt-2">فترة البصمة</p>
                <p className="font-semibold">9:01 ص - 10:00 ص</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">إذا حضرت</p>
                <p className="text-xl font-bold text-primary">7:30 ص</p>
                <p className="text-sm text-muted-foreground mt-2">فترة البصمة</p>
                <p className="font-semibold">9:31 ص - 10:30 ص</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">إذا حضرت</p>
                <p className="text-xl font-bold text-primary">8:00 ص</p>
                <p className="text-sm text-muted-foreground mt-2">فترة البصمة</p>
                <p className="font-semibold">10:01 ص - 11:00 ص</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
};

export default FingerprintPage;
