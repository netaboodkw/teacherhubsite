import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  School, 
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
  Settings,
  Bell
} from 'lucide-react';

// Nav icon with blue-teal gradient (matching reference design)
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
}

const NavIcon = ({ icon: Icon, active }: NavIconProps) => (
  <div className={cn(
    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
    active 
      ? "bg-gradient-to-br from-sky-300 via-blue-400 to-teal-400 text-white shadow-lg shadow-blue-400/30" 
      : "text-muted-foreground"
  )}>
    <Icon className="w-5 h-5" />
  </div>
);

// Main tabs
const mainTabs = [
  { href: '/teacher', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/teacher/classrooms', icon: School, label: 'الصفوف' },
  { href: '/teacher/students', icon: Users, label: 'الطلاب' },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات' },
];

// Additional items
const moreItems = [
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص' },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'الحضور' },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات' },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/teacher/notifications', icon: Bell, label: 'الإشعارات' },
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
      <div className="flex items-center justify-around h-16 px-2">
        {mainTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1",
                "rounded-xl transition-all duration-200",
                "active:scale-95"
              )}
            >
              <NavIcon icon={tab.icon} active={active} />
              <span className={cn(
                "text-[10px] font-cairo",
                active ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
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
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1",
                "rounded-xl transition-all duration-200",
                "active:scale-95"
              )}
            >
              <NavIcon icon={MoreHorizontal} active={isMoreActive} />
              <span className={cn(
                "text-[10px] font-cairo",
                isMoreActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
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
              "font-cairo"
            )}
          >
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center text-foreground font-semibold font-cairo">المزيد من الخيارات</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 py-4">
              {moreItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3",
                      "rounded-xl transition-all duration-200",
                      "active:scale-95",
                      active ? "bg-muted/50" : "hover:bg-muted/30"
                    )}
                  >
                    <NavIcon icon={item.icon} active={active} />
                    <span className={cn(
                      "text-xs text-center font-cairo",
                      active ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
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
