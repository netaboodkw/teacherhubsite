import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  BookOpen,
  MoreHorizontal,
  LogOut
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  CalendarDays, 
  ClipboardCheck, 
  LayoutGrid, 
  BarChart3, 
  CreditCard,
  Fingerprint,
  Settings,
  Bell
} from 'lucide-react';

import { GlassIcon } from '@/components/ui/glass-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Nav icon wrapper - uses GlassIcon for active state with color
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
  colorVariant?: "default" | "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "indigo" | "amber" | "rose" | "teal" | "success";
}

const NavIcon = ({ icon: Icon, active, colorVariant = "default" }: NavIconProps) => {
  if (active) {
    return <GlassIcon icon={Icon} variant={colorVariant} size="default" />;
  }
  return (
    <div className="flex items-center justify-center w-12 h-12 text-muted-foreground">
      <Icon className="w-7 h-7" />
    </div>
  );
};

// Main tabs with colors
const mainTabs = [
  { href: '/teacher', icon: LayoutDashboard, label: 'الرئيسية', color: 'cyan' as const },
  { href: '/teacher/classrooms', icon: School, label: 'الصفوف', color: 'purple' as const },
  { href: '/teacher/students', icon: Users, label: 'الطلاب', color: 'blue' as const },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات', color: 'indigo' as const },
];

// Additional items with colors
const moreItems = [
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص', color: 'pink' as const },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة', color: 'rose' as const },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات', color: 'purple' as const },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير', color: 'orange' as const },
  { href: '/teacher/notifications', icon: Bell, label: 'الإشعارات', color: 'amber' as const },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك', color: 'success' as const },
  { href: '/teacher/settings', icon: Settings, label: 'الإعدادات', color: 'teal' as const },
];

interface GlassBottomNavProps {
  className?: string;
}

export function GlassBottomNav({ className }: GlassBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === '/teacher') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some(item => isActive(item.href));

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-xl",
        "border-t border-border/40",
        className
      )}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      <div className="flex items-center justify-around h-[80px] px-2">
        {mainTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "min-w-[72px] min-h-[64px] py-2 px-3",
                "rounded-2xl transition-all duration-200",
                "active:scale-95 touch-manipulation",
                active && "bg-primary/10"
              )}
            >
              <NavIcon icon={tab.icon} active={active} colorVariant={tab.color} />
              <span className={cn(
                "text-xs font-cairo leading-tight",
                active ? "font-bold text-foreground" : "font-medium text-muted-foreground"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "min-w-[72px] min-h-[64px] py-2 px-3",
                "rounded-2xl transition-all duration-200",
                "active:scale-95 touch-manipulation",
                isMoreActive && "bg-primary/10"
              )}
            >
              <NavIcon icon={MoreHorizontal} active={isMoreActive} />
              <span className={cn(
                "text-xs font-cairo leading-tight",
                isMoreActive ? "font-bold text-foreground" : "font-medium text-muted-foreground"
              )}>
                المزيد
              </span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className={cn(
              "bg-background border-t border-border/50",
              "rounded-t-[32px]",
              "font-cairo"
            )}
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
            }}
          >
            <SheetHeader className="pb-6">
              <SheetTitle className="text-center text-xl text-foreground font-bold font-cairo">المزيد من الخيارات</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 py-4">
              {moreItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4",
                      "rounded-2xl transition-all duration-200",
                      "active:scale-95 min-h-[90px]",
                      active ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <NavIcon icon={item.icon} active={active} colorVariant={item.color} />
                    <span className={cn(
                      "text-sm text-center font-cairo leading-tight",
                      active ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            
            {/* Logout Button */}
            <div className="pt-6 border-t border-border/30">
              <button
                onClick={() => {
                  setSheetOpen(false);
                  handleLogout();
                }}
                className={cn(
                  "w-full flex items-center justify-center gap-4 p-5",
                  "rounded-2xl transition-all duration-200",
                  "bg-destructive/10 hover:bg-destructive/20",
                  "active:scale-95"
                )}
              >
                <LogOut className="w-6 h-6 text-destructive" />
                <span className="text-base font-bold text-destructive font-cairo">
                  تسجيل الخروج
                </span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
