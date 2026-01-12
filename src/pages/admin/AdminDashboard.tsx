import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeachers } from '@/hooks/useTeachers';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { GraduationCap, Users, BookOpen, Layers, Building2, CreditCard, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Hook to get recent teachers with full data
function useRecentTeachers(limit = 5) {
  return useQuery({
    queryKey: ['recent_teachers', limit],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          education_levels:education_level_id (name_ar),
          subjects:subject_id (name_ar)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return profiles;
    },
  });
}

// Hook to get department heads count
function useDepartmentHeadsCount() {
  return useQuery({
    queryKey: ['department_heads_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('department_heads')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });
}

// Hook to get active subscriptions count
function useActiveSubscriptionsCount() {
  return useQuery({
    queryKey: ['active_subscriptions_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('teacher_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
  });
}

export default function AdminDashboard() {
  const { data: teachers } = useTeachers();
  const { data: levels } = useEducationLevels();
  const { data: subjects } = useSubjects();
  const { data: recentTeachers } = useRecentTeachers();
  const { data: dhCount } = useDepartmentHeadsCount();
  const { data: activeSubsCount } = useActiveSubscriptionsCount();

  const stats = [
    {
      title: 'المعلمون المسجلون',
      value: teachers?.length || 0,
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'رؤساء الأقسام',
      value: dhCount || 0,
      icon: Building2,
      href: '/admin/users',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'الاشتراكات النشطة',
      value: activeSubsCount || 0,
      icon: CreditCard,
      href: '/admin/subscribers',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'المراحل التعليمية',
      value: levels?.length || 0,
      icon: GraduationCap,
      href: '/admin/education-levels',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'المواد الدراسية',
      value: subjects?.length || 0,
      icon: BookOpen,
      href: '/admin/subjects',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">مرحباً بك في لوحة الإدارة</h1>
          <p className="text-muted-foreground">إدارة المراحل التعليمية والمواد والمعلمين والاشتراكات</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.href + stat.title} to={stat.href}>
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Teachers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                أحدث المعلمين المسجلين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {recentTeachers?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا يوجد معلمون مسجلون</p>
                ) : (
                  <div className="space-y-4">
                    {recentTeachers?.map((teacher) => (
                      <div key={teacher.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={teacher.avatar_url || ''} />
                          <AvatarFallback>{teacher.full_name?.charAt(0) || 'م'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{teacher.full_name}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {teacher.school_name && (
                              <span className="text-xs text-muted-foreground">{teacher.school_name}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(teacher.education_levels as any)?.name_ar && (
                              <Badge variant="outline" className="text-xs">
                                {(teacher.education_levels as any).name_ar}
                              </Badge>
                            )}
                            {(teacher.subjects as any)?.name_ar && (
                              <Badge variant="secondary" className="text-xs">
                                {(teacher.subjects as any).name_ar}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(teacher.created_at), 'dd MMM', { locale: ar })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <Link to="/admin/users" className="block mt-4">
                <button className="w-full text-center text-sm text-primary hover:underline">
                  عرض جميع المعلمين ←
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5 text-blue-500" />
                <span>إدارة المستخدمين</span>
              </Link>
              <Link
                to="/admin/subscribers"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <CreditCard className="h-5 w-5 text-purple-500" />
                <span>إدارة المشتركين</span>
              </Link>
              <Link
                to="/admin/education-levels"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>إدارة المراحل التعليمية</span>
              </Link>
              <Link
                to="/admin/subjects"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <BookOpen className="h-5 w-5 text-green-500" />
                <span>إدارة المواد الدراسية</span>
              </Link>
              <Link
                to="/admin/grading-system"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Layers className="h-5 w-5 text-orange-500" />
                <span>إعداد نظام الدرجات</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
