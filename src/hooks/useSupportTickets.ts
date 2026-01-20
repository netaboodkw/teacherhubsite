import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  user_email?: string;
  last_message?: string;
  unread_count?: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string | null;
}

// Hook for fetching user's support tickets
export function useMyTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-support-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for tickets
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

// Hook for fetching all tickets (admin)
export function useAllTickets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['all-support-tickets'],
    queryFn: async () => {
      // First get all tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Get user profiles for all tickets
      const userIds = [...new Set(tickets?.map(t => t.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Get unread counts and last messages
      const ticketsWithDetails = await Promise.all(
        (tickets || []).map(async (ticket) => {
          const profile = profiles?.find(p => p.user_id === ticket.user_id);
          
          // Get unread count
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .eq('sender_type', 'user')
            .eq('is_read', false);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('support_messages')
            .select('message')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...ticket,
            user_name: profile?.full_name || 'مستخدم',
            user_email: profile?.email || '',
            unread_count: count || 0,
            last_message: lastMsg?.message || '',
          } as SupportTicket;
        })
      );

      return ticketsWithDetails;
    },
  });

  // Real-time subscription for all tickets
  useEffect(() => {
    const channel = supabase
      .channel('all-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Hook for fetching messages of a ticket
export function useTicketMessages(ticketId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!ticketId,
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return query;
}

// Hook for creating a new ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create first message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_type: 'user',
          message,
        });

      if (messageError) throw messageError;

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
  });
}

// Hook for sending a message
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      message, 
      senderType,
      attachmentUrl 
    }: { 
      ticketId: string; 
      message: string; 
      senderType: 'user' | 'admin';
      attachmentUrl?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: senderType,
          message,
          attachment_url: attachmentUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update ticket's updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
    },
  });
}

// Hook for uploading attachment
export function useUploadAttachment() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('support-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },
  });
}

// Hook for updating ticket status
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: SupportTicket['status'] }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
  });
}

// Hook for marking messages as read
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, senderType }: { ticketId: string; senderType: 'user' | 'admin' }) => {
      const { error } = await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', senderType)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
  });
}

// Hook for getting unread count for admin
export function useUnreadSupportCount() {
  return useQuery({
    queryKey: ['unread-support-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_type', 'user')
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
