import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, ClipboardCheck, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TeacherDashboard() {
  const { data: classrooms, isLoading: classroomsLoading } = useClassrooms();
  
  // Get student count directly from active classrooms instead of fetching all students
  const classroomIds = useMemo(() => classrooms?.map(c => c.id) || [], [classrooms]);
  
  const { data: studentCount } = useQuery({
    queryKey: ['students-count', classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return 0;
      
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('classroom_id', classroomIds);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: classroomIds.length > 0,
  });

  const stats = [
    {
      title: 'الصفوف',
      value: classrooms?.length || 0,
      icon: GraduationCap,
      href: '/teacher/classrooms',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'الطلاب',
      value: studentCount ?? 0,
      icon: Users,
      href: '/teacher/students',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'الحضور',
      value: 'اليوم',
      icon: ClipboardCheck,
      href: '/teacher/attendance',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'الدرجات',
      value: 'إدخال',
      icon: BookOpen,
      href: '/teacher/grades',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">مرحباً بك</h1>
          <p className="text-muted-foreground">إدارة صفوفك وطلابك</p>
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
            <h2 className="text-xl font-semibold">صفوفي</h2>
            <Link to="/teacher/classrooms/new" className="text-primary hover:underline text-sm">
              + إضافة صف
            </Link>
          </div>
          
          {classroomsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32" />
                </Card>
              ))}
            </div>
          ) : classrooms?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                لا توجد صفوف. أنشئ صفاً جديداً للبدء.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classrooms?.slice(0, 6).map((classroom) => (
                <ClassroomCard key={classroom.id} classroom={classroom} basePath="/teacher" />
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
