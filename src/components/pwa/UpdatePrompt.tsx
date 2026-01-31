import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates on page load
      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's already a waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowPrompt(true);
        }

        // Listen for new service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setWaitingWorker(newWorker);
                setShowPrompt(true);
              }
            });
          }
        });
      });

      // Check for updates periodically (every 60 seconds)
      const checkInterval = setInterval(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update().catch(console.error);
        });
      }, 60 * 1000);

      // Listen for controller change (when skipWaiting is called)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      // Tell the waiting service worker to take over
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowPrompt(false);
  }, [waitingWorker]);

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">تحديث جديد متاح</p>
            <p className="text-xs opacity-90 mt-1">
              يتوفر إصدار جديد من التطبيق. قم بالتحديث للحصول على أحدث الميزات.
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleUpdate}
                className="flex-1"
              >
                تحديث الآن
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
