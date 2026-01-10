import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassSchedule {
  [day: string]: number[];
}

export interface Classroom {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  schedule: string | null;
  color: string;
  class_schedule: ClassSchedule | null;
  created_at: string;
  updated_at: string;
}

export function useClassrooms() {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Classroom[];
    },
  });
}

export function useClassroom(id: string) {
  return useQuery({
    queryKey: ['classrooms', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Classroom | null;
    },
    enabled: !!id,
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classroom: { 
      name: string; 
      subject: string; 
      schedule?: string; 
      color: string;
      class_schedule?: ClassSchedule;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data, error } = await supabase
        .from('classrooms')
        .insert({
          user_id: user.id,
          name: classroom.name,
          subject: classroom.subject,
          schedule: classroom.schedule || null,
          color: classroom.color,
          class_schedule: classroom.class_schedule || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('تم إنشاء الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الصف: ' + error.message);
    },
  });
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Classroom> & { id: string }) => {
      const { data, error } = await supabase
        .from('classrooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('تم تحديث الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الصف: ' + error.message);
    },
  });
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('تم حذف الصف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الصف: ' + error.message);
    },
  });
}
