import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['system_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      
      if (error) throw error;
      return data as SystemSetting | null;
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      // First try to update
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      // Store value directly without JSON.stringify for boolean values
      // The 'value' column is a JSON type, so it can store booleans directly
      const valueToStore = value;

      if (existing) {
        const { data, error } = await supabase
          .from('system_settings')
          .update({ value: valueToStore })
          .eq('key', key)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert if not exists
        const { data, error } = await supabase
          .from('system_settings')
          .insert({ key, value: valueToStore })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      toast.success('تم حفظ الإعداد بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حفظ الإعداد: ' + error.message);
    },
  });
}

// Helper hook to get a specific boolean setting
export function useAllowEditLinkedTemplates() {
  const { data: setting, isLoading } = useSystemSetting('allow_edit_linked_templates');
  
  // Parse the value - it could be stored as string "true"/"false" or boolean true/false
  // Handle all possible formats: boolean, string, or JSON stringified value
  let allowEdit = false; // Default to false (don't allow editing)
  
  if (setting?.value !== undefined && setting?.value !== null) {
    const value = setting.value;
    if (typeof value === 'boolean') {
      allowEdit = value;
    } else if (typeof value === 'string') {
      allowEdit = value === 'true';
    }
  }
  
  return { allowEdit, isLoading };
}
