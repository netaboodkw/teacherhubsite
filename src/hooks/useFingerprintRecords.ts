import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export interface FingerprintRecord {
  id: string;
  user_id: string;
  date: string;
  attendance_time: string;
  fingerprint_window_start: string;
  fingerprint_window_end: string;
  recorded_at: string;
  status: 'on_time' | 'late' | 'missed';
  created_at: string;
  updated_at: string;
}

export function useFingerprintRecords(month?: Date) {
  const { user } = useAuth();
  const targetMonth = month || new Date();
  
  return useQuery({
    queryKey: ['fingerprint-records', user?.id, format(targetMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(targetMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('fingerprint_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as FingerprintRecord[];
    },
    enabled: !!user?.id,
  });
}

export function useFingerprintStats(month?: Date) {
  const { data: records = [], isLoading } = useFingerprintRecords(month);
  
  const stats = {
    total: records.length,
    onTime: records.filter(r => r.status === 'on_time').length,
    late: records.filter(r => r.status === 'late').length,
    missed: records.filter(r => r.status === 'missed').length,
    onTimeRate: records.length > 0 
      ? Math.round((records.filter(r => r.status === 'on_time').length / records.length) * 100) 
      : 0,
  };
  
  return { stats, records, isLoading };
}

export function useRecordFingerprint() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      attendanceTime: string;
      windowStart: string;
      windowEnd: string;
      status: 'on_time' | 'late' | 'missed';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('fingerprint_records')
        .upsert({
          user_id: user.id,
          date: today,
          attendance_time: params.attendanceTime,
          fingerprint_window_start: params.windowStart,
          fingerprint_window_end: params.windowEnd,
          status: params.status,
          recorded_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fingerprint-records'] });
    },
  });
}

export function useTodayFingerprintRecord() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['fingerprint-record-today', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('fingerprint_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data as FingerprintRecord | null;
    },
    enabled: !!user?.id,
  });
}
