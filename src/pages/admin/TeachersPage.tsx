import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Edit, UserPlus, Phone, School, GraduationCap, Mail, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeachers, Teacher } from '@/hooks/useTeachers';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_OTP = '12345';
const KUWAIT_PHONE_REGEX = /^[569]\d{7}$/;

export default function TeachersPage() {
  const { data: teachers, isLoading, refetch } = useTeachers();
  const { data: educationLevels } = useEducationLevels();
  const { data: subjects } = useSubjects();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit teacher dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    school_name: '',
    education_level_id: '',
    subject_id: '',
    department_head_name: '',
    principal_name: '',
  });
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

  // Filter teachers
  const filteredTeachers = teachers?.filter(teacher => 
    teacher.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone?.includes(searchTerm)
  );

  const openEditDialog = async (teacher: Teacher) => {
    setEditingTeacher(teacher);
    
    // Fetch full profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', teacher.user_id)
      .single();
    
    const level = educationLevels?.find(l => l.name_ar === teacher.education_level_name);
    const subject = subjects?.find(s => s.name_ar === teacher.subject_name);
    
    setEditForm({
      full_name: teacher.full_name || '',
      phone: teacher.phone || '',
      school_name: teacher.school_name || '',
      education_level_id: level?.id || profile?.education_level_id || '',
      subject_id: subject?.id || profile?.subject_id || '',
      department_head_name: profile?.department_head_name || '',
      principal_name: profile?.principal_name || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveTeacher = async () => {
    if (!editingTeacher) return;
    
    if (!editForm.full_name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    
    setSaving(true);
    try {
      const updateData: any = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone || null,
        school_name: editForm.school_name || null,
        education_level_id: editForm.education_level_id || null,
        subject_id: editForm.subject_id || null,
        department_head_name: editForm.department_head_name || null,
        principal_name: editForm.principal_name || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', editingTeacher.user_id);

      if (error) throw error;

      toast.success('تم تحديث بيانات المعلم بنجاح');
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
        await new Promise(resolve => setTimeout(resolve, 1000));

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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن معلم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              المعلمون المسجلون
              <Badge variant="secondary">{filteredTeachers?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredTeachers?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد معلمون مسجلون بعد'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTeachers?.map((teacher) => (
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
                          {teacher.phone && (
                            <Badge variant="outline" className="text-xs font-mono">
                              <Phone className="h-3 w-3 ml-1" />
                              {teacher.phone}
                            </Badge>
                          )}
                          {teacher.school_name && (
                            <Badge variant="outline" className="text-xs">
                              <School className="h-3 w-3 ml-1" />
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
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(teacher)}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Teacher Dialog - Full Form */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                تعديل بيانات المعلم
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={editingTeacher?.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {editingTeacher?.full_name?.charAt(0) || 'م'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{editingTeacher?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    تاريخ التسجيل: {editingTeacher?.created_at && new Date(editingTeacher.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  الاسم الكامل
                </Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="أدخل اسم المعلم"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                  placeholder="9xxxxxxx"
                  dir="ltr"
                  maxLength={8}
                />
              </div>

              {/* School */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  اسم المدرسة
                </Label>
                <Input
                  value={editForm.school_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder="أدخل اسم المدرسة"
                />
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  المرحلة التعليمية
                </Label>
                <Select 
                  value={editForm.education_level_id} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, education_level_id: value }))}
                >
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

              {/* Subject */}
              <div className="space-y-2">
                <Label>المادة الدراسية</Label>
                <Select 
                  value={editForm.subject_id} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, subject_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.filter(s => !editForm.education_level_id || s.education_level_id === editForm.education_level_id)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name_ar}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Head */}
              <div className="space-y-2">
                <Label>رئيس القسم</Label>
                <Input
                  value={editForm.department_head_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, department_head_name: e.target.value }))}
                  placeholder="اسم رئيس القسم"
                />
              </div>

              {/* Principal */}
              <div className="space-y-2">
                <Label>مدير المدرسة</Label>
                <Input
                  value={editForm.principal_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, principal_name: e.target.value }))}
                  placeholder="اسم مدير المدرسة"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveTeacher} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التغييرات'}
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
