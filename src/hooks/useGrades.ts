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
  week_number: number;
  created_at: string;
  updated_at: string;
}

export function useGrades(classroomId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['grades', classroomId, studentId],
    queryFn: async () => {
      // If classroomId is provided, fetch grades for that classroom directly
      if (classroomId) {
        let query = supabase
          .from('grades')
          .select('*')
          .eq('classroom_id', classroomId)
          .order('date', { ascending: false });
        
        if (studentId) {
          query = query.eq('student_id', studentId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Grade[];
      }
      
      // Otherwise, fetch grades but exclude those from archived classrooms
      // First get non-archived classroom IDs
      const { data: activeClassrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('is_archived', false);
      
      if (classroomsError) throw classroomsError;
      
      const activeClassroomIds = activeClassrooms?.map(c => c.id) || [];
      
      if (activeClassroomIds.length === 0) {
        return [] as Grade[];
      }
      
      let query = supabase
        .from('grades')
        .select('*')
        .in('classroom_id', activeClassroomIds)
        .order('date', { ascending: false });
      
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
      week_number?: number;
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
          week_number: grade.week_number || 1,
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
