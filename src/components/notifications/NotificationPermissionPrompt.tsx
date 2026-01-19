import { useEffect, useState } from 'react';
import { Bell, X, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { cn } from '@/lib/utils';

interface NotificationPermissionPromptProps {
  onClose?: () => void;
}

export function NotificationPermissionPrompt({ onClose }: NotificationPermissionPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { requestLocalPermissions, requestPushPermissions, permissionGranted, isNative } = useNativeNotifications();

  useEffect(() => {
    // Check if we should show the prompt
    const hasSeenPrompt = localStorage.getItem('notification_prompt_seen');
    const shouldShow = !hasSeenPrompt && permissionGranted !== true;
    
    if (shouldShow) {
      // Delay showing for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [permissionGranted]);

  const handleEnable = async () => {
    try {
      if (isNative) {
        await requestPushPermissions();
      }
      await requestLocalPermissions();
      localStorage.setItem('notification_prompt_seen', 'true');
      handleClose();
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    localStorage.setItem('notification_prompt_seen', 'true');
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const handleLater = () => {
    localStorage.setItem('notification_prompt_seen', 'true');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[300] flex items-center justify-center p-4",
        "bg-black/50 backdrop-blur-sm",
        "transition-opacity duration-300",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={handleLater}
    >
      <div 
        className={cn(
          "w-full max-w-sm bg-background rounded-2xl shadow-2xl overflow-hidden",
          "transition-all duration-300",
          isAnimating ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header with Icon */}
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center">
          <button
            onClick={handleClose}
            className="absolute top-3 left-3 p-2 rounded-full hover:bg-background/50 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
            <BellRing className="w-8 h-8 text-primary animate-pulse" />
          </div>
          
          <h3 className="text-lg font-bold text-foreground">
            تفعيل الإشعارات
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            احصل على تنبيهات للحصص والمهام المهمة
          </p>
        </div>

        {/* Features */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-foreground">تذكير قبل بداية الحصص</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-foreground">تنبيهات المؤقتات والأنشطة</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-foreground">تذكير بصمة الحضور</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 pt-0 space-y-2">
          <Button 
            onClick={handleEnable}
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            <Bell className="w-5 h-5 ml-2" />
            تفعيل الإشعارات
          </Button>
          <button
            onClick={handleLater}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionPrompt;
