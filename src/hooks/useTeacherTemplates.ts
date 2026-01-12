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
  is_default?: boolean; // Flag for admin templates
}

export interface SharedTemplate {
  id: string;
  template_id: string;
  user_id: string;
  share_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Generate a random 6-digit share code
function generateShareCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
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
        structure: item.structure as unknown as GradingStructureData,
        is_default: false,
      })) as TeacherTemplate[];
    },
    enabled: !!user?.id,
  });
}

// Fetch admin default templates from grading_templates table
export function useAdminDefaultTemplates() {
  return useQuery({
    queryKey: ['admin-default-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grading_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse the description field which contains the JSON structure
      return (data || []).map(item => {
        let structure: GradingStructureData = { groups: [], settings: { showPercentage: true, passingScore: 50, showGrandTotal: true } };
        try {
          if (item.description) {
            structure = JSON.parse(item.description);
          }
        } catch {
          // Keep default structure if parsing fails
        }
        
        return {
          id: `admin_${item.id}`, // Prefix to distinguish from teacher templates
          user_id: 'admin',
          name: item.name,
          name_ar: item.name_ar,
          description: null,
          structure,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          is_default: true,
        } as TeacherTemplate;
      });
    },
  });
}

// Combined hook that returns both teacher templates and admin default templates
export function useAllAvailableTemplates() {
  const { data: teacherTemplates = [], isLoading: teacherLoading } = useTeacherTemplates();
  const { data: adminTemplates = [], isLoading: adminLoading } = useAdminDefaultTemplates();

  return {
    data: [...teacherTemplates, ...adminTemplates],
    teacherTemplates,
    adminTemplates,
    isLoading: teacherLoading || adminLoading,
  };
}

export function useSharedTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shared-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('shared_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SharedTemplate[];
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

// Share a template (generate code)
export function useShareTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if already shared
      const { data: existing } = await supabase
        .from('shared_templates')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Reactivate if exists
        if (!existing.is_active) {
          const { data, error } = await supabase
            .from('shared_templates')
            .update({ is_active: true })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return data as SharedTemplate;
        }
        return existing as SharedTemplate;
      }

      // Create new share
      const shareCode = generateShareCode();
      const { data, error } = await supabase
        .from('shared_templates')
        .insert({
          template_id: templateId,
          user_id: user.id,
          share_code: shareCode,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SharedTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-templates'] });
    },
  });
}

// Stop sharing a template
export function useUnshareTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('shared_templates')
        .update({ is_active: false })
        .eq('template_id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-templates'] });
    },
  });
}

// Import a template by code
export function useImportTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (shareCode: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Find shared template by code
      const { data: shared, error: sharedError } = await supabase
        .from('shared_templates')
        .select('*')
        .eq('share_code', shareCode.trim())
        .eq('is_active', true)
        .single();

      if (sharedError || !shared) {
        throw new Error('رمز القالب غير صالح أو غير متاح');
      }

      // Get original template
      const { data: originalTemplate, error: templateError } = await supabase
        .from('teacher_grading_templates')
        .select('*')
        .eq('id', shared.template_id)
        .single();

      if (templateError || !originalTemplate) {
        throw new Error('القالب الأصلي غير موجود');
      }

      // Create copy for the importing user
      const { data, error } = await supabase
        .from('teacher_grading_templates')
        .insert({
          user_id: user.id,
          name: originalTemplate.name,
          name_ar: `${originalTemplate.name_ar} (مستورد)`,
          description: originalTemplate.description,
          structure: originalTemplate.structure,
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
