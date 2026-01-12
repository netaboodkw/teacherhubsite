import { useAuth } from '@/hooks/useAuth';
import { useUserRole, getUserRoleRedirectPath } from '@/hooks/useUserRole';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDepartmentHeadRoute = location.pathname.startsWith('/department-head');
  const isTeacherRoute = location.pathname.startsWith('/teacher');

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate auth page based on route
    if (isAdminRoute) {
      return <Navigate to="/auth/admin" replace />;
    }
    if (isDepartmentHeadRoute) {
      return <Navigate to="/auth/department-head" replace />;
    }
    return <Navigate to="/auth/teacher" replace />;
  }

  const currentRole = userRole?.role;
  const correctPath = getUserRoleRedirectPath(currentRole);

  // Strict role enforcement - redirect to correct dashboard if accessing wrong panel
  if (isAdminRoute && currentRole !== 'admin') {
    return <Navigate to={correctPath} replace />;
  }

  if (isDepartmentHeadRoute && currentRole !== 'department_head') {
    return <Navigate to={correctPath} replace />;
  }

  if (isTeacherRoute && currentRole !== 'user' && currentRole !== null && currentRole !== undefined) {
    // If user has a role that's not 'user', redirect to their correct dashboard
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}
