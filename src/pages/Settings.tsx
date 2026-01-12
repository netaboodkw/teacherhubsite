import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useProfile } from '@/hooks/useProfile';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, School, Mail, Users, Loader2, Save, GraduationCap, Phone, BookOpen, Volume2, Vibrate } from 'lucide-react';
import { InviteDepartmentHead } from '@/components/teacher/InviteDepartmentHead';
import { getHapticEnabled, setHapticEnabled } from '@/hooks/useHapticFeedback';

export default function Settings() {
  const { profile, isLoading, refetch } = useProfile();
  const { data: educationLevels } = useEducationLevels();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [hapticEnabled, setHapticEnabledState] = useState(getHapticEnabled());
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    subject: '',
    school_name: '',
    principal_name: '',
    department_head_name: '',
  });

  // Toggle haptic feedback
  const handleHapticToggle = (enabled: boolean) => {
    setHapticEnabled(enabled);
    setHapticEnabledState(enabled);
    toast.success(enabled ? 'تم تفعيل الاهتزاز والصوت' : 'تم إيقاف الاهتزاز والصوت');
  };

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
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة معلوماتك الشخصية وبيانات المدرسة</p>
        </div>

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

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                إعدادات التطبيق
              </CardTitle>
              <CardDescription>
                تخصيص سلوك التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Vibrate className="h-4 w-4 text-muted-foreground" />
                    <Label>الاهتزاز والصوت عند إدخال الدرجات</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    تشغيل اهتزاز وصوت عند حفظ الدرجة بنجاح
                  </p>
                </div>
                <Switch
                  checked={hapticEnabled}
                  onCheckedChange={handleHapticToggle}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-32">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Department Head Invitation Section */}
        <InviteDepartmentHead />
      </div>
    </TeacherLayout>
  );
}
