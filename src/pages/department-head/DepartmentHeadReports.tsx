import { useNavigate } from 'react-router-dom';
import { useDepartmentHeadProfile } from '@/hooks/useDepartmentHeads';
import { useDepartmentHeadReports, TeacherStats } from '@/hooks/useDepartmentHeadReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, User, LogOut, Loader2, BarChart3, 
  School, BookOpen, GraduationCap, ClipboardCheck,
  ThumbsUp, ThumbsDown, TrendingUp, ArrowRight,
  LayoutDashboard
} from 'lucide-react';

function TeacherStatsCard({ teacher, onClick }: { teacher: TeacherStats; onClick: () => void }) {
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={teacher.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{teacher.full_name}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              {teacher.subject && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {teacher.subject}
                </span>
              )}
              {teacher.school_name && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <School className="h-3 w-3" />
                  {teacher.school_name}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-primary/5">
            <GraduationCap className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{teacher.classrooms_count}</p>
            <p className="text-xs text-muted-foreground">الفصول</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/5">
            <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-bold">{teacher.students_count}</p>
            <p className="text-xs text-muted-foreground">الطلاب</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/5">
            <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-bold">{teacher.grades_count}</p>
            <p className="text-xs text-muted-foreground">الدرجات</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/5">
            <ClipboardCheck className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-xl font-bold">{teacher.attendance_count}</p>
            <p className="text-xs text-muted-foreground">سجلات الحضور</p>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-3">
          {teacher.average_grade_percentage !== null && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">متوسط الدرجات</span>
                <span className="font-medium">{teacher.average_grade_percentage}%</span>
              </div>
              <Progress 
                value={teacher.average_grade_percentage} 
                className="h-2"
              />
            </div>
          )}

          {teacher.attendance_rate !== null && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">نسبة الحضور</span>
                <span className="font-medium">{teacher.attendance_rate}%</span>
              </div>
              <Progress 
                value={teacher.attendance_rate} 
                className="h-2"
              />
            </div>
          )}
        </div>

        {/* Behavior Notes Summary */}
        {teacher.behavior_notes_count > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">ملاحظات السلوك</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600">
                <ThumbsUp className="h-4 w-4" />
                {teacher.positive_notes_count}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <ThumbsDown className="h-4 w-4" />
                {teacher.negative_notes_count}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DepartmentHeadReports() {
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useDepartmentHeadProfile();
  const { data: teacherStats = [], isLoading: loadingStats } = useDepartmentHeadReports();

  const handleLogout = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    navigate('/auth/department-head');
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    navigate('/auth/department-head');
    return null;
  }

  // Calculate overall stats
  const totalClassrooms = teacherStats.reduce((sum, t) => sum + t.classrooms_count, 0);
  const totalStudents = teacherStats.reduce((sum, t) => sum + t.students_count, 0);
  const totalGrades = teacherStats.reduce((sum, t) => sum + t.grades_count, 0);
  const averageGrade = teacherStats.filter(t => t.average_grade_percentage !== null).length > 0
    ? Math.round(
        teacherStats
          .filter(t => t.average_grade_percentage !== null)
          .reduce((sum, t) => sum + (t.average_grade_percentage || 0), 0) /
        teacherStats.filter(t => t.average_grade_percentage !== null).length
      )
    : null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">تقارير الأداء</h1>
              <p className="text-sm text-muted-foreground">{profile.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/department-head')}>
              <LayoutDashboard className="h-4 w-4 ml-2" />
              لوحة التحكم
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teacherStats.length}</p>
                  <p className="text-sm text-muted-foreground">المعلمون</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalClassrooms}</p>
                  <p className="text-sm text-muted-foreground">الفصول</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <User className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">الطلاب</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <TrendingUp className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {averageGrade !== null ? `${averageGrade}%` : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">متوسط الأداء</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Stats */}
        <div>
          <h2 className="text-xl font-bold mb-4">أداء المعلمين</h2>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teacherStats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">لا يوجد معلمون</h3>
                <p className="text-muted-foreground">
                  عندما يرسل لك المعلمون دعوات وتقبلها، ستظهر تقاريرهم هنا
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teacherStats.map((teacher) => (
                <TeacherStatsCard
                  key={teacher.teacher_id}
                  teacher={teacher}
                  onClick={() => navigate(`/department-head/teacher/${teacher.teacher_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
