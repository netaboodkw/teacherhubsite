import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export interface InAppBrowserOptions {
  url: string;
  onClose?: () => void;
}

/**
 * Hook to handle in-app browser for payment flows
 * Uses Capacitor Browser plugin for native platforms
 */
export function useInAppBrowser() {
  const openInAppBrowser = async ({ url, onClose }: InAppBrowserOptions): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // For web, redirect normally
      window.location.href = url;
      return true;
    }

    try {
      // Open in-app browser (Safari View Controller on iOS, Chrome Custom Tab on Android)
      await Browser.open({ 
        url,
        presentationStyle: 'fullscreen',
        toolbarColor: '#0f172a',
      });

      // Listen for browser close
      if (onClose) {
        const closeListener = await Browser.addListener('browserFinished', () => {
          onClose();
          closeListener.remove();
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to open in-app browser:', error);
      // Fallback to external browser
      window.open(url, '_blank');
      return false;
    }
  };

  const closeInAppBrowser = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.close();
      } catch (error) {
        console.error('Failed to close browser:', error);
      }
    }
  };

  return {
    openInAppBrowser,
    closeInAppBrowser,
    isNative: Capacitor.isNativePlatform(),
  };
}

export default useInAppBrowser;
