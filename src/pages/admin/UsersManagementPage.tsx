import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, Users, Edit, Phone, School, GraduationCap, Mail, User, Search, 
  Eye, Building2, Shield, BookOpen, Calendar, FileText, CheckCircle, XCircle,
  Trash2, AlertTriangle, CreditCard, Crown, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeachers, Teacher, useDeleteTeacher } from '@/hooks/useTeachers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { format, addDays } from 'date-fns';

// Hook to get all department heads
function useAllDepartmentHeads() {
  return useQuery({
    queryKey: ['all_department_heads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_heads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook to get all admins
function useAllAdmins() {
  return useQuery({
    queryKey: ['all_admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook to get teacher's full data including classrooms and templates
function useTeacherFullData(userId: string | null) {
  return useQuery({
    queryKey: ['teacher_full_data', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get classrooms
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get templates
      const { data: templates } = await supabase
        .from('teacher_grading_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get subscription
      const { data: subscription } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get students count
      const classroomIds = classrooms?.map(c => c.id) || [];
      let studentsCount = 0;
      if (classroomIds.length > 0) {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .in('classroom_id', classroomIds);
        studentsCount = count || 0;
      }

      // Get grades count
      let gradesCount = 0;
      if (classroomIds.length > 0) {
        const { count } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .in('classroom_id', classroomIds);
        gradesCount = count || 0;
      }

      return {
        profile,
        classrooms: classrooms || [],
        templates: templates || [],
        subscription,
        studentsCount,
        gradesCount,
      };
    },
    enabled: !!userId,
  });
}

// Hook to get teacher's subscription
function useTeacherSubscription(userId: string | null) {
  return useQuery({
    queryKey: ['teacher_subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const { data: teachers, isLoading: teachersLoading, refetch: refetchTeachers } = useTeachers();
  const { data: departmentHeads, isLoading: dhLoading } = useAllDepartmentHeads();
  const { data: admins, isLoading: adminsLoading } = useAllAdmins();
  const { data: educationLevels } = useEducationLevels();
  const { data: subjects } = useSubjects();
  const deleteTeacher = useDeleteTeacher();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('teachers');
  
  // View teacher dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const { data: teacherFullData, isLoading: fullDataLoading, refetch: refetchFullData } = useTeacherFullData(selectedTeacherId);
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    school_name: '',
    education_level_id: '',
    subject_id: '',
    department_head_name: '',
    principal_name: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Subscription management dialog
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [subscriptionTeacher, setSubscriptionTeacher] = useState<Teacher | null>(null);
  const { data: subscriptionData, isLoading: subscriptionLoading } = useTeacherSubscription(subscriptionTeacher?.user_id || null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    status: 'trial',
    trial_days: 100,
    subscription_days: 365,
    is_read_only: false,
    courses_remaining: 1,
  });
  const [savingSubscription, setSavingSubscription] = useState(false);

  // Filter functions
  const filteredTeachers = teachers?.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepartmentHeads = departmentHeads?.filter(dh => 
    dh.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dh.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dh.phone?.includes(searchTerm)
  );

  const filteredAdmins = admins?.filter(a => 
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // View teacher
  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacherId(teacher.user_id);
    setViewDialogOpen(true);
  };

  // Edit teacher
  const openEditDialog = async (teacher: Teacher) => {
    setEditingTeacher(teacher);
    
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
      email: teacher.email || profile?.email || '',
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone || null,
          email: editForm.email || null,
          school_name: editForm.school_name || null,
          education_level_id: editForm.education_level_id || null,
          subject_id: editForm.subject_id || null,
          department_head_name: editForm.department_head_name || null,
          principal_name: editForm.principal_name || null,
        })
        .eq('user_id', editingTeacher.user_id);

      if (error) throw error;

      toast.success('تم تحديث بيانات المعلم بنجاح');
      setEditDialogOpen(false);
      refetchTeachers();
    } catch (error: any) {
      toast.error('فشل في التحديث: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteDialog = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    
    try {
      await deleteTeacher.mutateAsync(teacherToDelete.user_id);
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const getEducationLevelName = (id: string | null) => {
    if (!id) return '-';
    return educationLevels?.find(l => l.id === id)?.name_ar || '-';
  };

  const getSubjectName = (id: string | null) => {
    if (!id) return '-';
    return subjects?.find(s => s.id === id)?.name_ar || '-';
  };

  // Open subscription management dialog
  const openSubscriptionDialog = (teacher: Teacher) => {
    setSubscriptionTeacher(teacher);
    setSubscriptionDialogOpen(true);
  };

  // Save subscription
  const handleSaveSubscription = async () => {
    if (!subscriptionTeacher) return;
    
    setSavingSubscription(true);
    try {
      const now = new Date();
      let updateData: any = {
        status: subscriptionForm.status,
        is_read_only: subscriptionForm.is_read_only,
        courses_remaining: subscriptionForm.courses_remaining,
      };

      if (subscriptionForm.status === 'trial') {
        updateData.trial_started_at = now.toISOString();
        updateData.trial_ends_at = addDays(now, subscriptionForm.trial_days).toISOString();
        updateData.subscription_started_at = null;
        updateData.subscription_ends_at = null;
      } else if (subscriptionForm.status === 'active') {
        updateData.subscription_started_at = now.toISOString();
        updateData.subscription_ends_at = addDays(now, subscriptionForm.subscription_days).toISOString();
      }

      // Check if subscription exists
      const { data: existing } = await supabase
        .from('teacher_subscriptions')
        .select('id')
        .eq('user_id', subscriptionTeacher.user_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('teacher_subscriptions')
          .update(updateData)
          .eq('user_id', subscriptionTeacher.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teacher_subscriptions')
          .insert({
            user_id: subscriptionTeacher.user_id,
            ...updateData,
          });
        if (error) throw error;
      }

      toast.success('تم تحديث الاشتراك بنجاح');
      setSubscriptionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['teacher_subscription'] });
      queryClient.invalidateQueries({ queryKey: ['teacher_full_data'] });
    } catch (error: any) {
      toast.error('فشل في تحديث الاشتراك: ' + error.message);
    } finally {
      setSavingSubscription(false);
    }
  };

  // Get subscription status badge
  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription) {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 ml-1" />
          بدون اشتراك
        </Badge>
      );
    }
    
    if (subscription.is_read_only) {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 ml-1" />
          قراءة فقط
        </Badge>
      );
    }
    
    switch (subscription.status) {
      case 'active':
        return (
          <Badge variant="default" className="text-xs bg-emerald-600">
            <Crown className="h-3 w-3 ml-1" />
            مشترك
          </Badge>
        );
      case 'trial':
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 ml-1" />
            تجريبي
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 ml-1" />
            منتهي
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{subscription.status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين المسجلين</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المعلمون</p>
                  <p className="text-3xl font-bold text-blue-600">{teachers?.length || 0}</p>
                </div>
                <GraduationCap className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">رؤساء الأقسام</p>
                  <p className="text-3xl font-bold text-green-600">{departmentHeads?.length || 0}</p>
                </div>
                <Building2 className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المشرفون</p>
                  <p className="text-3xl font-bold text-purple-600">{admins?.length || 0}</p>
                </div>
                <Shield className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="teachers" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              المعلمون
            </TabsTrigger>
            <TabsTrigger value="department_heads" className="gap-2">
              <Building2 className="h-4 w-4" />
              رؤساء الأقسام
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Shield className="h-4 w-4" />
              المشرفون
            </TabsTrigger>
          </TabsList>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  المعلمون المسجلون
                  <Badge variant="secondary">{filteredTeachers?.length || 0}</Badge>
                </CardTitle>
                <CardDescription>قائمة المعلمين مع إمكانية عرض التفاصيل والتعديل</CardDescription>
              </CardHeader>
              <CardContent>
                {teachersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredTeachers?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'لا توجد نتائج' : 'لا يوجد معلمون مسجلون'}
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
                            <AvatarFallback>{teacher.full_name?.charAt(0) || 'م'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{teacher.full_name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {teacher.email && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 ml-1" />
                                  {teacher.email}
                                </Badge>
                              )}
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
                                <Badge className="text-xs">{teacher.subject_name}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              تاريخ التسجيل: {new Date(teacher.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {teacher.is_profile_complete ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              مكتمل
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="h-3 w-3 ml-1" />
                              غير مكتمل
                            </Badge>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewTeacher(teacher)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => openEditDialog(teacher)}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            تعديل
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openSubscriptionDialog(teacher)}
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            <CreditCard className="h-4 w-4 ml-1" />
                            الاشتراك
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openDeleteDialog(teacher)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Heads Tab */}
          <TabsContent value="department_heads">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  رؤساء الأقسام
                  <Badge variant="secondary">{filteredDepartmentHeads?.length || 0}</Badge>
                </CardTitle>
                <CardDescription>قائمة رؤساء الأقسام المسجلين</CardDescription>
              </CardHeader>
              <CardContent>
                {dhLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredDepartmentHeads?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'لا توجد نتائج' : 'لا يوجد رؤساء أقسام مسجلون'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredDepartmentHeads?.map((dh) => (
                      <div
                        key={dh.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={dh.avatar_url || ''} />
                            <AvatarFallback>{dh.full_name?.charAt(0) || 'ر'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{dh.full_name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {dh.email && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 ml-1" />
                                  {dh.email}
                                </Badge>
                              )}
                              {dh.phone && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  <Phone className="h-3 w-3 ml-1" />
                                  {dh.phone}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              تاريخ التسجيل: {new Date(dh.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  المشرفون
                  <Badge variant="secondary">{filteredAdmins?.length || 0}</Badge>
                </CardTitle>
                <CardDescription>قائمة المشرفين على النظام</CardDescription>
              </CardHeader>
              <CardContent>
                {adminsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredAdmins?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'لا توجد نتائج' : 'لا يوجد مشرفون مسجلون'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredAdmins?.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={admin.avatar_url || ''} />
                            <AvatarFallback>{admin.full_name?.charAt(0) || 'أ'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium flex items-center gap-2">
                              {admin.full_name}
                              <Badge variant="default" className="text-xs">مشرف</Badge>
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {admin.email && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 ml-1" />
                                  {admin.email}
                                </Badge>
                              )}
                              {admin.phone && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  <Phone className="h-3 w-3 ml-1" />
                                  {admin.phone}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              تاريخ التسجيل: {new Date(admin.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Teacher Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                عرض بيانات المعلم
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh]">
              {fullDataLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : teacherFullData ? (
                <div className="space-y-6 p-1">
                  {/* Profile Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        المعلومات الشخصية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={teacherFullData.profile?.avatar_url || ''} />
                          <AvatarFallback className="text-xl">
                            {teacherFullData.profile?.full_name?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{teacherFullData.profile?.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {teacherFullData.profile?.is_profile_complete ? 'الملف الشخصي مكتمل' : 'الملف الشخصي غير مكتمل'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">رقم الهاتف:</span>
                          <p className="font-medium font-mono">{teacherFullData.profile?.phone || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المدرسة:</span>
                          <p className="font-medium">{teacherFullData.profile?.school_name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المرحلة:</span>
                          <p className="font-medium">{getEducationLevelName(teacherFullData.profile?.education_level_id)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المادة:</span>
                          <p className="font-medium">{getSubjectName(teacherFullData.profile?.subject_id)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">رئيس القسم:</span>
                          <p className="font-medium">{teacherFullData.profile?.department_head_name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">مدير المدرسة:</span>
                          <p className="font-medium">{teacherFullData.profile?.principal_name || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                        <p className="text-2xl font-bold">{teacherFullData.classrooms.length}</p>
                        <p className="text-xs text-muted-foreground">الصفوف</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <Users className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <p className="text-2xl font-bold">{teacherFullData.studentsCount}</p>
                        <p className="text-xs text-muted-foreground">الطلاب</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <FileText className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                        <p className="text-2xl font-bold">{teacherFullData.templates.length}</p>
                        <p className="text-xs text-muted-foreground">القوالب</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <GraduationCap className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                        <p className="text-2xl font-bold">{teacherFullData.gradesCount}</p>
                        <p className="text-xs text-muted-foreground">الدرجات</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Classrooms */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        الصفوف الدراسية
                        <Badge variant="secondary">{teacherFullData.classrooms.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {teacherFullData.classrooms.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا توجد صفوف</p>
                      ) : (
                        <div className="space-y-2">
                          {teacherFullData.classrooms.map((classroom) => (
                            <div key={classroom.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: classroom.color }}
                                />
                                <div>
                                  <p className="font-medium">{classroom.name}</p>
                                  <p className="text-xs text-muted-foreground">{classroom.subject}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {classroom.is_archived ? (
                                  <Badge variant="outline">مؤرشف</Badge>
                                ) : (
                                  <Badge variant="secondary">نشط</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Templates */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        قوالب الدرجات
                        <Badge variant="secondary">{teacherFullData.templates.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {teacherFullData.templates.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">لا توجد قوالب</p>
                      ) : (
                        <div className="space-y-2">
                          {teacherFullData.templates.map((template) => (
                            <div key={template.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div>
                                <p className="font-medium">{template.name_ar}</p>
                                {template.description && (
                                  <p className="text-xs text-muted-foreground">{template.description}</p>
                                )}
                              </div>
                              <Badge variant={template.is_active ? 'secondary' : 'outline'}>
                                {template.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Teacher Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                تعديل بيانات المعلم
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4 px-1">
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                    type="email"
                    dir="ltr"
                  />
                </div>

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

                <div className="space-y-2">
                  <Label>رئيس القسم</Label>
                  <Input
                    value={editForm.department_head_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, department_head_name: e.target.value }))}
                    placeholder="اسم رئيس القسم"
                  />
                </div>

                <div className="space-y-2">
                  <Label>مدير المدرسة</Label>
                  <Input
                    value={editForm.principal_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, principal_name: e.target.value }))}
                    placeholder="اسم مدير المدرسة"
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveTeacher} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                تأكيد حذف المعلم
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  هل أنت متأكد من حذف المعلم <strong>{teacherToDelete?.full_name}</strong>؟
                </p>
                <p className="text-destructive font-medium">
                  سيتم حذف جميع البيانات المرتبطة بهذا المعلم بشكل نهائي:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>الملف الشخصي</li>
                  <li>جميع الفصول الدراسية</li>
                  <li>جميع الطلاب وبياناتهم</li>
                  <li>جميع الدرجات والتقييمات</li>
                  <li>سجلات الحضور والغياب</li>
                  <li>الملاحظات السلوكية</li>
                  <li>قوالب التقييم</li>
                </ul>
                <p className="text-destructive text-sm font-bold">
                  هذا الإجراء لا يمكن التراجع عنه!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteTeacher}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteTeacher.isPending}
              >
                {deleteTeacher.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Trash2 className="h-4 w-4 ml-2" />
                )}
                حذف نهائي
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Subscription Management Dialog */}
        <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                إدارة اشتراك المعلم
              </DialogTitle>
            </DialogHeader>
            
            {subscriptionLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{subscriptionTeacher?.full_name}</h4>
                  {subscriptionData ? (
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>الحالة الحالية: {getSubscriptionBadge(subscriptionData)}</p>
                      {subscriptionData.status === 'trial' && subscriptionData.trial_ends_at && (
                        <p>تنتهي الفترة التجريبية: {format(new Date(subscriptionData.trial_ends_at), 'dd/MM/yyyy')}</p>
                      )}
                      {subscriptionData.status === 'active' && subscriptionData.subscription_ends_at && (
                        <p>ينتهي الاشتراك: {format(new Date(subscriptionData.subscription_ends_at), 'dd/MM/yyyy')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">لا يوجد اشتراك حالي</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>نوع الاشتراك</Label>
                    <Select 
                      value={subscriptionForm.status}
                      onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            فترة تجريبية مجانية
                          </span>
                        </SelectItem>
                        <SelectItem value="active">
                          <span className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            اشتراك مدفوع
                          </span>
                        </SelectItem>
                        <SelectItem value="expired">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            منتهي
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {subscriptionForm.status === 'trial' && (
                    <div className="space-y-2">
                      <Label>عدد أيام الفترة التجريبية</Label>
                      <Input
                        type="number"
                        value={subscriptionForm.trial_days}
                        onChange={(e) => setSubscriptionForm(prev => ({ 
                          ...prev, 
                          trial_days: parseInt(e.target.value) || 0 
                        }))}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        سيتم احتساب الفترة من اليوم
                      </p>
                    </div>
                  )}

                  {subscriptionForm.status === 'active' && (
                    <div className="space-y-2">
                      <Label>عدد أيام الاشتراك</Label>
                      <Input
                        type="number"
                        value={subscriptionForm.subscription_days}
                        onChange={(e) => setSubscriptionForm(prev => ({ 
                          ...prev, 
                          subscription_days: parseInt(e.target.value) || 0 
                        }))}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        سيتم احتساب الفترة من اليوم
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>الكورسات المتبقية</Label>
                    <Input
                      type="number"
                      value={subscriptionForm.courses_remaining}
                      onChange={(e) => setSubscriptionForm(prev => ({ 
                        ...prev, 
                        courses_remaining: parseInt(e.target.value) || 0 
                      }))}
                      min={0}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <Label className="text-destructive">وضع القراءة فقط</Label>
                      <p className="text-xs text-muted-foreground">
                        عند التفعيل، لن يتمكن المعلم من إضافة أو تعديل البيانات
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={subscriptionForm.is_read_only}
                      onChange={(e) => setSubscriptionForm(prev => ({ 
                        ...prev, 
                        is_read_only: e.target.checked 
                      }))}
                      className="h-5 w-5"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSubscriptionDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveSubscription} disabled={savingSubscription}>
                {savingSubscription && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
