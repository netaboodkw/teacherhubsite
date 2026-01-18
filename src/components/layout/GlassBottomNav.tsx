import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BookOpen,
  MoreHorizontal
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
  Settings
} from 'lucide-react';

// Glass Icon component for bottom nav
interface BottomNavGlassIconProps {
  icon: LucideIcon;
  active?: boolean;
  className?: string;
}

const BottomNavGlassIcon = ({ icon: Icon, active, className }: BottomNavGlassIconProps) => (
  <div className={cn(
    "relative p-2 rounded-xl transition-all duration-300",
    "backdrop-blur-sm",
    active 
      ? "bg-primary/20 text-primary shadow-[0_2px_12px_hsl(var(--primary)/0.3)] border border-primary/30" 
      : "bg-muted/30 text-muted-foreground border border-transparent",
    className
  )}>
    <Icon className={cn(
      "w-5 h-5 transition-transform duration-300",
      active && "scale-110"
    )} />
    {active && (
      <div className="absolute inset-0 rounded-xl bg-primary/10 blur-md -z-10" />
    )}
  </div>
);

// Main tabs shown in bottom navigation (max 5)
const mainTabs = [
  { href: '/teacher', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/teacher/classrooms', icon: GraduationCap, label: 'الصفوف' },
  { href: '/teacher/students', icon: Users, label: 'الطلاب' },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات' },
];

// Additional items shown in "More" sheet
const moreItems = [
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص' },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'الحضور' },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات' },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك' },
  { href: '/teacher/settings', icon: Settings, label: 'الإعدادات' },
];

interface GlassBottomNavProps {
  className?: string;
}

export function GlassBottomNav({ className }: GlassBottomNavProps) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === '/teacher') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some(item => isActive(item.href));

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-background/70 backdrop-blur-xl backdrop-saturate-150",
        "border-t border-border/30",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {mainTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[44px] px-2 py-1.5",
                "rounded-2xl transition-all duration-300 ease-out",
                "active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BottomNavGlassIcon icon={tab.icon} active={active} />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                active && "font-semibold text-primary"
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
                "flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[44px] px-2 py-1.5",
                "rounded-2xl transition-all duration-300 ease-out",
                "active:scale-95",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BottomNavGlassIcon icon={MoreHorizontal} active={isMoreActive} />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isMoreActive && "font-semibold text-primary"
              )}>
                المزيد
              </span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className={cn(
              "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
              "border-t border-border/30",
              "rounded-t-3xl",
              "pb-[env(safe-area-inset-bottom)]",
              "font-inherit"
            )}
          >
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center text-foreground font-semibold">المزيد من الخيارات</SheetTitle>
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
                      "flex flex-col items-center justify-center gap-2 p-3",
                      "rounded-2xl transition-all duration-300",
                      "active:scale-95",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <BottomNavGlassIcon icon={item.icon} active={active} />
                    <span className={cn(
                      "text-xs text-center",
                      active ? "font-semibold" : "font-medium"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
