import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useProfile } from '@/hooks/useProfile';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Input } from '@/components/ui/input';
import { GlassInput } from '@/components/ui/glass-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { User, School, Mail, Users, Loader2, Save, GraduationCap, Phone, BookOpen, CreditCard, Clock, AlertTriangle, CheckCircle2, XCircle, Sun, Moon, Monitor, Palette, Settings as SettingsIcon, Bell, Fingerprint, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { InviteDepartmentHead } from '@/components/teacher/InviteDepartmentHead';
import { getAttendanceDialogPref, setAttendanceDialogPref } from '@/components/fingerprint/AttendanceTimeDialog';

import { useMySubscription, useSubscriptionSettings, getSubscriptionStatus } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { profile, isLoading, refetch } = useProfile();
  const { data: educationLevels } = useEducationLevels();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { data: subscription, isLoading: subscriptionLoading } = useMySubscription();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  const subscriptionStatus = getSubscriptionStatus(subscription, subscriptionSettings);
  const { mode, setMode, isLiquidGlass } = useTheme();
  const { 
    isAvailable: biometricAvailable, 
    isEnabled: biometricEnabled, 
    deleteCredentials,
    getBiometryDisplayName,
    isNative 
  } = useBiometricAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    subject: '',
    school_name: '',
    principal_name: '',
    department_head_name: '',
  });
  
  // Welcome back dialog preference
  const [welcomeBackPref, setWelcomeBackPref] = useState<'always' | 'daily' | 'never'>(() => {
    const saved = localStorage.getItem('teacherhub_welcome_back_pref');
    return (saved as 'always' | 'daily' | 'never') || 'always';
  });
  
  const handleWelcomeBackPrefChange = (pref: 'always' | 'daily' | 'never') => {
    setWelcomeBackPref(pref);
    localStorage.setItem('teacherhub_welcome_back_pref', pref);
    toast.success('تم حفظ الإعداد');
  };

  // Attendance dialog preference (صباح الخير - متى حضرت)
  const [attendanceDialogPref, setAttendanceDialogPrefState] = useState<'daily' | 'never'>(() => {
    return getAttendanceDialogPref();
  });
  
  const handleAttendanceDialogPrefChange = (pref: 'daily' | 'never') => {
    setAttendanceDialogPrefState(pref);
    setAttendanceDialogPref(pref);
    toast.success('تم حفظ الإعداد');
  };

  // Aliases for components based on theme
  const ContentCard = isLiquidGlass ? GlassCard : Card;
  const ContentCardHeader = isLiquidGlass ? GlassCardHeader : CardHeader;
  const ContentCardTitle = isLiquidGlass ? GlassCardTitle : CardTitle;
  const ContentCardDescription = isLiquidGlass ? GlassCardDescription : CardDescription;
  const ContentCardContent = isLiquidGlass ? GlassCardContent : CardContent;
  const ActionButton = isLiquidGlass ? GlassButton : Button;
  const TextInput = isLiquidGlass ? GlassInput : Input;

  // Get education level name
  const educationLevelName = educationLevels?.find(l => l.id === profile?.education_level_id)?.name_ar;

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        subject: profile.subject || '',
        school_name: profile.school_name || '',
        principal_name: profile.principal_name || '',
        department_head_name: profile.department_head_name || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          subject: formData.subject || null,
          school_name: formData.school_name || null,
          principal_name: formData.principal_name || null,
          department_head_name: formData.department_head_name || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم حفظ الإعدادات بنجاح');
      refetch();
    } catch (error: any) {
      toast.error('فشل في حفظ الإعدادات: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          icon={SettingsIcon}
          title="الإعدادات"
          subtitle="إدارة معلوماتك الشخصية وبيانات المدرسة"
          iconVariant="teal"
        />

        {/* Subscription Status Card */}
        {subscriptionSettings?.enabled && (
          <Card className={subscriptionStatus.status === 'trial' ? 'border-amber-500/50 bg-amber-500/5' : 
                           subscriptionStatus.status === 'active' ? 'border-green-500/50 bg-green-500/5' :
                           subscriptionStatus.status === 'trial_expired' || subscriptionStatus.status === 'expired' ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                حالة الاشتراك
              </CardTitle>
              <CardDescription>
                معلومات اشتراكك الحالي في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Subscription Type Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نوع الاشتراك</span>
                    <Badge 
                      variant={subscriptionStatus.status === 'trial' || subscriptionStatus.status === 'pending_trial' ? 'secondary' : 
                               subscriptionStatus.status === 'active' ? 'default' :
                               subscriptionStatus.status === 'free' ? 'outline' : 'destructive'}
                      className={subscriptionStatus.status === 'trial' || subscriptionStatus.status === 'pending_trial' ? 'bg-amber-500/20 text-amber-700 border-amber-500/30' : 
                                 subscriptionStatus.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                    >
                      {(subscriptionStatus.status === 'trial' || subscriptionStatus.status === 'pending_trial') && (
                        <><Clock className="h-3 w-3 ml-1" /> فترة تجريبية</>
                      )}
                      {subscriptionStatus.status === 'active' && (
                        <><CheckCircle2 className="h-3 w-3 ml-1" /> مشترك</>
                      )}
                      {subscriptionStatus.status === 'free' && 'مجاني'}
                      {subscriptionStatus.status === 'trial_expired' && (
                        <><XCircle className="h-3 w-3 ml-1" /> انتهت الفترة التجريبية</>
                      )}
                      {subscriptionStatus.status === 'expired' && (
                        <><XCircle className="h-3 w-3 ml-1" /> منتهي</>
                      )}
                      {subscriptionStatus.status === 'none' && 'غير مشترك'}
                    </Badge>
                  </div>

                  {/* Trial/Subscription End Date */}
                  {subscription?.trial_ends_at && subscriptionStatus.status === 'trial' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ستنتهي الفترة التجريبية في
                        </span>
                        <span className="font-medium">
                          {format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: ar })}
                        </span>
                      </div>
                      {subscriptionStatus.daysRemaining !== null && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>الأيام المتبقية</span>
                            <span className={subscriptionStatus.daysRemaining <= 3 ? 'text-destructive font-medium' : ''}>
                              {subscriptionStatus.daysRemaining} يوم
                            </span>
                          </div>
                          <Progress 
                            value={Math.max(0, (subscriptionStatus.daysRemaining / (subscriptionSettings?.trial_days || 10)) * 100)} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Trial - User hasn't been assigned trial record yet */}
                  {subscriptionStatus.status === 'pending_trial' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4 text-amber-500" />
                          ستنتهي الفترة التجريبية في
                        </span>
                        <span className="font-medium">
                          {format(new Date((subscriptionStatus as any).trialEndDate || Date.now() + (subscriptionSettings?.trial_days || 10) * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: ar })}
                        </span>
                      </div>
                      {subscriptionStatus.daysRemaining !== null && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>الأيام المتبقية</span>
                            <span>{subscriptionStatus.daysRemaining} يوم</span>
                          </div>
                          <Progress 
                            value={100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {subscription?.subscription_ends_at && (subscriptionStatus.status === 'active' || subscriptionStatus.status === 'expired') && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {subscriptionStatus.status === 'expired' ? 'انتهى الاشتراك في' : 'ينتهي الاشتراك'}
                      </span>
                      <span className={cn("font-medium", subscriptionStatus.status === 'expired' && "text-destructive")}>
                        {format(new Date(subscription.subscription_ends_at), 'dd MMMM yyyy', { locale: ar })}
                      </span>
                    </div>
                  )}

                  {/* Show trial end date for expired trial */}
                  {subscription?.trial_ends_at && subscriptionStatus.status === 'trial_expired' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">انتهت الفترة التجريبية في</span>
                      <span className="font-medium text-destructive">
                        {format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: ar })}
                      </span>
                    </div>
                  )}

                  {/* Warning for expiring soon */}
                  {subscriptionStatus.status === 'trial' && subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining <= 3 && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        ستنتهي الفترة التجريبية قريباً! اشترك الآن للاستمرار في استخدام جميع المميزات.
                      </p>
                    </div>
                  )}

                  {/* Expired status */}
                  {(subscriptionStatus.status === 'trial_expired' || subscriptionStatus.status === 'expired') && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        {subscriptionStatus.isReadOnly 
                          ? 'انتهى اشتراكك. يمكنك عرض البيانات فقط بدون تعديل.'
                          : 'انتهى اشتراكك. يرجى الاشتراك للاستمرار.'}
                      </p>
                    </div>
                  )}

                  {/* Subscribe/Manage Button */}
                  <Separator />
                  <div className="flex justify-end">
                    <Button asChild variant={subscriptionStatus.status === 'active' ? 'outline' : 'default'}>
                      <Link to="/teacher/subscription">
                        <CreditCard className="h-4 w-4 ml-2" />
                        {subscriptionStatus.status === 'active' ? 'إدارة الاشتراك' : 'اشترك الآن'}
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                المعلومات الشخصية
              </CardTitle>
              <CardDescription>
                معلوماتك الأساسية التي تظهر في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pr-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  لا يمكن تغيير البريد الإلكتروني
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0512345678"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">المادة</Label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="الرياضيات، اللغة العربية..."
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Education Level - Read Only */}
              <div className="space-y-2">
                <Label>المرحلة التعليمية</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{educationLevelName || 'غير محدد'}</span>
                  <Badge variant="secondary" className="mr-auto">ثابت</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  المرحلة التعليمية محددة عند التسجيل ولا يمكن تغييرها. تواصل مع المشرف لتعديلها.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                بيانات المدرسة
              </CardTitle>
              <CardDescription>
                معلومات المدرسة التي تعمل بها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school_name">اسم المدرسة</Label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder="أدخل اسم المدرسة"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="principal_name">اسم مدير/ة المدرسة</Label>
                <div className="relative">
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="principal_name"
                    value={formData.principal_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, principal_name: e.target.value }))}
                    placeholder="أدخل اسم مدير/ة المدرسة"
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_head_name">اسم رئيس/ة القسم</Label>
                <div className="relative">
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department_head_name"
                    value={formData.department_head_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_head_name: e.target.value }))}
                    placeholder="أدخل اسم رئيس/ة القسم"
                    className="pr-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <ContentCard>
            <ContentCardHeader>
              <ContentCardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                المظهر
              </ContentCardTitle>
              <ContentCardDescription>
                اختر وضع العرض المفضل لديك
              </ContentCardDescription>
            </ContentCardHeader>
            <ContentCardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Light Mode */}
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    mode === 'light'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    mode === 'light' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Sun className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    mode === 'light' ? "text-primary" : "text-muted-foreground"
                  )}>فاتح</span>
                </button>

                {/* Dark Mode */}
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    mode === 'dark'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    mode === 'dark' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Moon className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    mode === 'dark' ? "text-primary" : "text-muted-foreground"
                  )}>داكن</span>
                </button>

                {/* System/Auto Mode */}
                <button
                  type="button"
                  onClick={() => setMode('system')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    mode === 'system'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    mode === 'system' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Monitor className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    mode === 'system' ? "text-primary" : "text-muted-foreground"
                  )}>تلقائي</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                الوضع التلقائي يتبع إعدادات جهازك
              </p>
            </ContentCardContent>
          </ContentCard>

          {/* Biometric Login Settings - Only show on native platforms */}
          {isNative && biometricAvailable && (
            <ContentCard>
              <ContentCardHeader>
                <ContentCardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  تسجيل الدخول بـ {getBiometryDisplayName()}
                </ContentCardTitle>
                <ContentCardDescription>
                  استخدم {getBiometryDisplayName()} لتسجيل الدخول السريع
                </ContentCardDescription>
              </ContentCardHeader>
              <ContentCardContent className="space-y-4">
                {biometricEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium text-green-700 dark:text-green-400">
                          {getBiometryDisplayName()} مُفعّل
                        </p>
                        <p className="text-sm text-muted-foreground">
                          يمكنك تسجيل الدخول باستخدام {getBiometryDisplayName()}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        const deleted = await deleteCredentials();
                        if (deleted) {
                          toast.success(`تم إلغاء تفعيل ${getBiometryDisplayName()}`);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      إلغاء تفعيل {getBiometryDisplayName()}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl">
                    <Fingerprint className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">غير مُفعّل</p>
                      <p className="text-sm text-muted-foreground">
                        سجّل دخولك مرة أخرى لتفعيل {getBiometryDisplayName()}
                      </p>
                    </div>
                  </div>
                )}
              </ContentCardContent>
            </ContentCard>
          )}

          {/* Welcome Back Dialog Settings */}
          <ContentCard>
            <ContentCardHeader>
              <ContentCardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                نافذة الترحيب عند العودة
              </ContentCardTitle>
              <ContentCardDescription>
                تحكم في ظهور نافذة "مرحباً بعودتك" عند فتح التطبيق
              </ContentCardDescription>
            </ContentCardHeader>
            <ContentCardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Always Show */}
                <button
                  type="button"
                  onClick={() => handleWelcomeBackPrefChange('always')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    welcomeBackPref === 'always'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    welcomeBackPref === 'always' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    welcomeBackPref === 'always' ? "text-primary" : "text-muted-foreground"
                  )}>دائماً</span>
                </button>

                {/* Daily */}
                <button
                  type="button"
                  onClick={() => handleWelcomeBackPrefChange('daily')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    welcomeBackPref === 'daily'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    welcomeBackPref === 'daily' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Clock className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    welcomeBackPref === 'daily' ? "text-primary" : "text-muted-foreground"
                  )}>مرة يومياً</span>
                </button>

                {/* Never */}
                <button
                  type="button"
                  onClick={() => handleWelcomeBackPrefChange('never')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    welcomeBackPref === 'never'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    welcomeBackPref === 'never' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <XCircle className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    welcomeBackPref === 'never' ? "text-primary" : "text-muted-foreground"
                  )}>لا تظهر</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                تظهر النافذة عند فتح التطبيق لتسهيل الدخول السريع
              </p>
            </ContentCardContent>
          </ContentCard>

          {/* Attendance Time Dialog Settings (صباح الخير - متى حضرت) */}
          <ContentCard>
            <ContentCardHeader>
              <ContentCardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                نافذة وقت الحضور اليومية
              </ContentCardTitle>
              <ContentCardDescription>
                تحكم في ظهور نافذة "صباح الخير - متى حضرت" عند فتح التطبيق
              </ContentCardDescription>
            </ContentCardHeader>
            <ContentCardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Daily */}
                <button
                  type="button"
                  onClick={() => handleAttendanceDialogPrefChange('daily')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    attendanceDialogPref === 'daily'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    attendanceDialogPref === 'daily' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Clock className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    attendanceDialogPref === 'daily' ? "text-primary" : "text-muted-foreground"
                  )}>تظهر يومياً</span>
                </button>

                {/* Never */}
                <button
                  type="button"
                  onClick={() => handleAttendanceDialogPrefChange('never')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    attendanceDialogPref === 'never'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    attendanceDialogPref === 'never' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <XCircle className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    attendanceDialogPref === 'never' ? "text-primary" : "text-muted-foreground"
                  )}>لا تظهر</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                تساعدك هذه النافذة على تعيين وقت الحضور لتفعيل تذكير بصمة التواجد
              </p>
            </ContentCardContent>
          </ContentCard>

          <div className="flex justify-end">
            <ActionButton type="submit" disabled={saving} className="min-w-32">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </ActionButton>
          </div>
        </form>

        {/* Department Head Invitation Section */}
        <InviteDepartmentHead />
      </div>
    </TeacherLayout>
  );
}
