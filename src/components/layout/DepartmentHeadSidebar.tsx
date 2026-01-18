import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Eye,
  Mail,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useSiteLogo } from '@/hooks/useSiteLogo';

interface DepartmentHeadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

import { GlassIcon } from '@/components/ui/glass-icon';

// Nav icon wrapper - uses GlassIcon for active state
interface NavIconProps {
  icon: LucideIcon;
  active?: boolean;
}

const NavIcon = ({ icon: Icon, active }: NavIconProps) => {
  if (active) {
    return <GlassIcon icon={Icon} variant="default" size="sm" className="flex-shrink-0" />;
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 text-muted-foreground flex-shrink-0">
      <Icon className="w-5 h-5" />
    </div>
  );
};

const navItems = [
  { href: '/department-head', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/department-head/invitations', icon: Mail, label: 'الدعوات' },
  { href: '/department-head/templates', icon: FileText, label: 'القوالب' },
  { href: '/department-head/classrooms', icon: GraduationCap, label: 'الفصول' },
  { href: '/department-head/students', icon: Users, label: 'الطلاب' },
  { href: '/department-head/grades', icon: BookOpen, label: 'الدرجات' },
  { href: '/department-head/reports', icon: BarChart3, label: 'التقارير' },
];

export function DepartmentHeadSidebar({ isOpen, onClose }: DepartmentHeadSidebarProps) {
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
      navigate('/auth/department-head');
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
                  <h1 className="font-bold text-lg text-foreground">رئيس القسم</h1>
                  <p className="text-xs text-muted-foreground">متابعة المعلمين</p>
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
                (item.href !== '/department-head' && location.pathname.startsWith(item.href));
              const linkContent = (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo transition-all duration-200",
                      collapsed && "justify-center px-2",
                      isActive 
                        ? "bg-blue-50/50 dark:bg-blue-950/30" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <NavIcon icon={item.icon} active={isActive} />
                    {!collapsed && <span className={cn(isActive && "text-foreground font-semibold")}>{item.label}</span>}
                  </Link>
                );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="left" className="font-cairo">
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
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full px-2 py-2.5 rounded-xl transition-all"
                  >
                    <NavIcon icon={LogOut} active={false} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-cairo">
                  <p>تسجيل الخروج</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium font-cairo text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <NavIcon icon={LogOut} active={false} />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
