import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';
import { useApp } from '@/contexts/AppContext';
import { GraduationCap, Users, ClipboardCheck, TrendingUp, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { classrooms, students, attendance } = useApp();
  
  const today = new Date().toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]);
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = students.length > 0 
    ? Math.round((presentCount / students.length) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              مرحباً، أ. محمد 👋
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
            <div className="grid gap-4">
              {classrooms.slice(0, 3).map((classroom) => (
                <ClassroomCard key={classroom.id} classroom={classroom} />
              ))}
            </div>
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

            {/* Today's Schedule */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">جدول اليوم</h3>
              <div className="space-y-2">
                {[
                  { time: '08:00', class: 'الصف الأول - أ', subject: 'الرياضيات' },
                  { time: '09:00', class: 'الصف الثاني - ب', subject: 'العلوم' },
                  { time: '10:30', class: 'الصف الثالث - أ', subject: 'اللغة العربية' },
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-mono text-primary font-medium">{item.time}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.class}</p>
                      <p className="text-xs text-muted-foreground">{item.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
