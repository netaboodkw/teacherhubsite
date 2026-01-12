import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DepartmentHead {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherInvitation {
  id: string;
  teacher_id: string;
  department_head_email: string;
  department_head_id: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Hook for department head to get their profile
export function useDepartmentHeadProfile() {
  return useQuery({
    queryKey: ['department_head_profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('department_heads')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DepartmentHead | null;
    },
  });
}

// Hook for teacher to get their invitations
export function useTeacherInvitations() {
  return useQuery({
    queryKey: ['teacher_invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('teacher_department_head_invitations')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TeacherInvitation[];
    },
  });
}

// Hook for department head to get invitations for them
export function useDepartmentHeadInvitations() {
  return useQuery({
    queryKey: ['department_head_invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First get the department head's email
      const { data: dhProfile } = await supabase
        .from('department_heads')
        .select('email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!dhProfile) return [];

      const { data, error } = await supabase
        .from('teacher_department_head_invitations')
        .select('*')
        .eq('department_head_email', dhProfile.email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TeacherInvitation[];
    },
  });
}

// Hook for teacher to invite a department head
export function useInviteDepartmentHead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      // Check if invitation already exists
      const { data: existing } = await supabase
        .from('teacher_department_head_invitations')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('department_head_email', email)
        .maybeSingle();

      if (existing) {
        throw new Error('تم إرسال دعوة لهذا البريد الإلكتروني مسبقاً');
      }

      const { data, error } = await supabase
        .from('teacher_department_head_invitations')
        .insert({
          teacher_id: user.id,
          department_head_email: email.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher_invitations'] });
      toast.success('تم إرسال الدعوة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for teacher to delete invitation
export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('teacher_department_head_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher_invitations'] });
      toast.success('تم حذف الدعوة');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for department head to accept/reject invitation
export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: string; status: 'accepted' | 'rejected' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data, error } = await supabase
        .from('teacher_department_head_invitations')
        .update({
          status,
          department_head_id: user.id,
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['department_head_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['supervised_teachers'] });
      toast.success(variables.status === 'accepted' ? 'تم قبول الدعوة' : 'تم رفض الدعوة');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for department head to get teachers they supervise
export function useSupervisedTeachers() {
  return useQuery({
    queryKey: ['supervised_teachers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get the department head's email
      const { data: dhProfile } = await supabase
        .from('department_heads')
        .select('email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!dhProfile) return [];

      // Get accepted invitations
      const { data: invitations, error: invError } = await supabase
        .from('teacher_department_head_invitations')
        .select('teacher_id')
        .eq('department_head_email', dhProfile.email)
        .eq('status', 'accepted');

      if (invError) throw invError;
      if (!invitations || invitations.length === 0) return [];

      const teacherIds = invitations.map(inv => inv.teacher_id);

      // Get teacher profiles
      const { data: teachers, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', teacherIds);

      if (error) throw error;
      return teachers || [];
    },
  });
}

// Hook for checking if current user is a department head
export function useIsDepartmentHead() {
  const { data: profile, isLoading } = useDepartmentHeadProfile();
  return {
    isDepartmentHead: !!profile,
    isLoading,
  };
}
