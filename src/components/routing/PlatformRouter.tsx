import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import Landing from '@/pages/Landing';
import Welcome from '@/pages/Welcome';

export default function PlatformRouter() {
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if running on native platform (iOS/Android)
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while detecting platform and auth state
  if (isNative === null || isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/teacher" replace />;
  }

  // Native app (iOS/Android) → Welcome page
  if (isNative) {
    return <Welcome />;
  }

  // Web browser → Landing page
  return <Landing />;
}
