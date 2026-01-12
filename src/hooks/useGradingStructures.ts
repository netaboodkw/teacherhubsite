import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GradingColumn {
  id: string;
  name_ar: string;
  max_score: number;
  type: 'score' | 'total' | 'grand_total' | 'group_sum' | 'external_sum' | 'percentage' | 'label';
  sourceGroupIds?: string[]; // For grand_total and group_sum - groups to sum from
  sourceColumnIds?: string[]; // For total - columns to sum, for grand_total - same group columns
  externalSourceColumns?: string[]; // For external_sum - score columns from other groups (format: "groupId:columnId")
  useGroupColor?: boolean;
}

export interface GradingGroup {
  id: string;
  name_ar: string;
  color: string;
  border?: string;
  columns: GradingColumn[];
}

export interface GradingStructureData {
  groups: GradingGroup[];
  settings: {
    showPercentage: boolean;
    passingScore: number;
    showGrandTotal: boolean; // إظهار/إخفاء المجموع الكلي
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

// Get grading structure for a specific classroom based on education level, grade level, subject, and teacher template
export function useClassroomGradingStructure(classroom?: {
  education_level_id?: string | null;
  grade_level_id?: string | null;
  subject_id?: string | null;
  teacher_template_id?: string | null;
}) {
  return useQuery({
    queryKey: ['classroom_grading_structure', classroom?.education_level_id, classroom?.grade_level_id, classroom?.subject_id, classroom?.teacher_template_id],
    queryFn: async () => {
      // If there's a teacher template, check if it's an admin template or teacher template
      if (classroom?.teacher_template_id) {
        // Check if it's an admin template (prefixed with admin_)
        if (classroom.teacher_template_id.startsWith('admin_')) {
          const adminTemplateId = classroom.teacher_template_id.replace('admin_', '');
          const { data: adminTemplateData, error: adminError } = await supabase
            .from('grading_templates')
            .select('*')
            .eq('id', adminTemplateId)
            .single();
          
          if (!adminError && adminTemplateData) {
            let structure: GradingStructureData = { groups: [], settings: { showPercentage: true, passingScore: 50, showGrandTotal: false } };
            try {
              if (adminTemplateData.description) {
                structure = JSON.parse(adminTemplateData.description);
              }
            } catch {
              // Keep default structure if parsing fails
            }
            
            return {
              id: adminTemplateData.id,
              name: adminTemplateData.name,
              name_ar: adminTemplateData.name_ar,
              structure,
              subject_id: null,
              education_level_id: null,
              grade_level_id: null,
              template_id: adminTemplateData.id,
              is_default: true,
              created_at: adminTemplateData.created_at,
              updated_at: adminTemplateData.updated_at,
            } as GradingStructure;
          }
        } else {
          // Regular teacher template
          const { data: templateData, error: templateError } = await supabase
            .from('teacher_grading_templates')
            .select('*')
            .eq('id', classroom.teacher_template_id)
            .single();
          
          if (!templateError && templateData) {
            return {
              id: templateData.id,
              name: templateData.name,
              name_ar: templateData.name_ar,
              structure: templateData.structure as unknown as GradingStructureData,
              subject_id: null,
              education_level_id: null,
              grade_level_id: null,
              template_id: null,
              is_default: false,
              created_at: templateData.created_at,
              updated_at: templateData.updated_at,
            } as GradingStructure;
          }
        }
      }
      
      if (!classroom?.education_level_id) return null;
      
      // Try to find the most specific match first:
      // 1. Exact match (education_level + grade_level + subject)
      // 2. Education level + subject (any grade)
      // 3. Education level + grade level (any subject)
      // 4. Education level only
      
      let query = supabase
        .from('subject_grading_structures')
        .select('*')
        .eq('education_level_id', classroom.education_level_id);
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      // Find the best match
      let bestMatch: typeof data[0] | null = null;
      let bestScore = -1;
      
      for (const item of data) {
        let score = 0;
        
        // Check grade level match
        if (classroom.grade_level_id && item.grade_level_id === classroom.grade_level_id) {
          score += 2;
        } else if (item.grade_level_id === null) {
          score += 1; // Partial match (applies to all grades)
        } else if (classroom.grade_level_id && item.grade_level_id !== classroom.grade_level_id) {
          continue; // Skip - grade level mismatch
        }
        
        // Check subject match
        if (classroom.subject_id && item.subject_id === classroom.subject_id) {
          score += 2;
        } else if (item.subject_id === null) {
          score += 1; // Partial match (applies to all subjects)
        } else if (classroom.subject_id && item.subject_id !== classroom.subject_id) {
          continue; // Skip - subject mismatch
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      }
      
      if (!bestMatch) return null;
      
      return {
        ...bestMatch,
        structure: bestMatch.structure as unknown as GradingStructureData
      } as GradingStructure;
    },
    enabled: !!(classroom?.education_level_id || classroom?.teacher_template_id),
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
      queryClient.invalidateQueries({ queryKey: ['classroom_grading_structure'] });
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
      queryClient.invalidateQueries({ queryKey: ['classroom_grading_structure'] });
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
      queryClient.invalidateQueries({ queryKey: ['classroom_grading_structure'] });
      toast.success('تم حذف هيكل الدرجات بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف هيكل الدرجات: ' + error.message);
    },
  });
}
