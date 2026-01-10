import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeachers } from '@/hooks/useTeachers';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { GraduationCap, Users, BookOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: teachers } = useTeachers();
  const { data: levels } = useEducationLevels();
  const { data: subjects } = useSubjects();

  const stats = [
    {
      title: 'المراحل التعليمية',
      value: levels?.length || 0,
      icon: GraduationCap,
      href: '/admin/education-levels',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'المواد الدراسية',
      value: subjects?.length || 0,
      icon: BookOpen,
      href: '/admin/subjects',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'المعلمون المسجلون',
      value: teachers?.length || 0,
      icon: Users,
      href: '/admin/teachers',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">مرحباً بك في لوحة الإدارة</h1>
          <p className="text-muted-foreground">إدارة المراحل التعليمية والمواد والمعلمين</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
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
              <Link
                to="/admin/teachers"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5 text-blue-500" />
                <span>عرض المعلمين المسجلين</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
