import { useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { DepartmentHeadSidebar } from './DepartmentHeadSidebar';
import { DepartmentHeadHeader } from './DepartmentHeadHeader';
import { DepartmentHeadProvider, useDepartmentHeadContext } from '@/contexts/DepartmentHeadContext';
import { useDepartmentHeadProfile } from '@/hooks/useDepartmentHeads';
import { Loader2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DepartmentHeadViewLayoutProps {
  children: ReactNode;
  requireTeacher?: boolean;
  showTeacherSelector?: boolean;
}

function LayoutContent({ children, requireTeacher = true, showTeacherSelector = true }: DepartmentHeadViewLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile, isLoading } = useDepartmentHeadProfile();
  const { selectedTeacherId } = useDepartmentHeadContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth/department-head" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <DepartmentHeadSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <DepartmentHeadHeader onMenuClick={() => setSidebarOpen(true)} showTeacherSelector={showTeacherSelector} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {requireTeacher && !selectedTeacherId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">اختر معلماً</h3>
                <p className="text-muted-foreground">
                  الرجاء اختيار معلم من القائمة أعلاه لعرض بياناته
                </p>
              </CardContent>
            </Card>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export function DepartmentHeadViewLayout(props: DepartmentHeadViewLayoutProps) {
  return (
    <DepartmentHeadProvider>
      <LayoutContent {...props} />
    </DepartmentHeadProvider>
  );
}
