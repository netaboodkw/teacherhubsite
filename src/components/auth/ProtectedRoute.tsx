import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useUserRole';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (authLoading || (user && profileLoading) || (user && roleLoading)) {
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
    const authPath = isAdminRoute ? '/auth/admin' : '/auth/teacher';
    return <Navigate to={authPath} replace />;
  }

  // Redirect to complete profile if not complete (except if already on that page)
  if (user && profile && !isProfileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Check admin access for admin routes
  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/teacher" replace />;
  }

  return <>{children}</>;
}
