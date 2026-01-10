import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
