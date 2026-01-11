import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GradingPeriod {
  id: string;
  education_level_id: string;
  grade_level_id: string | null;
  subject_id: string | null;
  name: string;
  name_ar: string;
  display_order: number;
  max_score: number;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradingTemplate {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradingTemplatePeriod {
  id: string;
  template_id: string;
  name: string;
  name_ar: string;
  display_order: number;
  max_score: number;
  weight: number;
  created_at: string;
}

// Grading Periods Hooks
export function useGradingPeriods(filters?: {
  education_level_id?: string;
  grade_level_id?: string;
  subject_id?: string;
}) {
  return useQuery({
    queryKey: ['grading_periods', filters],
    queryFn: async () => {
      let query = supabase
        .from('grading_periods')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (filters?.education_level_id) {
        query = query.eq('education_level_id', filters.education_level_id);
      }
      if (filters?.grade_level_id) {
        query = query.eq('grade_level_id', filters.grade_level_id);
      }
      if (filters?.subject_id) {
        query = query.eq('subject_id', filters.subject_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as GradingPeriod[];
    },
  });
}

export function useCreateGradingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period: Omit<GradingPeriod, 'id' | 'is_active' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('grading_periods')
        .insert(period)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
      toast.success('تم إضافة الفترة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة الفترة: ' + error.message);
    },
  });
}

export function useUpdateGradingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GradingPeriod> & { id: string }) => {
      const { data, error } = await supabase
        .from('grading_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
      toast.success('تم تحديث الفترة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الفترة: ' + error.message);
    },
  });
}

export function useDeleteGradingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grading_periods')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
      toast.success('تم حذف الفترة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الفترة: ' + error.message);
    },
  });
}

// Grading Templates Hooks
export function useGradingTemplates() {
  return useQuery({
    queryKey: ['grading_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grading_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GradingTemplate[];
    },
  });
}

export function useGradingTemplatePeriods(templateId?: string) {
  return useQuery({
    queryKey: ['grading_template_periods', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('grading_template_periods')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as GradingTemplatePeriod[];
    },
    enabled: !!templateId,
  });
}

export function useCreateGradingTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: { 
      name: string; 
      name_ar: string; 
      description?: string;
      periods: { name: string; name_ar: string; max_score: number; weight: number; group_name?: string; type?: string }[];
      full_structure?: any; // Store the full structure as JSON
    }) => {
      // Create template with full structure in description (as JSON)
      const structureJson = template.full_structure ? JSON.stringify(template.full_structure) : null;
      
      const { data: templateData, error: templateError } = await supabase
        .from('grading_templates')
        .insert({
          name: template.name,
          name_ar: template.name_ar,
          description: structureJson || template.description || null,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create periods (for backward compatibility)
      if (template.periods.length > 0) {
        const periodsToInsert = template.periods.map((period, index) => ({
          template_id: templateData.id,
          name: period.name,
          name_ar: period.name_ar,
          display_order: index,
          max_score: period.max_score,
          weight: period.weight,
        }));

        const { error: periodsError } = await supabase
          .from('grading_template_periods')
          .insert(periodsToInsert);

        if (periodsError) throw periodsError;
      }

      return templateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_templates'] });
      queryClient.invalidateQueries({ queryKey: ['grading_template_periods'] });
      toast.success('تم إنشاء القالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إنشاء القالب: ' + error.message);
    },
  });
}

export function useUpdateGradingTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: { 
      id: string;
      name: string; 
      name_ar: string; 
      description?: string;
      periods?: { name: string; name_ar: string; max_score: number; weight: number }[];
      syncStructures?: boolean; // Whether to sync all structures using this template
    }) => {
      // Update template
      const { error: templateError } = await supabase
        .from('grading_templates')
        .update({
          name: template.name,
          name_ar: template.name_ar,
          description: template.description || null,
        })
        .eq('id', template.id);

      if (templateError) throw templateError;

      // Delete existing periods
      const { error: deleteError } = await supabase
        .from('grading_template_periods')
        .delete()
        .eq('template_id', template.id);

      if (deleteError) throw deleteError;

      // Create new periods (if provided)
      if (template.periods && template.periods.length > 0) {
        const periodsToInsert = template.periods.map((period, index) => ({
          template_id: template.id,
          name: period.name,
          name_ar: period.name_ar,
          display_order: index,
          max_score: period.max_score,
          weight: period.weight,
        }));

        const { error: periodsError } = await supabase
          .from('grading_template_periods')
          .insert(periodsToInsert);

        if (periodsError) throw periodsError;
      }

      // Sync all structures that use this template
      if (template.syncStructures !== false && template.description) {
        try {
          const parsedStructure = JSON.parse(template.description);
          if (parsedStructure.groups && Array.isArray(parsedStructure.groups)) {
            // Find all structures with this template_id
            const { data: structures } = await supabase
              .from('subject_grading_structures')
              .select('id')
              .eq('template_id', template.id);

            if (structures && structures.length > 0) {
              // Update each structure with the new structure data
              for (const struct of structures) {
                await supabase
                  .from('subject_grading_structures')
                  .update({
                    name: template.name,
                    name_ar: template.name_ar,
                    structure: parsedStructure,
                  })
                  .eq('id', struct.id);
              }
            }
          }
        } catch {
          // Not a valid JSON, skip syncing
        }
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_templates'] });
      queryClient.invalidateQueries({ queryKey: ['grading_template_periods'] });
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
      queryClient.invalidateQueries({ queryKey: ['classroom_grading_structure'] });
      toast.success('تم تحديث القالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث القالب: ' + error.message);
    },
  });
}

export function useDeleteGradingTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grading_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_templates'] });
      toast.success('تم حذف القالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف القالب: ' + error.message);
    },
  });
}

// Apply template to create grading periods
export function useApplyGradingTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      template_id: string;
      education_level_id: string;
      grade_level_id?: string;
      subject_id?: string;
    }) => {
      // Get template periods
      const { data: templatePeriods, error: fetchError } = await supabase
        .from('grading_template_periods')
        .select('*')
        .eq('template_id', params.template_id)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Create grading periods from template
      const periodsToInsert = templatePeriods.map(period => ({
        education_level_id: params.education_level_id,
        grade_level_id: params.grade_level_id || null,
        subject_id: params.subject_id || null,
        name: period.name,
        name_ar: period.name_ar,
        display_order: period.display_order,
        max_score: period.max_score,
        weight: period.weight,
      }));

      const { data, error } = await supabase
        .from('grading_periods')
        .insert(periodsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
      toast.success('تم تطبيق القالب بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تطبيق القالب: ' + error.message);
    },
  });
}

// Copy grading periods
export function useCopyGradingPeriods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      source_education_level_id: string;
      source_grade_level_id?: string;
      source_subject_id?: string;
      target_education_level_id: string;
      target_grade_level_id?: string;
      target_subject_id?: string;
    }) => {
      // Get source periods
      let query = supabase
        .from('grading_periods')
        .select('*')
        .eq('education_level_id', params.source_education_level_id);
      
      if (params.source_grade_level_id) {
        query = query.eq('grade_level_id', params.source_grade_level_id);
      }
      if (params.source_subject_id) {
        query = query.eq('subject_id', params.source_subject_id);
      }

      const { data: sourcePeriods, error: fetchError } = await query
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Create new periods
      const periodsToInsert = sourcePeriods.map(period => ({
        education_level_id: params.target_education_level_id,
        grade_level_id: params.target_grade_level_id || null,
        subject_id: params.target_subject_id || null,
        name: period.name,
        name_ar: period.name_ar,
        display_order: period.display_order,
        max_score: period.max_score,
        weight: period.weight,
      }));

      const { data, error } = await supabase
        .from('grading_periods')
        .insert(periodsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
      toast.success('تم نسخ نظام الدرجات بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في نسخ نظام الدرجات: ' + error.message);
    },
  });
}
