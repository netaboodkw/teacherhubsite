import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GradeLevel {
  id: string;
  education_level_id: string;
  name: string;
  name_ar: string;
  grade_number: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useGradeLevels(educationLevelId?: string) {
  return useQuery({
    queryKey: ['grade_levels', educationLevelId],
    queryFn: async () => {
      let query = supabase
        .from('grade_levels')
        .select('*')
        .order('grade_number', { ascending: true });
      
      if (educationLevelId) {
        query = query.eq('education_level_id', educationLevelId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as GradeLevel[];
    },
  });
}

export function useCreateGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gradeLevel: { 
      education_level_id: string;
      name: string; 
      name_ar: string;
      grade_number: number;
    }) => {
      const { data, error } = await supabase
        .from('grade_levels')
        .insert(gradeLevel)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      toast.success('تم إضافة الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة الصف: ' + error.message);
    },
  });
}

export function useUpdateGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GradeLevel> & { id: string }) => {
      const { data, error } = await supabase
        .from('grade_levels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      toast.success('تم تحديث الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الصف: ' + error.message);
    },
  });
}

export function useDeleteGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grade_levels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      toast.success('تم حذف الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الصف: ' + error.message);
    },
  });
}
