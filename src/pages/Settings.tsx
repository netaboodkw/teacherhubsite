import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, School, Mail, Users, Loader2, Save } from 'lucide-react';

export default function Settings() {
  const { profile, isLoading, refetch } = useProfile();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    school_name: '',
    principal_name: '',
    department_head_name: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
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
          school_name: formData.school_name,
          principal_name: formData.principal_name,
          department_head_name: formData.department_head_name,
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
      </div>
    </TeacherLayout>
  );
}
