import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { useDepartmentHeadContext } from '@/contexts/DepartmentHeadContext';
import { useSupervisedTeachers } from '@/hooks/useDepartmentHeads';
import { useTeacherClassrooms } from '@/hooks/useDepartmentHeadData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, ClipboardCheck, BookOpen, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function DashboardContent() {
  const { selectedTeacherId } = useDepartmentHeadContext();
  const { data: teachers = [] } = useSupervisedTeachers();
  const { data: classrooms = [], isLoading: loadingClassrooms } = useTeacherClassrooms(selectedTeacherId);

  const selectedTeacher = teachers.find((t: any) => t.user_id === selectedTeacherId);

  // Get student count
  const classroomIds = classrooms?.map((c: any) => c.id) || [];
  const { data: studentCount } = useQuery({
    queryKey: ['dh-students-count', classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return 0;
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('classroom_id', classroomIds);
      return count || 0;
    },
    enabled: classroomIds.length > 0,
  });

  const stats = [
    {
      title: 'الصفوف',
      value: classrooms?.length || 0,
      icon: GraduationCap,
      href: '/department-head/classrooms',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'الطلاب',
      value: studentCount ?? 0,
      icon: Users,
      href: '/department-head/students',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'الحضور',
      value: 'عرض',
      icon: ClipboardCheck,
      href: '/department-head/attendance',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'الدرجات',
      value: 'عرض',
      icon: BookOpen,
      href: '/department-head/grades',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {selectedTeacher ? `بيانات المعلم: ${selectedTeacher.full_name}` : 'لوحة المتابعة'}
        </h1>
        <p className="text-muted-foreground">عرض بيانات المعلم المحدد</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">الصفوف</h2>
        </div>
        
        {loadingClassrooms ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classrooms?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد صفوف لهذا المعلم
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms?.slice(0, 6).map((classroom: any) => (
              <Link key={classroom.id} to={`/department-head/classrooms/${classroom.id}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer border-t-4`} style={{ borderTopColor: classroom.color?.replace('bg-', '') || 'hsl(var(--primary))' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{classroom.subject}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DHDashboardNew() {
  return (
    <DepartmentHeadViewLayout>
      <DashboardContent />
    </DepartmentHeadViewLayout>
  );
}
