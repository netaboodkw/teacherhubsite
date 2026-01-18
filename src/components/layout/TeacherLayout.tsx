import { useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { TeacherSidebar } from './TeacherSidebar';
import { Header } from './Header';
import { useUserRole, getUserRoleRedirectPath } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { useThemeStyle } from '@/contexts/ThemeContext';
import { GlassTeacherLayout } from './GlassTeacherLayout';

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: userRole, isLoading } = useUserRole();
  const themeStyle = useThemeStyle();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only teachers (role 'user' or no role) can access this layout
  // Redirect admins and department heads to their respective dashboards
  if (userRole?.role === 'admin' || userRole?.role === 'department_head') {
    const redirectPath = getUserRoleRedirectPath(userRole.role);
    return <Navigate to={redirectPath} replace />;
  }

  // Use Liquid Glass layout when theme is enabled
  if (themeStyle === 'liquid-glass') {
    return <GlassTeacherLayout>{children}</GlassTeacherLayout>;
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
