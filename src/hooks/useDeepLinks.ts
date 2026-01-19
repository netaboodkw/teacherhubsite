import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Hook to handle deep links for iOS/Android native apps
 * Listens for appUrlOpen events and navigates to the appropriate route
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleAppUrlOpen = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        const path = url.pathname;
        const searchParams = url.search;
        
        // Handle payment callbacks
        if (path.includes('/teacher/subscription/success') || 
            path.includes('/subscription/success')) {
          const paymentId = url.searchParams.get('paymentId') || url.searchParams.get('Id');
          navigate(`/teacher/subscription/success${paymentId ? `?paymentId=${paymentId}` : searchParams}`);
        } else if (path.includes('/teacher/subscription/error') ||
                   path.includes('/subscription/error')) {
          navigate(`/teacher/subscription/error${searchParams}`);
        } else if (path.includes('/teacher')) {
          navigate(path + searchParams);
        } else if (path.includes('/auth')) {
          navigate(path + searchParams);
        } else {
          // Default: navigate to the path
          navigate(path + searchParams);
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
        
        // Fallback: try to extract path from URL string
        const match = event.url.match(/teacherhub\.site(.+)/);
        if (match) {
          navigate(match[1]);
        }
      }
    };

    // Listen for deep links when app is opened from a URL
    const listener = App.addListener('appUrlOpen', handleAppUrlOpen);

    // Also check if app was opened with a URL (cold start)
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleAppUrlOpen({ url: result.url });
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
}

export default useDeepLinks;
