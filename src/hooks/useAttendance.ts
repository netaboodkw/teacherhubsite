import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  user_id: string;
  student_id: string;
  classroom_id: string;
  date: string;
  status: AttendanceStatus;
  period: number;
  created_at: string;
  updated_at: string;
}

export function useAttendance(classroomId?: string, date?: string) {
  return useQuery({
    queryKey: ['attendance', classroomId, date],
    queryFn: async () => {
      let query = supabase
        .from('attendance_records')
        .select('*');
      
      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }
      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: { student_id: string; classroom_id: string; date: string; status: AttendanceStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      // Try to upsert - update if exists, insert if not
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({
          user_id: user.id,
          student_id: record.student_id,
          classroom_id: record.classroom_id,
          date: record.date,
          status: record.status,
          period: 1,
        }, {
          onConflict: 'student_id,date,period',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error) => {
      toast.error('فشل في تسجيل الحضور: ' + error.message);
    },
  });
}

export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: { student_id: string; classroom_id: string; date: string; status: AttendanceStatus }[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const recordsWithUserId = records.map(r => ({
        ...r,
        user_id: user.id,
        period: 1,
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(recordsWithUserId, {
          onConflict: 'student_id,date,period',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('تم حفظ الحضور بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حفظ الحضور: ' + error.message);
    },
  });
}
