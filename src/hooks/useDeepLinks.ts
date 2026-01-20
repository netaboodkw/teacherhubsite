import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Hook to handle deep links for iOS/Android native apps
 * Supports both Universal Links (https://teacherhub.site/...) 
 * and Custom URL Schemes (teacherhub://...)
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
        let path = '';
        let searchParams = '';
        
        // Handle custom URL scheme (teacherhub://path)
        if (event.url.startsWith('teacherhub://')) {
          const urlWithoutScheme = event.url.replace('teacherhub://', '');
          const [pathPart, queryPart] = urlWithoutScheme.split('?');
          path = '/' + pathPart;
          searchParams = queryPart ? '?' + queryPart : '';
          console.log('Custom URL scheme detected:', path, searchParams);
        } 
        // Handle Universal Links (https://teacherhub.site/path)
        else {
          const url = new URL(event.url);
          path = url.pathname;
          searchParams = url.search;
          console.log('Universal Link detected:', path, searchParams);
        }
        
        // Handle payment callbacks
        if (path.includes('/teacher/subscription/success') || 
            path.includes('/subscription/success') ||
            path.includes('subscription/success')) {
          const params = new URLSearchParams(searchParams.replace('?', ''));
          const paymentId = params.get('paymentId') || params.get('Id');
          console.log('Payment success callback, paymentId:', paymentId);
          navigate(`/teacher/subscription/success${paymentId ? `?paymentId=${paymentId}` : searchParams}`);
        } else if (path.includes('/teacher/subscription/error') ||
                   path.includes('/subscription/error') ||
                   path.includes('subscription/error')) {
          console.log('Payment error callback');
          navigate(`/teacher/subscription/error${searchParams}`);
        } else if (path.includes('/teacher') || path.startsWith('/teacher')) {
          navigate(path + searchParams);
        } else if (path.includes('/auth') || path.startsWith('/auth')) {
          navigate(path + searchParams);
        } else if (path && path !== '/') {
          // Default: navigate to the path
          navigate(path + searchParams);
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
        
        // Fallback: try to extract path from URL string
        const universalMatch = event.url.match(/teacherhub\.site(.+)/);
        if (universalMatch) {
          navigate(universalMatch[1]);
          return;
        }
        
        // Fallback for custom scheme
        const schemeMatch = event.url.match(/teacherhub:\/\/(.+)/);
        if (schemeMatch) {
          navigate('/' + schemeMatch[1]);
        }
      }
    };

    // Listen for deep links when app is opened from a URL
    const listener = App.addListener('appUrlOpen', handleAppUrlOpen);

    // Also check if app was opened with a URL (cold start)
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        console.log('App launched with URL:', result.url);
        handleAppUrlOpen({ url: result.url });
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
}

export default useDeepLinks;
