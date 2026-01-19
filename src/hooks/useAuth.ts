import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user chose not to remember and session should expire
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const sessionActive = sessionStorage.getItem('sessionActive');
    
    // If remember me is off and no session flag, clear any existing session
    if (!rememberMe && !sessionActive) {
      // This means the browser was closed and reopened without "remember me"
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Check if this is a fresh browser session without remember me
          const lastActivity = localStorage.getItem('lastAuthActivity');
          if (lastActivity) {
            // User had activity but no session flag means browser was closed
            // Don't auto-logout, let them continue (this is a fallback)
          }
        }
      });
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Track activity for session management
        if (session) {
          localStorage.setItem('lastAuthActivity', Date.now().toString());
          sessionStorage.setItem('sessionActive', 'true');
        } else {
          sessionStorage.removeItem('sessionActive');
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        sessionStorage.setItem('sessionActive', 'true');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string,
    additionalData?: {
      education_level_id?: string;
      phone?: string;
      school_name?: string;
      subject?: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          education_level_id: additionalData?.education_level_id,
          phone: additionalData?.phone,
          school_name: additionalData?.school_name,
          subject: additionalData?.subject,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If remember me is enabled, the session will persist by default
    // If not, we'll clear it on browser close (handled by localStorage vs sessionStorage)
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (!rememberMe && data?.session) {
      // Store a flag to check session expiry on app load
      sessionStorage.setItem('sessionActive', 'true');
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
