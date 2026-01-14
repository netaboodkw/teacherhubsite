import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface SupervisionNotification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: 'invitation_sent' | 'invitation_accepted' | 'invitation_rejected' | 'invitation_deleted' | 'invitation_reminder' | 'new_classroom' | 'new_grades' | 'subscription_expired' | 'department_head_note';
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Fetch notifications for current user
export function useSupervisionNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['supervision_notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('supervision_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SupervisionNotification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('supervision_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supervision_notifications',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['supervision_notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Get unread count
export function useUnreadNotificationsCount() {
  const { data: notifications = [] } = useSupervisionNotifications();
  return notifications.filter(n => !n.is_read).length;
}

// Mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('supervision_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision_notifications'] });
    },
  });
}

// Mark all as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('supervision_notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision_notifications'] });
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('supervision_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision_notifications'] });
    },
  });
}

// Create notification helper
export async function createNotification(
  recipientId: string,
  type: SupervisionNotification['type'],
  title: string,
  message: string,
  relatedId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('supervision_notifications')
    .insert({
      recipient_id: recipientId,
      sender_id: user.id,
      type,
      title,
      message,
      related_id: relatedId || null,
    });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}

// Notify all supervising department heads for a teacher
export async function notifySupervisingDepartmentHeads(
  type: SupervisionNotification['type'],
  title: string,
  message: string,
  relatedId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get all accepted invitations for this teacher
  const { data: invitations, error: invError } = await supabase
    .from('teacher_department_head_invitations')
    .select('department_head_email')
    .eq('teacher_id', user.id)
    .eq('status', 'accepted');

  if (invError || !invitations || invitations.length === 0) return;

  // Get department head user IDs
  const emails = invitations.map(inv => inv.department_head_email);
  const { data: dhProfiles, error: dhError } = await supabase
    .from('department_heads')
    .select('user_id')
    .in('email', emails);

  if (dhError || !dhProfiles) return;

  // Create notifications for all supervising department heads
  const notifications = dhProfiles.map(dh => ({
    recipient_id: dh.user_id,
    sender_id: user.id,
    type,
    title,
    message,
    related_id: relatedId || null,
  }));

  const { error } = await supabase
    .from('supervision_notifications')
    .insert(notifications);

  if (error) {
    console.error('Failed to create notifications for department heads:', error);
  }
}
