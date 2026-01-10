import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GradeType = 'exam' | 'assignment' | 'participation' | 'project';

export interface Grade {
  id: string;
  user_id: string;
  student_id: string;
  classroom_id: string;
  type: GradeType;
  title: string;
  score: number;
  max_score: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export function useGrades(classroomId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['grades', classroomId, studentId],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select('*')
        .order('date', { ascending: false });
      
      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Grade[];
    },
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grade: { 
      student_id: string; 
      classroom_id: string; 
      type: GradeType; 
      title: string; 
      score: number; 
      max_score: number;
      date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data, error } = await supabase
        .from('grades')
        .insert({
          user_id: user.id,
          student_id: grade.student_id,
          classroom_id: grade.classroom_id,
          type: grade.type,
          title: grade.title,
          score: grade.score,
          max_score: grade.max_score,
          date: grade.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('تمت إضافة الدرجة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة الدرجة: ' + error.message);
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Grade> & { id: string }) => {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('تم تحديث الدرجة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الدرجة: ' + error.message);
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('تم حذف الدرجة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الدرجة: ' + error.message);
    },
  });
}
