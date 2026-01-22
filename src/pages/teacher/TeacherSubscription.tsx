import { Capacitor } from '@capacitor/core';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import TeacherSubscriptionWeb from './TeacherSubscriptionWeb';
import TeacherSubscriptionIOS from './TeacherSubscriptionIOS';

/**
 * Smart router that shows iOS or Web version based on platform and admin settings
 */
export default function TeacherSubscription() {
  // Check if iOS payment is enabled from admin settings
  const { data: iosPaymentEnabled, isLoading } = useQuery({
    queryKey: ['ios-payment-setting'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'ios_payment_enabled')
        .single();
      
      return data?.value === true || data?.value === 'true';
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If on iOS native app and iOS payment is NOT enabled, show iOS version (Reader App model)
  const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  
  if (isIOSNative && !iosPaymentEnabled) {
    return <TeacherSubscriptionIOS />;
  }

  // Otherwise show web version with full payment
  return <TeacherSubscriptionWeb />;
}
