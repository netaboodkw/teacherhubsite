import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BehaviorNote {
  id: string;
  user_id: string;
  student_id: string;
  classroom_id: string;
  type: 'positive' | 'negative' | 'note';
  description: string;
  points: number;
  date: string;
  created_at: string;
}

export function useBehaviorNotes(studentId?: string) {
  return useQuery({
    queryKey: ['behavior_notes', studentId],
    queryFn: async () => {
      let query = supabase
        .from('behavior_notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as BehaviorNote[];
    },
    enabled: !!studentId,
  });
}

export function useAllBehaviorNotes() {
  return useQuery({
    queryKey: ['behavior_notes', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavior_notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BehaviorNote[];
    },
  });
}

export function useUpdateBehaviorNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BehaviorNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('behavior_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior_notes'] });
      toast.success('تم تحديث الملاحظة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الملاحظة: ' + error.message);
    },
  });
}

export function useDeleteBehaviorNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('behavior_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior_notes'] });
      toast.success('تم حذف الملاحظة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الملاحظة: ' + error.message);
    },
  });
}
