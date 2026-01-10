import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GradeType = 'exam' | 'assignment' | 'participation' | 'project';

export interface Subject {
  id: string;
  education_level_id: string;
  grade_level_id: string | null;
  name: string;
  name_ar: string;
  weeks_count: number;
  max_score: number;
  grade_types: GradeType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubjects(educationLevelId?: string, gradeLevelId?: string) {
  return useQuery({
    queryKey: ['subjects', educationLevelId, gradeLevelId],
    queryFn: async () => {
      let query = supabase
        .from('subjects')
        .select('*')
        .order('name_ar', { ascending: true });
      
      if (educationLevelId) {
        query = query.eq('education_level_id', educationLevelId);
      }
      
      if (gradeLevelId) {
        query = query.eq('grade_level_id', gradeLevelId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Subject[];
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: { 
      education_level_id: string;
      grade_level_id?: string | null;
      name: string; 
      name_ar: string; 
      weeks_count?: number;
      max_score?: number;
      grade_types?: GradeType[];
    }) => {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          ...subject,
          grade_types: subject.grade_types || ['exam', 'assignment', 'participation', 'project'],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('تمت إضافة المادة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة المادة: ' + error.message);
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subject> & { id: string }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('تم تحديث المادة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث المادة: ' + error.message);
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('تم حذف المادة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف المادة: ' + error.message);
    },
  });
}
