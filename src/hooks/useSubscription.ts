import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SubscriptionCourse {
  id: string;
  name: string;
  name_ar: string;
  start_date: string;
  end_date: string;
  display_order: number;
  is_active: boolean;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  courses_count: number;
  price: number;
  currency: string;
  is_active: boolean;
  display_order: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface TeacherSubscription {
  id: string;
  user_id: string;
  package_id: string | null;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  courses_remaining: number;
  is_read_only: boolean;
}

export interface SubscriptionNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SubscriptionSettings {
  enabled: boolean;
  trial_enabled: boolean;
  trial_days: number;
  expiry_behavior: 'read_only' | 'full_lockout';
}

// Check if subscriptions are enabled
export function useSubscriptionSettings() {
  return useQuery({
    queryKey: ['subscription-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'subscriptions_enabled')
        .maybeSingle();
      
      if (error) throw error;
      const value = data?.value as unknown as SubscriptionSettings | null;
      return value || { enabled: false, trial_enabled: true, trial_days: 100, expiry_behavior: 'read_only' as const };
    },
  });
}

// Get current user's subscription
export function useMySubscription() {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TeacherSubscription | null;
    },
  });
}

// Get subscription notifications
export function useSubscriptionNotifications() {
  return useQuery({
    queryKey: ['subscription-notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('subscription_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SubscriptionNotification[];
    },
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('subscription_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-notifications'] });
    },
  });
}

// Get subscription courses
export function useSubscriptionCourses() {
  return useQuery({
    queryKey: ['subscription-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_courses')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionCourse[];
    },
  });
}

// Get subscription packages
export function useSubscriptionPackages() {
  return useQuery({
    queryKey: ['subscription-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionPackage[];
    },
  });
}

// Get discount codes (admin only)
export function useDiscountCodes() {
  return useQuery({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DiscountCode[];
    },
  });
}

// Validate discount code
export function useValidateDiscountCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('كود الخصم غير صالح');
      
      // Check if expired
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        throw new Error('كود الخصم منتهي الصلاحية');
      }
      
      // Check max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        throw new Error('تم استخدام كود الخصم الحد الأقصى من المرات');
      }
      
      return data as DiscountCode;
    },
  });
}

// Admin mutations
export function useUpdateSubscriptionSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: SubscriptionSettings) => {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', 'subscriptions_enabled')
        .maybeSingle();
      
      const settingsValue = JSON.parse(JSON.stringify(settings)) as Json;
      
      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: settingsValue })
          .eq('key', 'subscriptions_enabled');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert({ 
            key: 'subscriptions_enabled', 
            value: settingsValue,
            description: 'إعدادات نظام الاشتراكات'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-settings'] });
      toast.success('تم حفظ الإعدادات');
    },
    onError: (error: any) => {
      toast.error('فشل في حفظ الإعدادات: ' + error.message);
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (course: Omit<SubscriptionCourse, 'id'>) => {
      const { data, error } = await supabase
        .from('subscription_courses')
        .insert(course)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-courses'] });
      toast.success('تم إضافة الكورس');
    },
    onError: (error: any) => {
      toast.error('فشل في إضافة الكورس: ' + error.message);
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionCourse> & { id: string }) => {
      const { error } = await supabase
        .from('subscription_courses')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-courses'] });
      toast.success('تم تحديث الكورس');
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث الكورس: ' + error.message);
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-courses'] });
      toast.success('تم حذف الكورس');
    },
    onError: (error: any) => {
      toast.error('فشل في حذف الكورس: ' + error.message);
    },
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pkg: Omit<SubscriptionPackage, 'id'>) => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .insert(pkg)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast.success('تم إضافة الباقة');
    },
    onError: (error: any) => {
      toast.error('فشل في إضافة الباقة: ' + error.message);
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionPackage> & { id: string }) => {
      const { error } = await supabase
        .from('subscription_packages')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast.success('تم تحديث الباقة');
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث الباقة: ' + error.message);
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast.success('تم حذف الباقة');
    },
    onError: (error: any) => {
      toast.error('فشل في حذف الباقة: ' + error.message);
    },
  });
}

export function useCreateDiscountCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (code: Omit<DiscountCode, 'id' | 'current_uses'>) => {
      const { data, error } = await supabase
        .from('discount_codes')
        .insert({ ...code, code: code.code.toUpperCase() })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast.success('تم إضافة كود الخصم');
    },
    onError: (error: any) => {
      toast.error('فشل في إضافة كود الخصم: ' + error.message);
    },
  });
}

export function useUpdateDiscountCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiscountCode> & { id: string }) => {
      const { error } = await supabase
        .from('discount_codes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast.success('تم تحديث كود الخصم');
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث كود الخصم: ' + error.message);
    },
  });
}

export function useDeleteDiscountCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast.success('تم حذف كود الخصم');
    },
    onError: (error: any) => {
      toast.error('فشل في حذف كود الخصم: ' + error.message);
    },
  });
}

// Check subscription status helper
export function getSubscriptionStatus(subscription: TeacherSubscription | null, settings: SubscriptionSettings | undefined) {
  const defaultSettings: SubscriptionSettings = {
    enabled: false,
    trial_enabled: true,
    trial_days: 100,
    expiry_behavior: 'read_only'
  };
  
  const effectiveSettings = settings || defaultSettings;
  
  // If subscriptions not enabled, everyone has access
  if (!effectiveSettings.enabled) {
    return { hasAccess: true, isReadOnly: false, status: 'free' as const, daysRemaining: null, isLocked: false };
  }
  
  if (!subscription) {
    const isLocked = effectiveSettings.expiry_behavior === 'full_lockout';
    return { hasAccess: !isLocked, isReadOnly: !isLocked, status: 'none' as const, daysRemaining: null, isLocked };
  }
  
  const now = new Date();
  
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      return { hasAccess: true, isReadOnly: false, status: 'trial' as const, daysRemaining, isLocked: false };
    } else {
      const isLocked = effectiveSettings.expiry_behavior === 'full_lockout';
      return { hasAccess: !isLocked, isReadOnly: !isLocked, status: 'trial_expired' as const, daysRemaining: 0, isLocked };
    }
  }
  
  if (subscription.status === 'active' && subscription.subscription_ends_at) {
    const subEnd = new Date(subscription.subscription_ends_at);
    const daysRemaining = Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      return { hasAccess: true, isReadOnly: false, status: 'active' as const, daysRemaining, isLocked: false };
    } else {
      const isLocked = effectiveSettings.expiry_behavior === 'full_lockout';
      return { hasAccess: !isLocked, isReadOnly: !isLocked, status: 'expired' as const, daysRemaining: 0, isLocked };
    }
  }
  
  if (subscription.status === 'expired' || subscription.is_read_only) {
    const isLocked = effectiveSettings.expiry_behavior === 'full_lockout';
    return { hasAccess: !isLocked, isReadOnly: !isLocked, status: 'expired' as const, daysRemaining: 0, isLocked };
  }
  
  const isLocked = effectiveSettings.expiry_behavior === 'full_lockout';
  return { hasAccess: !isLocked, isReadOnly: !isLocked, status: 'none' as const, daysRemaining: null, isLocked };
}
