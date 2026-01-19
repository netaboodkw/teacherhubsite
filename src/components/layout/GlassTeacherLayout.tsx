import React from 'react';
import { cn } from '@/lib/utils';
import { GlassBottomNav } from './GlassBottomNav';
import { GlassTopBar } from './GlassAppShell';
import { Menu, Bell, User, LucideIcon, School, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { GlassIcon } from '@/components/ui/glass-icon';

// Nav icon wrapper - uses GlassIcon for active state with color
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
  colorVariant?: "default" | "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "indigo" | "amber" | "rose" | "teal" | "success";
}

const NavIcon = ({ icon: Icon, active, colorVariant = "default" }: NavIconProps) => {
  if (active) {
    return <GlassIcon icon={Icon} variant={colorVariant} size="sm" />;
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors">
      <Icon className="w-5 h-5" />
    </div>
  );
};

const navItems = [
  { href: '/teacher', icon: LayoutDashboard, label: 'لوحة التحكم', color: 'cyan' as const },
  { href: '/teacher/classrooms', icon: School, label: 'الصفوف', color: 'purple' as const },
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص', color: 'pink' as const },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة', color: 'rose' as const },
  { href: '/teacher/students', icon: Users, label: 'الطلاب', color: 'blue' as const },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات', color: 'indigo' as const },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات', color: 'purple' as const },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير', color: 'orange' as const },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك والمدفوعات', color: 'success' as const },
];

interface GlassTeacherLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  hidePadding?: boolean;
}

export function GlassTeacherLayout({ children, hideHeader, hidePadding }: GlassTeacherLayoutProps) {
  const { logoUrl } = useSiteLogo();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

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
      {/* Top Bar - iOS Native Style with Enhanced Status Bar Blur */}
      {!hideHeader && (
        <header
          className={cn(
            "z-50 w-full lg:hidden",
            "bg-background/60 backdrop-blur-2xl backdrop-saturate-200",
            "border-b border-border/10",
            "pt-[env(safe-area-inset-top)]"
          )}
        >
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              <h1 className="text-xl font-bold text-foreground">Teacher Hub</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle size="default" />
              <NotificationBell />
              <Link to="/teacher/settings">
                <Button variant="ghost" size="icon" className="rounded-full h-11 w-11">
                  <User className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

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
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo",
                    "transition-all duration-200",
                    collapsed && "justify-center px-2",
                    active 
                      ? "bg-blue-50/50 dark:bg-blue-950/30" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <NavIcon icon={item.icon} active={active} colorVariant={item.color} />
                  {!collapsed && <span className={cn("truncate", active && "text-foreground font-semibold")}>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="left" className="rounded-xl bg-popover border-border font-cairo">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-border/30 space-y-1">
            <Link 
              to="/teacher/settings"
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo",
                "transition-all duration-200",
                collapsed && "justify-center px-2",
                location.pathname.includes('/settings')
                  ? "bg-blue-50/50 dark:bg-blue-950/30" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <NavIcon icon={Settings} active={location.pathname.includes('/settings')} />
              {!collapsed && <span className={cn(location.pathname.includes('/settings') && "text-foreground font-semibold")}>الإعدادات</span>}
            </Link>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo w-full",
                "transition-all duration-200",
                collapsed && "justify-center px-2",
                "text-destructive hover:bg-destructive/10"
              )}
            >
              <div className="flex items-center justify-center w-10 h-10 text-destructive group-hover:text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              {!collapsed && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </aside>

        {/* Scrollable content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain ios-scroll",
            "min-h-0",
            "pb-28 lg:pb-8" // Extra padding for larger bottom nav on mobile
          )}
        >
          <FadeTransition>
            <div className={cn(
              "container max-w-6xl mx-auto lg:py-6",
              hidePadding ? "" : "px-4 py-5"
            )}>
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
