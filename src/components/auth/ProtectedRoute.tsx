import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
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

  // Strict role enforcement - redirect to login page for that role (not their own dashboard)
  // This allows users to switch accounts by logging in with a different account
  
  if (isAdminRoute && currentRole !== 'admin') {
    // Non-admin trying to access admin routes - redirect to admin login
    return <Navigate to="/auth/admin" replace />;
  }

  if (isDepartmentHeadRoute && currentRole !== 'department_head') {
    // Non-department head trying to access department head routes - redirect to department head login
    return <Navigate to="/auth/department-head" replace />;
  }

  if (isTeacherRoute && (currentRole === 'admin' || currentRole === 'department_head')) {
    // Admin or department head trying to access teacher routes - redirect to teacher login
    return <Navigate to="/auth/teacher" replace />;
  }

  return <>{children}</>;
}
