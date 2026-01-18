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
  Info
} from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { toast } from 'sonner';

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

  const handleEnableNotifications = async () => {
    const pushGranted = await requestPushPermissions();
    const localGranted = await requestLocalPermissions();
    
    if (pushGranted || localGranted) {
      updatePreferences({ push_enabled: true });
      toast.success('تم تفعيل الإشعارات بنجاح!');
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
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={Bell}
          title="إعدادات الإشعارات"
          subtitle="تخصيص إشعارات التذكير والتنبيهات"
        />

        {/* Platform Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>معلومات الجهاز</AlertTitle>
          <AlertDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              <Smartphone className="w-3 h-3 ml-1" />
              {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'متصفح ويب'}
            </Badge>
            <Badge variant={permissionStatus === 'granted' ? 'default' : 'destructive'}>
              {permissionStatus === 'granted' ? (
                <><CheckCircle2 className="w-3 h-3 ml-1" /> مفعّل</>
              ) : permissionStatus === 'denied' ? (
                <><XCircle className="w-3 h-3 ml-1" /> مرفوض</>
              ) : (
                <>في الانتظار</>
              )}
            </Badge>
            {pushToken && (
              <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                Token: {pushToken.substring(0, 20)}...
              </Badge>
            )}
          </AlertDescription>
        </Alert>

        {/* Enable Notifications */}
        {permissionStatus !== 'granted' && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" />
                تفعيل الإشعارات
              </CardTitle>
              <CardDescription>
                فعّل الإشعارات لاستلام التذكيرات المهمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleEnableNotifications} className="w-full sm:w-auto">
                <Bell className="w-4 h-4 ml-2" />
                تفعيل الإشعارات الآن
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>تفضيلات الإشعارات</CardTitle>
            <CardDescription>
              اختر أنواع الإشعارات التي تريد استلامها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-base">الإشعارات الفورية</Label>
                  <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Fingerprint className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <Label className="text-base">تذكير البصمة</Label>
                  <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <Label className="text-base">تذكير الحصص</Label>
                  <p className="text-sm text-muted-foreground">
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
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <Label className="text-base">وقت التذكير المسبق</Label>
              </div>
              <Select
                value={preferences.reminder_minutes_before.toString()}
                onValueChange={(value) => updatePreferences({ reminder_minutes_before: parseInt(value) })}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
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
          </CardContent>
        </Card>

        {/* Sound & Vibration */}
        <Card>
          <CardHeader>
            <CardTitle>الصوت والاهتزاز</CardTitle>
            <CardDescription>
              تخصيص طريقة التنبيه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Volume2 className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <Label className="text-base">صوت الإشعار</Label>
                  <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Vibrate className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <Label className="text-base">الاهتزاز</Label>
                  <p className="text-sm text-muted-foreground">
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

        {/* iOS Instructions */}
        {platform === 'web' && (
          <Card>
            <CardHeader>
              <CardTitle>تحويل إلى تطبيق iOS</CardTitle>
              <CardDescription>
                للحصول على أفضل تجربة إشعارات على iPhone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>افتح Safari على جهاز iPhone</li>
                <li>اذهب إلى هذا الموقع</li>
                <li>اضغط على زر المشاركة (السهم للأعلى)</li>
                <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
                <li>أو: قم ببناء التطبيق الأصلي عبر Capacitor</li>
              </ol>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  للحصول على إشعارات Push كاملة على iOS، يجب بناء التطبيق كتطبيق أصلي عبر Xcode.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  );
}
