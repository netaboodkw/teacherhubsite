import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Shield,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  FileText,
  LayoutDashboard,
  LogOut,
  Grid3X3,
  TreePine,
  Archive,
  UsersRound,
  CreditCard,
  Wand2,
  Mail,
  Bell,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSiteLogo } from '@/hooks/useSiteLogo';

interface AdminSidebarProps {
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
  { href: '/admin', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/admin/users', icon: UsersRound, label: 'إدارة المستخدمين' },
  { href: '/admin/curriculum-tree', icon: TreePine, label: 'المراحل والصفوف' },
  { href: '/admin/teachers', icon: Users, label: 'المعلمون' },
  { href: '/admin/archived-classrooms', icon: Archive, label: 'الصفوف المؤرشفة' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'الاشتراكات والمدفوعات' },
  { href: '/admin/emails', icon: Mail, label: 'إدارة الإيميلات' },
  { href: '/admin/notifications', icon: Bell, label: 'قوالب الإشعارات' },
  { href: '/admin/ai-content', icon: Wand2, label: 'إنشاء محتوى AI' },
];

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  const { signOut } = useAuth();
  const { logoUrl } = useSiteLogo();

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed.toString());
  }, [collapsed]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    } else {
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/auth/admin');
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
                  <h1 className="font-bold text-lg text-foreground">لوحة الإدارة</h1>
                  <p className="text-xs text-muted-foreground">إدارة النظام</p>
                </div>
              </div>
            )}
            {collapsed && (
              <img src={logoUrl} alt="Teacher Hub" className="w-10 h-10 object-contain" />
            )}
          </div>

          {/* Collapse Toggle Button */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex absolute -left-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
              >
                {collapsed ? (
                  <PanelRightOpen className="h-3.5 w-3.5" />
                ) : (
                  <PanelRightClose className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
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

          {/* Footer - Back to Teacher Panel */}
          <div className="p-2 border-t border-border space-y-1">
            <Link
              to="/teacher"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo transition-all",
                collapsed && "justify-center px-2"
              )}
            >
              <NavIcon icon={GraduationCap} active={false} />
              {!collapsed && <span className="text-muted-foreground">لوحة المعلم</span>}
            </Link>
            {collapsed ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/admin/settings"
                      className={cn(
                        "flex items-center justify-center px-2 py-2.5 rounded-xl transition-all",
                        location.pathname === '/admin/settings' ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                      )}
                    >
                      <NavIcon icon={Settings} active={location.pathname === '/admin/settings'} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="font-cairo">
                    <p>الإعدادات</p>
                  </TooltipContent>
                </Tooltip>
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
              </>
            ) : (
              <>
                <Link
                  to="/admin/settings"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo transition-all",
                    location.pathname === '/admin/settings' 
                      ? "bg-blue-50/50 dark:bg-blue-950/30" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <NavIcon icon={Settings} active={location.pathname === '/admin/settings'} />
                  <span className={cn(location.pathname === '/admin/settings' && "text-foreground font-semibold")}>الإعدادات</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium font-cairo text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <NavIcon icon={LogOut} active={false} />
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
