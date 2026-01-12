import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole, getUserRoleRedirectPath } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface DepartmentHeadLayoutProps {
  children: ReactNode;
}

export function DepartmentHeadLayout({ children }: DepartmentHeadLayoutProps) {
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only department heads can access this layout
  if (userRole?.role !== 'department_head') {
    const redirectPath = getUserRoleRedirectPath(userRole?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
