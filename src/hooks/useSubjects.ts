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
      all_grade_levels?: { id: string }[]; // Pass all grade levels when no specific one selected
    }) => {
      const { all_grade_levels, ...subjectData } = subject;
      
      // If no grade_level_id and all_grade_levels are provided, create for all grades
      if (!subject.grade_level_id && all_grade_levels && all_grade_levels.length > 0) {
        const subjectsToInsert = all_grade_levels.map(grade => ({
          ...subjectData,
          grade_level_id: grade.id,
          grade_types: subject.grade_types || ['exam', 'assignment', 'participation', 'project'],
        }));

        const { data, error } = await supabase
          .from('subjects')
          .insert(subjectsToInsert)
          .select();

        if (error) throw error;
        return data[0] as Subject; // Return first one for navigation
      } else {
        // Create single subject (either with specific grade or no grade)
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            ...subjectData,
            grade_types: subject.grade_types || ['exam', 'assignment', 'participation', 'project'],
          })
          .select()
          .single();

        if (error) throw error;
        return data as Subject;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      const count = variables.all_grade_levels?.length;
      if (count && count > 1) {
        toast.success(`تمت إضافة المادة لـ ${count} صفوف بنجاح`);
      } else {
        toast.success('تمت إضافة المادة بنجاح');
      }
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
