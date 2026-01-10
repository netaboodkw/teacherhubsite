import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EducationLevel {
  id: string;
  name: string;
  name_ar: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEducationLevels() {
  return useQuery({
    queryKey: ['education_levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_levels')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as EducationLevel[];
    },
  });
}

export function useCreateEducationLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (level: { name: string; name_ar: string; display_order?: number }) => {
      const { data, error } = await supabase
        .from('education_levels')
        .insert(level)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education_levels'] });
      toast.success('تمت إضافة المرحلة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة المرحلة: ' + error.message);
    },
  });
}

export function useUpdateEducationLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EducationLevel> & { id: string }) => {
      const { data, error } = await supabase
        .from('education_levels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education_levels'] });
      toast.success('تم تحديث المرحلة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث المرحلة: ' + error.message);
    },
  });
}

export function useDeleteEducationLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('education_levels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education_levels'] });
      toast.success('تم حذف المرحلة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف المرحلة: ' + error.message);
    },
  });
}
