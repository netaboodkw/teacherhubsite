import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['admin_profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no admin profile exists, return null
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as AdminProfile;
    },
    enabled: !!user?.id,
  });

  return {
    profile,
    isLoading,
    refetch,
  };
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AdminProfile> & { user_id: string }) => {
      const { error } = await supabase
        .from('admin_profiles')
        .update(data)
        .eq('user_id', data.user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_profile'] });
    },
  });
}