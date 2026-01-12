import { useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Header } from './Header';
import { useUserRole, getUserRoleRedirectPath } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only admin can access this layout
  if (userRole?.role !== 'admin') {
    const redirectPath = getUserRoleRedirectPath(userRole?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
