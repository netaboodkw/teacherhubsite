import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { GradingStructureData } from './useGradingStructures';

export interface TeacherTemplate {
  id: string;
  user_id: string;
  name: string;
  name_ar: string;
  description: string | null;
  structure: GradingStructureData;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTeacherTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('teacher_grading_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        structure: item.structure as unknown as GradingStructureData
      })) as TeacherTemplate[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateTeacherTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      name_ar: string;
      description?: string;
      structure: GradingStructureData;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('teacher_grading_templates')
        .insert({
          user_id: user.id,
          name: template.name,
          name_ar: template.name_ar,
          description: template.description || null,
          structure: template.structure as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-templates'] });
    },
  });
}

export function useUpdateTeacherTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      name_ar?: string;
      description?: string;
      structure?: GradingStructureData;
      is_active?: boolean;
    }) => {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.name_ar !== undefined) updateData.name_ar = updates.name_ar;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.structure !== undefined) updateData.structure = updates.structure;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('teacher_grading_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-templates'] });
    },
  });
}

export function useDeleteTeacherTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teacher_grading_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-templates'] });
    },
  });
}
