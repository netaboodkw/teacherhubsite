import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Edit, UserPlus, Phone, School, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeachers, Teacher } from '@/hooks/useTeachers';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_OTP = '12345';
const KUWAIT_PHONE_REGEX = /^[569]\d{7}$/;

export default function TeachersPage() {
  const { data: teachers, isLoading, refetch } = useTeachers();
  const { data: educationLevels } = useEducationLevels();
  
  // Edit teacher dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editEducationLevelId, setEditEducationLevelId] = useState('');
  const [saving, setSaving] = useState(false);

  // Add teacher dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    phone: '',
    full_name: '',
    school_name: '',
    education_level_id: '',
  });
  const [adding, setAdding] = useState(false);

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    // Find education level id from name
    const level = educationLevels?.find(l => l.name_ar === teacher.education_level_name);
    setEditEducationLevelId(level?.id || '');
    setEditDialogOpen(true);
  };

  const handleSaveEducationLevel = async () => {
    if (!editingTeacher || !editEducationLevelId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ education_level_id: editEducationLevelId })
        .eq('user_id', editingTeacher.user_id);

      if (error) throw error;

      toast.success('تم تحديث المرحلة التعليمية بنجاح');
      setEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error('فشل في التحديث: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    return KUWAIT_PHONE_REGEX.test(phone);
  };

  const handleAddTeacher = async () => {
    if (!validatePhone(newTeacher.phone)) {
      toast.error('يرجى إدخال رقم هاتف كويتي صحيح (8 أرقام يبدأ بـ 5 أو 6 أو 9)');
      return;
    }

    if (!newTeacher.full_name.trim() || !newTeacher.school_name.trim() || !newTeacher.education_level_id) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setAdding(true);
    try {
      const emailFromPhone = `${newTeacher.phone}@phone.teacherhub.app`;
      const passwordFromPhone = `phone_${newTeacher.phone}_secure_2024`;

      // Create user via Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailFromPhone,
        password: passwordFromPhone,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('رقم الهاتف مسجل مسبقاً');
          return;
        }
        throw signUpError;
      }

      if (signUpData.user) {
        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the profile with teacher data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: newTeacher.full_name.trim(),
            school_name: newTeacher.school_name.trim(),
            phone: newTeacher.phone,
            education_level_id: newTeacher.education_level_id,
            is_profile_complete: true,
          })
          .eq('user_id', signUpData.user.id);

        if (updateError) throw updateError;

        toast.success('تم تسجيل المعلم بنجاح');
        setAddDialogOpen(false);
        setNewTeacher({ phone: '', full_name: '', school_name: '', education_level_id: '' });
        refetch();
      }
    } catch (error: any) {
      toast.error('فشل في تسجيل المعلم: ' + error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">المعلمون</h1>
              <p className="text-muted-foreground">إدارة المعلمين المسجلين في النظام</p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة معلم
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              المعلمون المسجلون
              <Badge variant="secondary">{teachers?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teachers?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا يوجد معلمون مسجلون بعد
              </p>
            ) : (
              <div className="space-y-3">
                {teachers?.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={teacher.avatar_url || ''} />
                        <AvatarFallback>
                          {teacher.full_name?.charAt(0) || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{teacher.full_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {teacher.school_name && (
                            <Badge variant="outline" className="text-xs">
                              {teacher.school_name}
                            </Badge>
                          )}
                          {teacher.education_level_name && (
                            <Badge variant="secondary" className="text-xs">
                              {teacher.education_level_name}
                            </Badge>
                          )}
                          {teacher.subject_name && (
                            <Badge className="text-xs">
                              {teacher.subject_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          تاريخ التسجيل: {new Date(teacher.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!teacher.is_profile_complete && (
                        <Badge variant="destructive" className="text-xs">
                          غير مكتمل
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="تعديل المرحلة"
                        onClick={() => openEditDialog(teacher)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Teacher Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المرحلة التعليمية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={editingTeacher?.avatar_url || ''} />
                  <AvatarFallback>
                    {editingTeacher?.full_name?.charAt(0) || 'م'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{editingTeacher?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{editingTeacher?.school_name}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>المرحلة التعليمية</Label>
                <Select value={editEducationLevelId} onValueChange={setEditEducationLevelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels?.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveEducationLevel} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Teacher Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>تسجيل معلم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="9xxxxxxx"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher(prev => ({ 
                      ...prev, 
                      phone: e.target.value.replace(/\D/g, '').slice(0, 8) 
                    }))}
                    className="pr-10"
                    dir="ltr"
                    maxLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  رقم هاتف كويتي من 8 أرقام (يبدأ بـ 5 أو 6 أو 9)
                </p>
              </div>

              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  placeholder="أحمد محمد"
                  value={newTeacher.full_name}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>اسم المدرسة</Label>
                <div className="relative">
                  <School className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="مدرسة الأمل"
                    value={newTeacher.school_name}
                    onChange={(e) => setNewTeacher(prev => ({ ...prev, school_name: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>المرحلة التعليمية</Label>
                <Select 
                  value={newTeacher.education_level_id} 
                  onValueChange={(value) => setNewTeacher(prev => ({ ...prev, education_level_id: value }))}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="اختر المرحلة" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels?.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddTeacher} disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تسجيل المعلم'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
