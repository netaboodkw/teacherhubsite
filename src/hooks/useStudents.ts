import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
  id: string;
  user_id: string;
  classroom_id: string;
  name: string;
  student_id: string;
  avatar_url: string | null;
  notes: string | null;
  special_needs: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudents(classroomId?: string) {
  return useQuery({
    queryKey: ['students', classroomId],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      
      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Student[];
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Student | null;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: { 
      name: string; 
      student_id: string; 
      classroom_id: string; 
      notes?: string;
      special_needs?: boolean;
      avatar_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data, error } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          name: student.name,
          student_id: student.student_id,
          classroom_id: student.classroom_id,
          notes: student.notes || null,
          special_needs: student.special_needs || false,
          avatar_url: student.avatar_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('تم إضافة الطالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة الطالب: ' + error.message);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Student> & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('تم تحديث بيانات الطالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث بيانات الطالب: ' + error.message);
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('تم حذف الطالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الطالب: ' + error.message);
    },
  });
}
