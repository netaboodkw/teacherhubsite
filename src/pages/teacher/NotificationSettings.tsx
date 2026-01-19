import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Info,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
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
  } = useNotificationSystem();

  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);

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

        {/* تنبيه إذا الإشعارات غير مفعلة */}
        {isNative && permissionStatus !== 'granted' && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold">الإشعارات غير مفعّلة!</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p className="text-sm">
                لن تتمكن من استلام تذكيرات الحصص والبصمة بدون تفعيل الإشعارات.
              </p>
              
              {permissionStatus === 'denied' ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">لتفعيل الإشعارات:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm mr-2">
                    <li>افتح إعدادات الجهاز</li>
                    <li>ابحث عن "Teacher Hub"</li>
                    <li>اضغط على "الإشعارات"</li>
                    <li>فعّل "السماح بالإشعارات"</li>
                  </ol>
                  <Button 
                    variant="outline"
                    onClick={handleEnableNotifications}
                    disabled={requesting}
                    className="mt-2 w-full"
                  >
                    {requesting ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleEnableNotifications}
                  disabled={requesting}
                  className="w-full"
                >
                  {requesting ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Bell className="w-4 h-4 ml-2" />
                  )}
                  تفعيل الإشعارات الآن
                </Button>
              )}
            </AlertDescription>
          </Alert>
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
          </CardContent>
        </Card>

      </div>
    </TeacherLayout>
  );
}
