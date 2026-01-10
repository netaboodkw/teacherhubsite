import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GradingColumn {
  id: string;
  name_ar: string;
  max_score: number;
  type: 'score' | 'total' | 'percentage' | 'label';
}

export interface GradingGroup {
  id: string;
  name_ar: string;
  color: string;
  columns: GradingColumn[];
}

export interface GradingStructureData {
  groups: GradingGroup[];
  settings: {
    showPercentage: boolean;
    passingScore: number;
  };
}

export interface GradingStructure {
  id: string;
  subject_id: string | null;
  template_id: string | null;
  education_level_id: string;
  grade_level_id: string | null;
  name: string;
  name_ar: string;
  structure: GradingStructureData;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useGradingStructures(filters?: {
  education_level_id?: string;
  grade_level_id?: string;
  subject_id?: string;
}) {
  return useQuery({
    queryKey: ['grading_structures', filters],
    queryFn: async () => {
      let query = supabase
        .from('subject_grading_structures')
        .select('*')
        .order('created_at', { ascending: false });
      
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
      
      return data.map(item => ({
        ...item,
        structure: item.structure as unknown as GradingStructureData
      })) as GradingStructure[];
    },
  });
}

export function useDefaultGradingStructures() {
  return useQuery({
    queryKey: ['default_grading_structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_grading_structures')
        .select('*')
        .eq('is_default', true)
        .order('name_ar', { ascending: true });
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        structure: item.structure as unknown as GradingStructureData
      })) as GradingStructure[];
    },
  });
}

export function useCreateGradingStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (structure: {
      subject_id?: string | null;
      template_id?: string | null;
      education_level_id: string;
      grade_level_id?: string | null;
      name: string;
      name_ar: string;
      structure: GradingStructureData;
      is_default?: boolean;
    }) => {
      const insertData: any = {
        subject_id: structure.subject_id,
        template_id: structure.template_id,
        education_level_id: structure.education_level_id,
        grade_level_id: structure.grade_level_id,
        name: structure.name,
        name_ar: structure.name_ar,
        is_default: structure.is_default,
        structure: structure.structure
      };
      
      const { data, error } = await supabase
        .from('subject_grading_structures')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
      queryClient.invalidateQueries({ queryKey: ['default_grading_structures'] });
      toast.success('تم حفظ هيكل الدرجات بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حفظ هيكل الدرجات: ' + error.message);
    },
  });
}

export function useUpdateGradingStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, structure: structureData, ...updates }: Partial<GradingStructure> & { id: string }) => {
      const updatePayload: Record<string, unknown> = { ...updates };
      if (structureData) {
        updatePayload.structure = structureData as unknown as Record<string, unknown>;
      }
      
      const { data, error } = await supabase
        .from('subject_grading_structures')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
      queryClient.invalidateQueries({ queryKey: ['default_grading_structures'] });
      toast.success('تم تحديث هيكل الدرجات بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث هيكل الدرجات: ' + error.message);
    },
  });
}

export function useDeleteGradingStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subject_grading_structures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
      queryClient.invalidateQueries({ queryKey: ['default_grading_structures'] });
      toast.success('تم حذف هيكل الدرجات بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف هيكل الدرجات: ' + error.message);
    },
  });
}
