import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { notifySupervisingDepartmentHeads } from './useSupervisionNotifications';

export interface ClassSchedule {
  [day: string]: number[];
}

export interface EducationLevel {
  id: string;
  name: string;
  name_ar: string;
}

export interface Classroom {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  schedule: string | null;
  color: string;
  class_schedule: ClassSchedule | null;
  education_level_id: string | null;
  education_level?: EducationLevel | null;
  subject_id: string | null;
  grade_level: number | null;
  grade_level_id: string | null;
  teacher_template_id: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Display settings
  show_badges: boolean;
  show_leaderboard: boolean;
  show_stats_banner: boolean;
}

export function useClassrooms() {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          education_level:education_levels(id, name, name_ar)
        `)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Classroom[];
    },
  });
}

// Hook to check which templates are in use by active (non-archived) classrooms
export function useTemplatesInUse() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['templates-in-use', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('teacher_template_id, name')
        .eq('user_id', user.id)
        .eq('is_archived', false) // استثناء الصفوف المؤرشفة
        .not('teacher_template_id', 'is', null);
      
      if (error) throw error;
      
      // Create a map of template_id -> classroom names using it
      const templateUsage: Record<string, string[]> = {};
      (data || []).forEach(classroom => {
        if (classroom.teacher_template_id) {
          if (!templateUsage[classroom.teacher_template_id]) {
            templateUsage[classroom.teacher_template_id] = [];
          }
          templateUsage[classroom.teacher_template_id].push(classroom.name);
        }
      });
      
      return templateUsage;
    },
    enabled: !!user?.id,
  });
}

export function useClassroom(id: string) {
  return useQuery({
    queryKey: ['classrooms', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Classroom | null;
    },
    enabled: !!id,
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classroom: { 
      name: string; 
      subject: string; 
      schedule?: string; 
      color: string;
      class_schedule?: ClassSchedule;
      education_level_id?: string | null;
      subject_id?: string | null;
      grade_level_id?: string | null;
      teacher_template_id?: string | null;
      show_badges?: boolean;
      show_leaderboard?: boolean;
      show_stats_banner?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data, error } = await supabase
        .from('classrooms')
        .insert({
          user_id: user.id,
          name: classroom.name,
          subject: classroom.subject,
          schedule: classroom.schedule || null,
          color: classroom.color,
          class_schedule: classroom.class_schedule || {},
          education_level_id: classroom.education_level_id || null,
          subject_id: classroom.subject_id || null,
          grade_level_id: classroom.grade_level_id || null,
          teacher_template_id: classroom.teacher_template_id || null,
          show_badges: classroom.show_badges ?? true,
          show_leaderboard: classroom.show_leaderboard ?? true,
          show_stats_banner: classroom.show_stats_banner ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('تم إنشاء الصف بنجاح');
      
      // Notify supervising department heads
      notifySupervisingDepartmentHeads(
        'new_classroom',
        'فصل جديد',
        `تم إضافة فصل جديد: ${data.name}`,
        data.id
      );
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الصف: ' + error.message);
    },
  });
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Classroom> & { id: string }) => {
      const { data, error } = await supabase
        .from('classrooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('تم تحديث الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الصف: ' + error.message);
    },
  });
}

// Archive classroom (for teachers - soft delete)
export function useArchiveClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classrooms')
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['archived_classrooms'] });
      toast.success('تم أرشفة الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في أرشفة الصف: ' + error.message);
    },
  });
}

// Restore archived classroom (for admins)
export function useRestoreClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classrooms')
        .update({ 
          is_archived: false, 
          archived_at: null 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['archived_classrooms'] });
      toast.success('تم استعادة الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في استعادة الصف: ' + error.message);
    },
  });
}

// Permanent delete (for admins only)
export function useDeleteClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['archived_classrooms'] });
      toast.success('تم حذف الصف نهائياً');
    },
    onError: (error) => {
      toast.error('فشل في حذف الصف: ' + error.message);
    },
  });
}

// Get archived classrooms with teacher info (for admins)
export interface ArchivedClassroomWithTeacher extends Classroom {
  teacher_name?: string;
  teacher_phone?: string;
  teacher_school?: string;
}

export function useArchivedClassrooms() {
  return useQuery({
    queryKey: ['archived_classrooms'],
    queryFn: async () => {
      // First get archived classrooms
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });
      
      if (classroomsError) throw classroomsError;
      if (!classrooms || classrooms.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(classrooms.map(c => c.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, school_name')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine data
      return classrooms.map(classroom => ({
        ...classroom,
        teacher_name: profilesMap.get(classroom.user_id)?.full_name || 'غير معروف',
        teacher_phone: profilesMap.get(classroom.user_id)?.phone || null,
        teacher_school: profilesMap.get(classroom.user_id)?.school_name || null,
      })) as ArchivedClassroomWithTeacher[];
    },
  });
}
