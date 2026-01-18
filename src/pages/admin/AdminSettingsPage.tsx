import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings, Shield, Database, Bell, Loader2, Save, CheckCircle, LayoutGrid, CreditCard, Key, Eye, EyeOff, ExternalLink, Image, Upload, X, FileText, Palette } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import defaultLogo from '@/assets/logo.png';

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

  // Logo settings
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Terms settings
  const [termsSettings, setTermsSettings] = useState({
    terms_enabled: false,
    terms_content: '',
  });

  // Theme settings
  const [appThemeStyle, setAppThemeStyle] = useState<'default' | 'liquid-glass'>('default');

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

      // Load logo setting
      const logoUrl = systemSettings.find(s => s.key === 'site_logo');
      if (logoUrl?.value) {
        setSiteLogo(logoUrl.value as string);
      }

      // Load terms settings
      const termsEnabled = systemSettings.find(s => s.key === 'terms_enabled');
      const termsContent = systemSettings.find(s => s.key === 'terms_content');
      setTermsSettings({
        terms_enabled: termsEnabled?.value === true || termsEnabled?.value === 'true',
        terms_content: (termsContent?.value as string) || '',
      });

      // Load theme setting
      const themeSetting = systemSettings.find(s => s.key === 'app_theme_style');
      if (themeSetting?.value === 'liquid-glass') {
        setAppThemeStyle('liquid-glass');
      } else {
        setAppThemeStyle('default');
      }
    }
  }, [systemSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `site-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setSiteLogo(publicUrl);
      toast.success('تم رفع الشعار بنجاح');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('فشل في رفع الشعار');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSiteLogo('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save logo setting
      await updateSystemSetting.mutateAsync({
        key: 'site_logo',
        value: siteLogo
      });

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

      // Save terms settings
      await updateSystemSetting.mutateAsync({
        key: 'terms_enabled',
        value: termsSettings.terms_enabled
      });
      await updateSystemSetting.mutateAsync({
        key: 'terms_content',
        value: termsSettings.terms_content
      });

      // Save theme setting
      await updateSystemSetting.mutateAsync({
        key: 'app_theme_style',
        value: appThemeStyle
      });

      // Apply theme immediately
      document.documentElement.classList.remove('theme-default', 'theme-liquid-glass');
      document.documentElement.classList.add(`theme-${appThemeStyle}`);

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
          {/* Logo Settings - NEW */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                شعار الموقع
              </CardTitle>
              <CardDescription>تخصيص شعار المنصة الذي يظهر في جميع الصفحات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
                    <img 
                      src={siteLogo || defaultLogo} 
                      alt="شعار الموقع" 
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                </div>
                
                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Label>رفع شعار جديد</Label>
                    <p className="text-sm text-muted-foreground">
                      يفضل أن تكون الصورة مربعة بحجم 512×512 بكسل على الأقل
                    </p>
                  </div>
                  
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                    >
                      {logoUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Upload className="h-4 w-4 ml-2" />
                      )}
                      {logoUploading ? 'جاري الرفع...' : 'اختيار صورة'}
                    </Button>
                    
                    {siteLogo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {siteLogo && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      تم تحميل شعار مخصص
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings - NEW */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                ثيم التطبيق
              </CardTitle>
              <CardDescription>اختيار المظهر العام للتطبيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={appThemeStyle}
                onValueChange={(value: 'default' | 'liquid-glass') => setAppThemeStyle(value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-start space-x-3 space-x-reverse">
                  <RadioGroupItem value="default" id="theme-default" className="mt-1" />
                  <Label htmlFor="theme-default" className="flex-1 cursor-pointer">
                    <div className="font-medium">الثيم الافتراضي</div>
                    <p className="text-sm text-muted-foreground">
                      تصميم كلاسيكي بألوان TeacherHub المميزة
                    </p>
                    <div className="mt-2 flex gap-1">
                      <div className="w-6 h-6 rounded-full bg-[hsl(195,85%,50%)]" />
                      <div className="w-6 h-6 rounded-full bg-[hsl(170,60%,45%)]" />
                      <div className="w-6 h-6 rounded-full bg-[hsl(320,50%,70%)]" />
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-start space-x-3 space-x-reverse">
                  <RadioGroupItem value="liquid-glass" id="theme-liquid-glass" className="mt-1" />
                  <Label htmlFor="theme-liquid-glass" className="flex-1 cursor-pointer">
                    <div className="font-medium flex items-center gap-2">
                      Liquid Glass
                      <Badge variant="secondary" className="text-xs">iOS 26</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تصميم زجاجي شفاف متوافق مع iOS 26
                    </p>
                    <div className="mt-2 flex gap-1">
                      <div className="w-6 h-6 rounded-full bg-[hsl(211,100%,50%)]" />
                      <div className="w-6 h-6 rounded-full bg-[hsl(174,72%,46%)]" />
                      <div className="w-6 h-6 rounded-full bg-[hsl(280,65%,60%)]" />
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {appThemeStyle === 'liquid-glass' && (
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-primary">
                    ✨ ثيم Liquid Glass يوفر تجربة بصرية متقدمة مع تأثيرات الزجاج الشفاف والعمق
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* Terms & Conditions Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                الشروط والأحكام
              </CardTitle>
              <CardDescription>تحديد شروط وأحكام التسجيل للمستخدمين الجدد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل الشروط والأحكام</Label>
                  <p className="text-sm text-muted-foreground">
                    إظهار شروط وأحكام يجب الموافقة عليها عند التسجيل
                  </p>
                </div>
                <Switch
                  checked={termsSettings.terms_enabled}
                  onCheckedChange={(checked) => setTermsSettings(prev => ({ ...prev, terms_enabled: checked }))}
                />
              </div>

              {termsSettings.terms_enabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="termsContent">نص الشروط والأحكام</Label>
                    <Textarea
                      id="termsContent"
                      placeholder="اكتب هنا شروط وأحكام التسجيل..."
                      value={termsSettings.terms_content}
                      onChange={(e) => setTermsSettings(prev => ({ ...prev, terms_content: e.target.value }))}
                      className="min-h-[200px]"
                      dir="rtl"
                    />
                    <p className="text-sm text-muted-foreground">
                      سيظهر هذا النص للمستخدمين عند التسجيل ويجب عليهم الموافقة عليه
                    </p>
                  </div>
                </>
              )}
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
