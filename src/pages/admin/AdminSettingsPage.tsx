import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Database, Bell, Loader2, Save, CheckCircle, LayoutGrid, CreditCard, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useSystemSettings';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings();
  const updateSystemSetting = useUpdateSystemSetting();
  
  const [settings, setSettings] = useState({
    appName: 'TeacherHub',
    allowRegistration: true,
    requireEmailVerification: false,
    maxClassroomsPerTeacher: 20,
    maxStudentsPerClassroom: 50,
    enableNotifications: true,
    maintenanceMode: false,
  });

  // Template settings from database
  const [allowEditLinkedTemplates, setAllowEditLinkedTemplates] = useState(true);

  // Payment gateway settings
  const [paymentSettings, setPaymentSettings] = useState({
    myfatoorah_api_key: '',
    myfatoorah_test_mode: true,
    payment_enabled: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Load settings from database
  useEffect(() => {
    if (systemSettings) {
      const templateSetting = systemSettings.find(s => s.key === 'allow_edit_linked_templates');
      if (templateSetting) {
        const value = templateSetting.value;
        setAllowEditLinkedTemplates(value === true || value === 'true');
      }

      // Load payment settings
      const myfatoorahKey = systemSettings.find(s => s.key === 'myfatoorah_api_key');
      const myfatoorahTestMode = systemSettings.find(s => s.key === 'myfatoorah_test_mode');
      const paymentEnabled = systemSettings.find(s => s.key === 'payment_enabled');

      setPaymentSettings({
        myfatoorah_api_key: myfatoorahKey?.value as string || '',
        myfatoorah_test_mode: myfatoorahTestMode?.value === true || myfatoorahTestMode?.value === 'true' || myfatoorahTestMode?.value === undefined,
        payment_enabled: paymentEnabled?.value === true || paymentEnabled?.value === 'true',
      });
    }
  }, [systemSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save template setting to database
      await updateSystemSetting.mutateAsync({
        key: 'allow_edit_linked_templates',
        value: allowEditLinkedTemplates
      });

      // Save payment settings
      await updateSystemSetting.mutateAsync({
        key: 'myfatoorah_api_key',
        value: paymentSettings.myfatoorah_api_key
      });
      await updateSystemSetting.mutateAsync({
        key: 'myfatoorah_test_mode',
        value: paymentSettings.myfatoorah_test_mode
      });
      await updateSystemSetting.mutateAsync({
        key: 'payment_enabled',
        value: paymentSettings.payment_enabled
      });

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">إعدادات النظام</h1>
            <p className="text-muted-foreground">إدارة الإعدادات العامة للنظام</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات العامة
              </CardTitle>
              <CardDescription>تخصيص الإعدادات الأساسية للتطبيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">اسم التطبيق</Label>
                <Input
                  id="appName"
                  value={settings.appName}
                  onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>السماح بالتسجيل الجديد</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح للمعلمين بإنشاء حسابات جديدة
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowRegistration: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التحقق من البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">
                    طلب تأكيد البريد الإلكتروني قبل استخدام الحساب
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Gateway Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                إعدادات بوابة الدفع (MyFatoorah)
              </CardTitle>
              <CardDescription>تكوين بوابة الدفع ماي فاتورة للاشتراكات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل بوابة الدفع</Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل إمكانية الدفع الإلكتروني للاشتراكات
                  </p>
                </div>
                <Switch
                  checked={paymentSettings.payment_enabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, payment_enabled: checked }))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  مفتاح API
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={paymentSettings.myfatoorah_api_key}
                    onChange={(e) => setPaymentSettings(prev => ({ ...prev, myfatoorah_api_key: e.target.value }))}
                    placeholder="أدخل مفتاح API من ماي فاتورة"
                    className="pl-10"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  يمكنك الحصول على مفتاح API من لوحة تحكم ماي فاتورة
                </p>
                {paymentSettings.myfatoorah_api_key && paymentSettings.myfatoorah_api_key.length > 10 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    تم إدخال مفتاح API ({paymentSettings.myfatoorah_api_key.length} حرف)
                  </p>
                )}
                {paymentSettings.myfatoorah_api_key && paymentSettings.myfatoorah_api_key.length <= 10 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    ⚠️ مفتاح API قصير جداً - تأكد من نسخه كاملاً
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>وضع الاختبار (Test Mode)</Label>
                  <p className="text-sm text-muted-foreground">
                    استخدام البيئة التجريبية للاختبار (يجب إيقافه للإنتاج)
                  </p>
                </div>
                <Switch
                  checked={paymentSettings.myfatoorah_test_mode}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, myfatoorah_test_mode: checked }))}
                />
              </div>

              {paymentSettings.myfatoorah_test_mode ? (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm text-warning">
                    ⚠️ وضع الاختبار مفعّل - سيتم استخدام البيئة التجريبية (apitest.myfatoorah.com)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    للحصول على مفتاح تجريبي: <a href="https://myfatoorah.readme.io/docs/demo-information" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">اضغط هنا</a>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-emerald-600">
                    ✓ وضع الإنتاج - سيتم استخدام البيئة الحقيقية (api.myfatoorah.com)
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <a 
                  href={paymentSettings.myfatoorah_test_mode ? "https://demo.myfatoorah.com/" : "https://portal.myfatoorah.com/"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  فتح لوحة تحكم ماي فاتورة {paymentSettings.myfatoorah_test_mode ? "(تجريبي)" : "(الإنتاج)"}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Limits Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                حدود النظام
              </CardTitle>
              <CardDescription>تحديد الحدود القصوى للاستخدام</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxClassrooms">الحد الأقصى للصفوف لكل معلم</Label>
                  <Input
                    id="maxClassrooms"
                    type="number"
                    value={settings.maxClassroomsPerTeacher}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxClassroomsPerTeacher: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">الحد الأقصى للطلاب لكل صف</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={settings.maxStudentsPerClassroom}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxStudentsPerClassroom: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                إعدادات القوالب
              </CardTitle>
              <CardDescription>التحكم في سلوك قوالب الدرجات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>السماح بتعديل القوالب المرتبطة</Label>
                  <p className="text-sm text-muted-foreground">
                    عند التفعيل، يمكن للمعلمين تعديل أو حذف القوالب حتى لو كانت مرتبطة بصفوف دراسية
                  </p>
                </div>
                <Switch
                  checked={allowEditLinkedTemplates}
                  onCheckedChange={setAllowEditLinkedTemplates}
                />
              </div>
              {!allowEditLinkedTemplates && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm text-warning">
                    ⚠️ عند إيقاف هذا الخيار، لن يتمكن المعلمون من تعديل أو حذف القوالب المرتبطة بصفوف نشطة
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
              <CardDescription>إعدادات الإشعارات والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">
                    إرسال إشعارات للمعلمين
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                حالة النظام
              </CardTitle>
              <CardDescription>إدارة حالة التشغيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>وضع الصيانة</Label>
                    {settings.maintenanceMode && (
                      <Badge variant="destructive">مفعّل</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    عند التفعيل سيتم منع المعلمين من الوصول للنظام
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">جميع الخدمات تعمل بشكل طبيعي</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
