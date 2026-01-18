import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GraduationCap, Users, ClipboardCheck, BookOpen, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TodaySchedule } from '@/components/dashboard/TodaySchedule';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useThemeStyle } from '@/contexts/ThemeContext';
import { GlassButton } from '@/components/ui/glass-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';

export default function TeacherDashboard() {
  const { data: classrooms, isLoading: classroomsLoading } = useClassrooms();
  const themeStyle = useThemeStyle();
  const isGlass = themeStyle === 'liquid-glass';
  
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

  // Fetch subscription status
  const { data: subscription } = useQuery({
    queryKey: ['teacher-subscription-dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Determine if we should show the alert
  const showSubscriptionAlert = useMemo(() => {
    if (!subscription) return false;
    // Don't show alert for active paid subscriptions
    if (subscription.status === 'active' && !subscription.trial_ends_at) return false;
    // Show for trial or expired
    return subscription.status === 'trial' || subscription.status === 'expired';
  }, [subscription]);

  const subscriptionEndDate = useMemo(() => {
    if (!subscription) return null;
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      return format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: ar });
    }
    if (subscription.subscription_ends_at) {
      return format(new Date(subscription.subscription_ends_at), 'dd MMMM yyyy', { locale: ar });
    }
    return null;
  }, [subscription]);

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

  // Glass theme stat card
  const GlassStatCard = ({ stat }: { stat: typeof stats[0] }) => (
    <Link to={stat.href}>
      <GlassCard variant="interactive" className="h-full">
        <GlassCardHeader className="flex flex-row items-center justify-between pb-2">
          <GlassCardTitle className="text-sm font-medium text-muted-foreground">
            {stat.title}
          </GlassCardTitle>
          <div className={`p-2 rounded-xl ${stat.bgColor}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="text-3xl font-bold">{stat.value}</div>
        </GlassCardContent>
      </GlassCard>
    </Link>
  );

  // Default theme stat card
  const DefaultStatCard = ({ stat }: { stat: typeof stats[0] }) => (
    <Link to={stat.href}>
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
  );

  // Get hex color from classroom color
  const getHexColor = (color: string | null | undefined): string => {
    if (!color) return '#00b8d4';
    if (color.startsWith('#')) return color;
    const colorMap: { [key: string]: string } = {
      'bg-blue-500': '#3b82f6',
      'bg-yellow-500': '#eab308',
      'bg-teal-500': '#14b8a6',
      'bg-green-500': '#22c55e',
      'bg-red-500': '#ef4444',
      'bg-purple-500': '#a855f7',
      'bg-pink-500': '#ec4899',
      'bg-orange-500': '#f97316',
      'bg-indigo-500': '#6366f1',
      'bg-cyan-500': '#06b6d4',
      'bg-primary': '#00b8d4',
    };
    return colorMap[color] || '#00b8d4';
  };

  // Glass classroom card with proper coloring
  const GlassClassroomCardLocal = ({ classroom }: { classroom: any }) => {
    const hexColor = getHexColor(classroom.color);
    return (
      <Link to={`/teacher/classrooms/${classroom.id}`}>
        <GlassCard 
          variant="interactive" 
          className="h-full relative overflow-hidden"
          style={{
            backgroundColor: `${hexColor}10`,
            borderColor: `${hexColor}30`,
          }}
        >
          {/* Color indicator */}
          <div 
            className="absolute top-0 right-0 w-1.5 h-full rounded-r-xl"
            style={{ backgroundColor: hexColor }}
          />
          <GlassCardHeader className="pb-2 pr-4">
            <GlassCardTitle className="text-base truncate">
              {classroom.name}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="pr-4">
            <p className="text-sm text-muted-foreground truncate">{classroom.subject}</p>
          </GlassCardContent>
        </GlassCard>
      </Link>
    );
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* تنبيه الاشتراك - يظهر فقط للتجريبي أو المنتهي */}
        {showSubscriptionAlert && (
          <Alert variant={subscription?.status === 'expired' ? 'destructive' : 'default'} className={isGlass ? 'glass-card border-orange-200/50 bg-orange-50/50' : 'border-orange-200 bg-orange-50'}>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {subscription?.status === 'trial' ? (
                <>
                  أنت حالياً في <strong>الفترة التجريبية</strong>
                  {subscriptionEndDate && <> - تنتهي في <strong>{subscriptionEndDate}</strong></>}
                  <Link to="/teacher/subscription" className="mr-2 underline font-medium">
                    اشترك الآن
                  </Link>
                </>
              ) : (
                <>
                  انتهى اشتراكك. 
                  <Link to="/teacher/subscription" className="mr-2 underline font-medium">
                    جدد اشتراكك للاستمرار
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h1 className="text-2xl font-bold">مرحباً بك</h1>
          <p className="text-muted-foreground">إدارة صفوفك وطلابك</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            isGlass 
              ? <GlassStatCard key={stat.href} stat={stat} />
              : <DefaultStatCard key={stat.href} stat={stat} />
          ))}
        </div>

        {/* جدول اليوم وصفوفي */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* جدول اليوم */}
          <div className="lg:col-span-1">
            <TodaySchedule 
              classrooms={classrooms || []} 
            />
          </div>

          {/* صفوفي */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">صفوفي</h2>
              {isGlass ? (
                <Link to="/teacher/classrooms/new">
                  <GlassButton variant="ghost" size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    إضافة صف
                  </GlassButton>
                </Link>
              ) : (
                <Link to="/teacher/classrooms/new" className="text-primary hover:underline text-sm">
                  + إضافة صف
                </Link>
              )}
            </div>
            
            {classroomsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  isGlass ? (
                    <GlassCard key={i} className="animate-pulse">
                      <GlassCardContent className="h-32" />
                    </GlassCard>
                  ) : (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-32" />
                    </Card>
                  )
                ))}
              </div>
            ) : classrooms?.length === 0 ? (
              isGlass ? (
                <GlassCard>
                  <GlassCardContent className="py-8 text-center text-muted-foreground">
                    لا توجد صفوف. أنشئ صفاً جديداً للبدء.
                  </GlassCardContent>
                </GlassCard>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    لا توجد صفوف. أنشئ صفاً جديداً للبدء.
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {classrooms?.slice(0, 6).map((classroom) => (
                  isGlass 
                    ? <GlassClassroomCardLocal key={classroom.id} classroom={classroom} />
                    : <ClassroomCard key={classroom.id} classroom={classroom} basePath="/teacher" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
