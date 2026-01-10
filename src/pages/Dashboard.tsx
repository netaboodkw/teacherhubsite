import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { GraduationCap, Users, ClipboardCheck, TrendingUp, Plus, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: classrooms = [], isLoading: loadingClassrooms } = useClassrooms();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: attendance = [] } = useAttendance();
  
  const today = new Date().toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = students.length > 0 
    ? Math.round((presentCount / students.length) * 100) 
    : 0;

  const isLoading = loadingClassrooms || loadingStudents;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              مرحباً 👋
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {today}
            </p>
          </div>
          <Link to="/classrooms/new">
            <Button className="gradient-hero shadow-md hover:shadow-lg transition-shadow">
              <Plus className="w-4 h-4 ml-2" />
              صف جديد
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الصفوف"
            value={classrooms.length}
            subtitle="صف دراسي"
            icon={GraduationCap}
            variant="primary"
          />
          <StatCard
            title="إجمالي الطلاب"
            value={students.length}
            subtitle="طالب وطالبة"
            icon={Users}
            variant="secondary"
          />
          <StatCard
            title="الحضور اليوم"
            value={`${attendanceRate}%`}
            subtitle={`${presentCount} من ${students.length}`}
            icon={ClipboardCheck}
            trend={{ value: 5, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="متوسط الأداء"
            value="85%"
            subtitle="هذا الشهر"
            icon={TrendingUp}
            trend={{ value: 3, isPositive: true }}
            variant="accent"
          />
        </div>

        {/* Quick Actions & Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">الصفوف الدراسية</h2>
              <Link to="/classrooms" className="text-sm text-primary hover:underline">
                عرض الكل
              </Link>
            </div>
            {classrooms.length > 0 ? (
              <div className="grid gap-4">
                {classrooms.slice(0, 3).map((classroom) => (
                  <ClassroomCard key={classroom.id} classroom={classroom} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">لا توجد صفوف بعد</h3>
                <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء صفك الأول</p>
                <Link to="/classrooms/new">
                  <Button className="gradient-hero">
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء صف
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">إجراءات سريعة</h2>
            <div className="space-y-3">
              <Link to="/attendance" className="block">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10 text-success">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        تسجيل الحضور
                      </h4>
                      <p className="text-sm text-muted-foreground">سجل حضور الطلاب اليوم</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/grades" className="block">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        إدخال الدرجات
                      </h4>
                      <p className="text-sm text-muted-foreground">أضف درجات اختبار أو واجب</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/students/new" className="block">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        إضافة طالب
                      </h4>
                      <p className="text-sm text-muted-foreground">سجل طالب جديد</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
