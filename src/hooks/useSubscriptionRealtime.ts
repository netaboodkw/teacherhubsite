import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to listen for realtime subscription updates
 * This will automatically refresh subscription data when changes occur
 */
export function useSubscriptionRealtime(options?: {
  onSubscriptionUpdate?: (payload: any) => void;
  onPaymentUpdate?: (payload: any) => void;
  showToast?: boolean;
}) {
  const queryClient = useQueryClient();
  const { onSubscriptionUpdate, onPaymentUpdate, showToast = true } = options || {};

  useEffect(() => {
    let mounted = true;

    const setupRealtimeListeners = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Create a channel for subscription updates
      const channel = supabase
        .channel('subscription-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teacher_subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Subscription update received:', payload);
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-settings'] });
            
            // Call custom handler if provided
            onSubscriptionUpdate?.(payload);
            
            // Show toast for status changes
            if (showToast && payload.eventType === 'UPDATE' && payload.new) {
              const newStatus = (payload.new as any).status;
              if (newStatus === 'active') {
                toast.success('تم تفعيل اشتراكك بنجاح! 🎉', {
                  description: 'يمكنك الآن الاستمتاع بجميع مميزات النظام',
                  duration: 5000,
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscription_payments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Payment update received:', payload);
            
            // Invalidate payment queries
            queryClient.invalidateQueries({ queryKey: ['my-payments'] });
            
            // Call custom handler if provided
            onPaymentUpdate?.(payload);
            
            // Show toast for payment completion
            if (showToast && payload.eventType === 'UPDATE' && payload.new) {
              const newStatus = (payload.new as any).status;
              if (newStatus === 'completed') {
                toast.success('تم تأكيد الدفع بنجاح! ✓', {
                  description: 'جاري تفعيل اشتراكك...',
                  duration: 3000,
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return () => {
        channel.unsubscribe();
      };
    };

    const cleanup = setupRealtimeListeners();

    return () => {
      mounted = false;
      cleanup.then(unsub => unsub?.());
    };
  }, [queryClient, onSubscriptionUpdate, onPaymentUpdate, showToast]);
}

/**
 * Hook specifically for the success page to wait for payment verification
 */
export function useWaitForPaymentCompletion(paymentId: string | null, options?: {
  onComplete?: (subscriptionData: any) => void;
  timeout?: number;
}) {
  const queryClient = useQueryClient();
  const { onComplete, timeout = 30000 } = options || {};

  useEffect(() => {
    if (!paymentId) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const setupListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Set up timeout
      timeoutId = setTimeout(() => {
        console.log('Payment verification timeout');
      }, timeout);

      const channel = supabase
        .channel(`payment-${paymentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'teacher_subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            
            const newStatus = (payload.new as any)?.status;
            if (newStatus === 'active') {
              clearTimeout(timeoutId);
              
              // Refresh all subscription data
              queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
              queryClient.invalidateQueries({ queryKey: ['my-payments'] });
              
              onComplete?.(payload.new);
            }
          }
        )
        .subscribe();

      return () => {
        clearTimeout(timeoutId);
        channel.unsubscribe();
      };
    };

    const cleanup = setupListener();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      cleanup.then(unsub => unsub?.());
    };
  }, [paymentId, queryClient, onComplete, timeout]);
}
