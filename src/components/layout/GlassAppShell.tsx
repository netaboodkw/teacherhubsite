import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassAppShellProps {
  children: ReactNode;
  topBar?: ReactNode;
  bottomTabs?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export function GlassAppShell({
  children,
  topBar,
  bottomTabs,
  sidebar,
  className,
}: GlassAppShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col",
        "bg-background",
        // iOS safe area support
        "pt-[env(safe-area-inset-top)]",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      {/* Top Bar */}
      {topBar && (
        <header
          className={cn(
            "sticky top-0 z-50 w-full",
            "bg-background/70 backdrop-blur-xl",
            "border-b border-border/30",
            "pt-[env(safe-area-inset-top)]"
          )}
        >
          {topBar}
        </header>
      )}

      {/* Main content area */}
      <div className="flex flex-1 w-full">
        {/* Desktop Sidebar */}
        {sidebar && (
          <aside className="hidden lg:flex w-64 shrink-0">
            {sidebar}
          </aside>
        )}

        {/* Scrollable content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            "min-h-0", // Important for proper scrolling
            bottomTabs ? "pb-20" : "pb-4" // Space for bottom tabs
          )}
        >
          <div className="container max-w-6xl mx-auto px-4 py-4">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Tabs (Mobile) */}
      {bottomTabs && (
        <nav
          className={cn(
            "lg:hidden fixed bottom-0 left-0 right-0 z-50",
            "bg-background/80 backdrop-blur-xl",
            "border-t border-border/30",
            "pb-[env(safe-area-inset-bottom)]"
          )}
        >
          {bottomTabs}
        </nav>
      )}
    </div>
  );
}

interface GlassTopBarProps {
  title?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export function GlassTopBar({
  title,
  leftAction,
  rightAction,
  className,
}: GlassTopBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-14 px-4",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-[44px]">
        {leftAction}
      </div>

      {title && (
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-3 min-w-[44px] justify-end">
        {rightAction}
      </div>
    </div>
  );
}

interface GlassBottomTabsProps {
  children: ReactNode;
  className?: string;
}

export function GlassBottomTabs({ children, className }: GlassBottomTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-around h-16 px-2",
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassTabItemProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function GlassTabItem({
  icon,
  label,
  isActive,
  onClick,
}: GlassTabItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-3 py-2",
        "rounded-xl transition-all duration-200",
        "active:scale-95",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
