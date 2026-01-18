import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function ThemeToggle({ className, size = 'default' }: ThemeToggleProps) {
  const { isDark, setMode } = useTheme();

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "rounded-full transition-all duration-300",
        "hover:bg-muted/50",
        className
      )}
      aria-label={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
    >
      <Sun className={cn(
        iconSize,
        "rotate-0 scale-100 transition-all duration-300",
        isDark && "rotate-90 scale-0"
      )} />
      <Moon className={cn(
        iconSize,
        "absolute rotate-90 scale-0 transition-all duration-300",
        isDark && "rotate-0 scale-100"
      )} />
    </Button>
  );
}

export default ThemeToggle;
