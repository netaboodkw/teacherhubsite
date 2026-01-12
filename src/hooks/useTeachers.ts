import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  school_name: string | null;
  subject: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_profile_complete: boolean | null;
  created_at: string;
  education_level_name: string | null;
  subject_name: string | null;
}

export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers_view')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Teacher[];
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherUserId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-teacher', {
        body: { teacherUserId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('تم حذف المعلم وجميع بياناته بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف المعلم: ' + error.message);
    },
  });
}
