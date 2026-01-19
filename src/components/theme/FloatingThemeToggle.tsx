import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function FloatingThemeToggle() {
  const { isDark, setMode } = useTheme();
  const isMobile = useIsMobile();

  // Only show on mobile
  if (!isMobile) return null;

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "fixed top-4 left-4 z-[200]",
        "w-10 h-10 rounded-full",
        "bg-background/80 backdrop-blur-md",
        "border border-border/50",
        "shadow-lg shadow-black/10",
        "flex items-center justify-center",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95",
        "touch-manipulation"
      )}
      aria-label={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
    >
      <Sun className={cn(
        "h-5 w-5 text-amber-500 absolute",
        "transition-all duration-300",
        isDark ? "opacity-0 scale-0 rotate-90" : "opacity-100 scale-100 rotate-0"
      )} />
      <Moon className={cn(
        "h-5 w-5 text-primary absolute",
        "transition-all duration-300",
        isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"
      )} />
    </button>
  );
}

export default FloatingThemeToggle;
