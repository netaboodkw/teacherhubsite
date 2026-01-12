import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user' | 'department_head';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  return useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserRole | null;
    },
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return {
    isAdmin: role?.role === 'admin',
    isLoading,
  };
}

export function useIsDepartmentHead() {
  const { data: role, isLoading } = useUserRole();
  return {
    isDepartmentHead: role?.role === 'department_head',
    isLoading,
  };
}

export function useIsTeacher() {
  const { data: role, isLoading } = useUserRole();
  return {
    isTeacher: role?.role === 'user' || !role, // 'user' role or no role means teacher
    isLoading,
  };
}

export function getUserRoleRedirectPath(role: AppRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'department_head':
      return '/department-head';
    case 'user':
    default:
      return '/teacher';
  }
}
