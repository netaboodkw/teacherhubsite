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
  Settings
} from 'lucide-react';

// Nav icon with unique color per tab
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
  color?: string;
  bgColor?: string;
}

const NavIcon = ({ icon: Icon, active, color, bgColor }: NavIconProps) => (
  <div className={cn(
    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
    active ? bgColor : "text-muted-foreground"
  )}>
    <Icon className={cn("w-5 h-5", active && color)} />
  </div>
);

// Main tabs with unique colors
const mainTabs = [
  { href: '/teacher', icon: LayoutDashboard, label: 'الرئيسية', color: 'text-cyan-500', bgColor: 'bg-cyan-500/15' },
  { href: '/teacher/classrooms', icon: School, label: 'الصفوف', color: 'text-violet-500', bgColor: 'bg-violet-500/15' },
  { href: '/teacher/students', icon: Users, label: 'الطلاب', color: 'text-emerald-500', bgColor: 'bg-emerald-500/15' },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات', color: 'text-amber-500', bgColor: 'bg-amber-500/15' },
];

// Additional items with unique colors
const moreItems = [
  { href: '/teacher/schedule', icon: CalendarDays, label: 'جدول الحصص', color: 'text-blue-500', bgColor: 'bg-blue-500/15' },
  { href: '/teacher/fingerprint', icon: Fingerprint, label: 'البصمة', color: 'text-pink-500', bgColor: 'bg-pink-500/15' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'الحضور', color: 'text-green-500', bgColor: 'bg-green-500/15' },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات', color: 'text-orange-500', bgColor: 'bg-orange-500/15' },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير', color: 'text-indigo-500', bgColor: 'bg-indigo-500/15' },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك', color: 'text-teal-500', bgColor: 'bg-teal-500/15' },
  { href: '/teacher/settings', icon: Settings, label: 'الإعدادات', color: 'text-slate-500', bgColor: 'bg-slate-500/15' },
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
              <NavIcon icon={tab.icon} active={active} color={tab.color} bgColor={tab.bgColor} />
              <span className={cn(
                "text-[10px]",
                active ? `font-semibold ${tab.color}` : "font-medium text-muted-foreground"
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
              <NavIcon icon={MoreHorizontal} active={isMoreActive} color="text-purple-500" bgColor="bg-purple-500/15" />
              <span className={cn(
                "text-[10px]",
                isMoreActive ? "font-semibold text-purple-500" : "font-medium text-muted-foreground"
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
                      active
                        ? `${item.bgColor}`
                        : "hover:bg-muted/50"
                    )}
                  >
                    <NavIcon icon={item.icon} active={active} color={item.color} bgColor={item.bgColor} />
                    <span className={cn(
                      "text-xs text-center",
                      active ? `font-semibold ${item.color}` : "font-medium text-muted-foreground"
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
