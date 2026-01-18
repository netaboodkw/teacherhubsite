import React from 'react';
import { cn } from '@/lib/utils';
import { GlassBottomNav } from './GlassBottomNav';
import { GlassTopBar } from './GlassAppShell';
import { Menu, Bell, User, LucideIcon, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { Link, useLocation } from 'react-router-dom';
import { FadeTransition } from '@/components/transitions/PageTransition';
import {
  LayoutDashboard,
  CalendarDays,
  Fingerprint,
  Users,
  ClipboardCheck,
  BookOpen,
  LayoutGrid,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Simplified nav icon - just icon with minimal styling
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
}

const NavIcon = ({ icon: Icon, active }: NavIconProps) => (
  <div className={cn(
    "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
    active 
      ? "bg-primary/15 text-primary" 
      : "text-muted-foreground group-hover:text-foreground"
  )}>
    <Icon className="w-5 h-5" />
  </div>
);

const navItems = [
  { href: '/teacher', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/teacher/classrooms', icon: School, label: 'الصفوف' },
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص' },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة' },
  { href: '/teacher/students', icon: Users, label: 'الطلاب' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'الحضور' },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات' },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات' },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك والمدفوعات' },
];

interface GlassTeacherLayoutProps {
  children: React.ReactNode;
}

export function GlassTeacherLayout({ children }: GlassTeacherLayoutProps) {
  const { logoUrl } = useSiteLogo();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const isActive = (href: string) => {
    if (href === '/teacher') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      dir="rtl"
      className={cn(
        "min-h-screen w-full flex flex-col",
        "bg-background",
        "pt-[env(safe-area-inset-top)]",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      {/* Top Bar */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full lg:hidden",
          "bg-background/70 backdrop-blur-xl backdrop-saturate-150",
          "border-b border-border/30",
          "pt-[env(safe-area-inset-top)]"
        )}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-semibold text-foreground">Teacher Hub</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle size="sm" />
            <NotificationBell />
            <Link to="/teacher/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 w-full">
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "hidden lg:flex flex-col h-[calc(100vh-env(safe-area-inset-top))] sticky top-0",
            "bg-background/70 backdrop-blur-xl backdrop-saturate-150",
            "border-l border-border/30",
            "transition-all duration-300",
            collapsed ? "w-20" : "w-72"
          )}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b border-border/30",
            collapsed && "justify-center"
          )}>
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-foreground">Teacher Hub</h1>
                <p className="text-xs text-muted-foreground">إدارة الصفوف</p>
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <div className="flex justify-center py-2 border-b border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full mx-2 rounded-xl"
            >
              {collapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 ml-2" />
                  <span>تصغير</span>
                </>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const linkContent = (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                    "transition-all duration-200",
                    collapsed && "justify-center px-2",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <NavIcon icon={item.icon} active={active} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="left" className="rounded-xl bg-popover border-border">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-border/30">
            <Link 
              to="/teacher/settings"
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-200",
                collapsed && "justify-center px-2",
                location.pathname.includes('/settings')
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <NavIcon icon={Settings} active={location.pathname.includes('/settings')} />
              {!collapsed && <span>الإعدادات</span>}
            </Link>
          </div>
        </aside>

        {/* Scrollable content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            "min-h-0",
            "pb-24 lg:pb-8" // Extra padding for bottom nav on mobile
          )}
        >
          <FadeTransition>
            <div className="container max-w-6xl mx-auto px-4 py-4 lg:py-6">
              {children}
            </div>
          </FadeTransition>
        </main>
      </div>

      {/* Bottom Tabs (Mobile) */}
      <GlassBottomNav />
    </div>
  );
}
