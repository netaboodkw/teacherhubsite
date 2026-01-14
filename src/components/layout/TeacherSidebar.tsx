import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutGrid,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useSiteLogo } from '@/hooks/useSiteLogo';

interface TeacherSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/teacher', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/teacher/classrooms', icon: GraduationCap, label: 'الصفوف' },
  { href: '/teacher/students', icon: Users, label: 'الطلاب' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'الحضور' },
  { href: '/teacher/grades', icon: BookOpen, label: 'الدرجات' },
  { href: '/teacher/templates', icon: LayoutGrid, label: 'قوالب الدرجات' },
  { href: '/teacher/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/teacher/subscription', icon: CreditCard, label: 'الاشتراك والمدفوعات' },
];

export function TeacherSidebar({ isOpen, onClose }: TeacherSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { logoUrl } = useSiteLogo();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    } else {
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/auth/teacher');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 z-50 h-screen bg-card border-l border-border transform transition-all duration-300 lg:static lg:z-0",
        collapsed ? "w-16" : "w-72",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b border-border",
            collapsed && "justify-center"
          )}>
            {!collapsed && (
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Teacher Hub" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="font-bold text-lg text-foreground">Teacher Hub</h1>
                  <p className="text-xs text-muted-foreground">إدارة الصفوف</p>
                </div>
              </div>
            )}
            {collapsed && (
              <img src={logoUrl} alt="Teacher Hub" className="w-10 h-10 object-contain" />
            )}
          </div>

          {/* Collapse Button */}
          <div className="hidden lg:flex justify-center py-2 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full mx-2"
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
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/teacher' && location.pathname.startsWith(item.href));
              const linkContent = (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2",
                    isActive 
                      ? "gradient-hero text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>

          {/* Footer */}
          <div className="p-2 border-t border-border space-y-1">
            {collapsed ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/teacher/settings"
                      className="flex items-center justify-center px-2 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>الإعدادات</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center w-full px-2 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>تسجيل الخروج</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Link
                  to="/teacher/settings"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <span>الإعدادات</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
