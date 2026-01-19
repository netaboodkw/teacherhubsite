import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  BellRing, 
  Smartphone, 
  Volume2, 
  Vibrate, 
  Clock, 
  Fingerprint,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Play,
  Music,
  Zap
} from 'lucide-react';
import { soundOptions, previewSound, type SoundType } from '@/lib/notificationSounds';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { getHapticEnabled, setHapticEnabled } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function NotificationSettings() {
  const {
    isNative,
    platform,
    pushToken,
    permissionStatus,
    preferences,
    preferencesLoading,
    requestPushPermissions,
    requestLocalPermissions,
    updatePreferences,
    isUpdating,
    sendNotification,
  } = useNotificationSystem();

  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundType>('schoolBell');
  const [hapticEnabled, setHapticEnabledState] = useState(getHapticEnabled());

  const handleHapticToggle = (enabled: boolean) => {
    setHapticEnabled(enabled);
    setHapticEnabledState(enabled);
    toast.success(enabled ? 'تم تفعيل الاهتزاز عند إدخال الدرجات' : 'تم إيقاف الاهتزاز عند إدخال الدرجات');
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      await sendNotification('🔔 اختبار الإشعارات', 'هذا إشعار تجريبي - الإشعارات تعمل بشكل صحيح!');
      toast.success('تم إرسال إشعار تجريبي');
    } catch (error) {
      toast.error('فشل إرسال الإشعار التجريبي');
    } finally {
      setTesting(false);
    }
  };

  const handleEnableNotifications = async () => {
    setRequesting(true);
    try {
      const pushGranted = await requestPushPermissions();
      const localGranted = await requestLocalPermissions();
      
      if (pushGranted || localGranted) {
        updatePreferences({ push_enabled: true });
        toast.success('تم تفعيل الإشعارات بنجاح!');
      }
    } finally {
      setRequesting(false);
    }
  };

  const copyToken = async () => {
    if (!pushToken) return;
    try {
      await navigator.clipboard.writeText(pushToken);
      setCopied(true);
      toast.success('تم نسخ التوكن');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('فشل نسخ التوكن');
    }
  };

  if (preferencesLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-4 sm:space-y-6 pb-20">
        {/* Header */}
        <PageHeader
          icon={Bell}
          title="إعدادات الإشعارات"
          subtitle="تخصيص إشعارات التذكير والتنبيهات"
          iconVariant="amber"
        />

        {/* تنبيه وزر تفعيل الإشعارات على iOS */}
        {isNative && permissionStatus !== 'granted' && (
          <Card className="border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-amber-500/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* أيقونة متحركة */}
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                  <div className="relative p-4 rounded-full bg-orange-500/20">
                    <BellRing className="w-10 h-10 text-orange-500 animate-bounce" />
                  </div>
                </div>
                
                {/* العنوان والوصف */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    الإشعارات غير مفعّلة
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    فعّل الإشعارات لتستلم تذكيرات الحصص والبصمة على جهازك
                  </p>
                </div>

                {/* زر التفعيل */}
                <Button 
                  onClick={handleEnableNotifications}
                  disabled={requesting}
                  size="lg"
                  className="w-full max-w-xs h-14 text-lg font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
                >
                  {requesting ? (
                    <Loader2 className="w-6 h-6 animate-spin ml-2" />
                  ) : (
                    <Bell className="w-6 h-6 ml-2" />
                  )}
                  تفعيل الإشعارات
                </Button>

                {/* تعليمات إذا تم الرفض */}
                {permissionStatus === 'denied' && (
                  <div className="w-full p-4 bg-muted/50 rounded-xl text-right">
                    <p className="text-sm font-medium text-foreground mb-2">
                      إذا لم يعمل الزر، اتبع الخطوات التالية:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mr-2">
                      <li>افتح <strong>إعدادات</strong> الجهاز</li>
                      <li>ابحث عن تطبيق <strong>Teacher Hub</strong></li>
                      <li>اضغط على <strong>الإشعارات</strong></li>
                      <li>فعّل <strong>السماح بالإشعارات</strong></li>
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* حالة الإشعارات */}
        <Card className={cn(
          "border-2 transition-colors",
          permissionStatus === 'granted' 
            ? "border-green-500/30 bg-green-500/5" 
            : "border-orange-500/30 bg-orange-500/5"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  permissionStatus === 'granted' ? "bg-green-500/20" : "bg-orange-500/20"
                )}>
                  {permissionStatus === 'granted' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-orange-500" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {permissionStatus === 'granted' ? 'الإشعارات مفعّلة ✓' : 'الإشعارات غير مفعّلة'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {permissionStatus === 'granted' 
                      ? 'ستتلقى التذكيرات والتنبيهات على جهازك' 
                      : 'لن تستلم أي تذكيرات أو تنبيهات'}
                  </CardDescription>
                </div>
              </div>
              
              {permissionStatus === 'granted' && (
                <Badge variant="default" className="bg-green-500 rounded-lg">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  مفعّل
                </Badge>
              )}
            </div>
          </CardHeader>
          
          {/* معلومات النظام */}
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="rounded-lg">
                <Smartphone className="w-3 h-3 ml-1" />
                {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'تطبيق'}
              </Badge>
            </div>
            
            {/* Push Token - للمطورين فقط */}
            {pushToken && (
              <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Device Token</p>
                    <p className="text-xs font-mono text-foreground truncate" dir="ltr">
                      {pushToken}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToken}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* زر اختبار الإشعارات */}
            {permissionStatus === 'granted' && (
              <Button
                onClick={handleTestNotification}
                disabled={testing}
                variant="outline"
                className="w-full mt-3"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Bell className="w-4 h-4 ml-2" />
                )}
                اختبار الإشعارات
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">تفضيلات الإشعارات</CardTitle>
            <CardDescription className="text-sm">
              اختر أنواع الإشعارات التي تريد استلامها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Push Notifications */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">الإشعارات الفورية</Label>
                  <p className="text-xs text-muted-foreground">
                    استلام إشعارات على جهازك
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => updatePreferences({ push_enabled: checked })}
                disabled={isUpdating}
              />
            </div>

            {/* Fingerprint Reminder */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <Fingerprint className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">تذكير البصمة</Label>
                  <p className="text-xs text-muted-foreground">
                    تذكير ببصمة التواجد
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.fingerprint_reminder}
                onCheckedChange={(checked) => updatePreferences({ fingerprint_reminder: checked })}
                disabled={isUpdating}
              />
            </div>

            {/* Schedule Reminder */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">تذكير الحصص</Label>
                  <p className="text-xs text-muted-foreground">
                    تذكير قبل بداية الحصة
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.schedule_reminder}
                onCheckedChange={(checked) => updatePreferences({ schedule_reminder: checked })}
                disabled={isUpdating}
              />
            </div>

            {/* Reminder Time */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <Label className="text-sm font-medium">وقت التذكير المسبق</Label>
              </div>
              <Select
                value={preferences.reminder_minutes_before.toString()}
                onValueChange={(value) => updatePreferences({ reminder_minutes_before: parseInt(value) })}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[100px] h-9 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="5" className="text-sm">5 دقائق</SelectItem>
                  <SelectItem value="10" className="text-sm">10 دقائق</SelectItem>
                  <SelectItem value="15" className="text-sm">15 دقيقة</SelectItem>
                  <SelectItem value="20" className="text-sm">20 دقيقة</SelectItem>
                  <SelectItem value="30" className="text-sm">30 دقيقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sound & Vibration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الصوت والاهتزاز</CardTitle>
            <CardDescription className="text-sm">
              تخصيص طريقة التنبيه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sound */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <Volume2 className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">صوت الإشعار</Label>
                  <p className="text-xs text-muted-foreground">
                    تشغيل صوت عند الإشعار
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.sound_enabled}
                onCheckedChange={(checked) => updatePreferences({ sound_enabled: checked })}
                disabled={isUpdating}
              />
            </div>

            {/* اختيار نوع الصوت */}
            {preferences.sound_enabled && (
              <div className="space-y-3 pr-3 border-r-2 border-primary/20">
                <Label className="flex items-center gap-2 text-sm">
                  <Music className="w-4 h-4" />
                  نوع صوت التنبيه
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {soundOptions.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => setSelectedSound(sound.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-right",
                        selectedSound === sound.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{sound.nameAr}</div>
                        <div className="text-xs text-muted-foreground">{sound.description}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewSound(sound.id);
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vibration */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/10">
                  <Vibrate className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">الاهتزاز</Label>
                  <p className="text-xs text-muted-foreground">
                    اهتزاز الجهاز عند الإشعار
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.vibration_enabled}
                onCheckedChange={(checked) => updatePreferences({ vibration_enabled: checked })}
                disabled={isUpdating}
              />
            </div>

            {/* Haptic when entering grades */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">الاهتزاز عند إدخال الدرجات</Label>
                  <p className="text-xs text-muted-foreground">
                    اهتزاز عند حفظ الدرجة بنجاح
                  </p>
                </div>
              </div>
              <Switch
                checked={hapticEnabled}
                onCheckedChange={handleHapticToggle}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </TeacherLayout>
  );
}
