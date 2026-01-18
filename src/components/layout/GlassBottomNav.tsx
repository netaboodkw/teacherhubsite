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

// Nav icon with unique color per tab
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
  gradient?: string;
}

const NavIcon = ({ icon: Icon, active, gradient }: NavIconProps) => (
  <div className={cn(
    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
    active ? `${gradient} text-white shadow-lg` : "text-muted-foreground"
  )}>
    <Icon className="w-5 h-5" />
  </div>
);

// Main tabs with unique gradients
const mainTabs = [
  { href: '/teacher', icon: LayoutDashboard, label: 'الرئيسية', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-500/25' },
  { href: '/teacher/classrooms', icon: School, label: 'الصفوف', gradient: 'bg-gradient-to-br from-violet-400 to-purple-500 shadow-violet-500/25' },
  { href: '/teacher/students', icon: Users, label: 'الطلاب', gradient: 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/25' },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/25' },
];

// Additional items with unique gradients
const moreItems = [
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص', gradient: 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-500/25' },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة', gradient: 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-pink-500/25' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'الحضور', gradient: 'bg-gradient-to-br from-green-400 to-teal-500 shadow-green-500/25' },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات', gradient: 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/25' },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير', gradient: 'bg-gradient-to-br from-indigo-400 to-blue-500 shadow-indigo-500/25' },
  { href: '/teacher/notifications', icon: Bell, label: 'الإشعارات', gradient: 'bg-gradient-to-br from-red-400 to-pink-500 shadow-red-500/25' },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك', gradient: 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-teal-500/25' },
  { href: '/teacher/settings', icon: Settings, label: 'الإعدادات', gradient: 'bg-gradient-to-br from-slate-400 to-gray-500 shadow-slate-500/25' },
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
              <NavIcon icon={tab.icon} active={active} gradient={tab.gradient} />
              <span className={cn(
                "text-[10px]",
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
              <NavIcon icon={MoreHorizontal} active={isMoreActive} gradient="bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-purple-500/25" />
              <span className={cn(
                "text-[10px]",
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
              "font-inherit"
            )}
          >
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center text-foreground font-semibold">المزيد من الخيارات</SheetTitle>
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
                    <NavIcon icon={item.icon} active={active} gradient={item.gradient} />
                    <span className={cn(
                      "text-xs text-center",
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
