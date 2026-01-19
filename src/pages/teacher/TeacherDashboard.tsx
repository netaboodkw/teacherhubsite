import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useProfile } from '@/hooks/useProfile';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GraduationCap, Users, ClipboardCheck, BookOpen, AlertTriangle, Plus, LayoutDashboard } from 'lucide-react';
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
import { PageHeader } from '@/components/common/PageHeader';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt';

export default function TeacherDashboard() {
  const { data: classrooms, isLoading: classroomsLoading } = useClassrooms();
  const { profile } = useProfile();
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

  // Glass theme stat card - mobile optimized
  const GlassStatCard = ({ stat }: { stat: typeof stats[0] }) => (
    <Link to={stat.href}>
      <GlassCard variant="interactive" className="h-full">
        <GlassCardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
          <GlassCardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {stat.title}
          </GlassCardTitle>
          <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${stat.bgColor}`}>
            <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
          </div>
        </GlassCardHeader>
        <GlassCardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stat.value}</div>
        </GlassCardContent>
      </GlassCard>
    </Link>
  );

  // Default theme stat card - mobile optimized
  const DefaultStatCard = ({ stat }: { stat: typeof stats[0] }) => (
    <Link to={stat.href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer ios-card-pressable">
        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {stat.title}
          </CardTitle>
          <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
            <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stat.value}</div>
        </CardContent>
      </Card>
    </Link>
  );

  // Get hex color from classroom color
  const getHexColor = (color: string | null | undefined): string => {
    if (!color) return '#888888';
    if (color.startsWith('#')) return color;
    const colorMap: { [key: string]: string } = {
      // Light variants (200)
      'bg-blue-200': '#93c5fd',
      'bg-yellow-200': '#fef08a',
      'bg-teal-200': '#99f6e4',
      'bg-green-200': '#bbf7d0',
      'bg-red-200': '#fecaca',
      'bg-purple-200': '#e9d5ff',
      'bg-pink-200': '#fbcfe8',
      'bg-orange-200': '#fed7aa',
      'bg-indigo-200': '#c7d2fe',
      'bg-cyan-200': '#a5f3fc',
      // Standard variants (500)
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
    return colorMap[color] || '#888888';
  };

  // Glass classroom card with proper coloring - mobile optimized
  const GlassClassroomCardLocal = ({ classroom }: { classroom: any }) => {
    const hexColor = getHexColor(classroom.color);
    return (
      <Link to={`/teacher/classrooms/${classroom.id}`}>
        <GlassCard 
          variant="interactive" 
          className="h-full relative overflow-hidden ios-card-pressable"
          style={{
            backgroundColor: `${hexColor}10`,
            borderColor: `${hexColor}30`,
          }}
        >
          {/* Color indicator */}
          <div 
            className="absolute top-0 right-0 w-1 sm:w-1.5 h-full rounded-r-xl"
            style={{ backgroundColor: hexColor }}
          />
          <GlassCardHeader className="p-3 sm:p-4 pb-1 sm:pb-2 pr-3 sm:pr-4">
            <GlassCardTitle className="text-sm sm:text-base truncate">
              {classroom.name}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-3 sm:p-4 pt-0 sm:pt-0 pr-3 sm:pr-4">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{classroom.subject}</p>
          </GlassCardContent>
        </GlassCard>
      </Link>
    );
  };

  return (
    <TeacherLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* تنبيه الاشتراك - يظهر فقط للتجريبي أو المنتهي */}
        {showSubscriptionAlert && (
          <Alert variant={subscription?.status === 'expired' ? 'destructive' : 'default'} className={
            `text-xs sm:text-sm ${isGlass ? 'glass-card border-orange-200/50 bg-orange-50/50' : 'border-orange-200 bg-orange-50'}`
          }>
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {subscription?.status === 'trial' ? (
                <>
                  أنت في <strong>الفترة التجريبية</strong>
                  {subscriptionEndDate && <> - تنتهي <strong>{subscriptionEndDate}</strong></>}
                  <Link to="/teacher/subscription" className="mr-2 underline font-medium">
                    اشترك الآن
                  </Link>
                </>
              ) : (
                <>
                  انتهى اشتراكك. 
                  <Link to="/teacher/subscription" className="mr-2 underline font-medium">
                    جدد اشتراكك
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <PageHeader
          icon={LayoutDashboard}
          title={`مرحباً ${profile?.full_name?.split(' ')[0] || 'بك'} 👋`}
          subtitle="إدارة صفوفك وطلابك"
          iconVariant="cyan"
        />

        {/* Stats Grid - 2x2 on mobile */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            isGlass 
              ? <GlassStatCard key={stat.href} stat={stat} />
              : <DefaultStatCard key={stat.href} stat={stat} />
          ))}
        </div>

        {/* جدول اليوم وصفوفي - Stack on mobile */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* صفوفي - Show first on mobile */}
          <div className="lg:col-span-2 order-2 lg:order-2">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold">صفوفي</h2>
              {isGlass ? (
                <Link to="/teacher/classrooms/new">
                  <GlassButton variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm h-8 sm:h-9">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">إضافة</span> صف
                  </GlassButton>
                </Link>
              ) : (
                <Link to="/teacher/classrooms/new" className="text-primary hover:underline text-xs sm:text-sm">
                  + إضافة صف
                </Link>
              )}
            </div>
            
            {classroomsLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  isGlass ? (
                    <GlassCard key={i} className="animate-pulse">
                      <GlassCardContent className="h-16 sm:h-20" />
                    </GlassCard>
                  ) : (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-16 sm:h-20" />
                    </Card>
                  )
                ))}
              </div>
            ) : classrooms?.length === 0 ? (
              isGlass ? (
                <GlassCard>
                  <GlassCardContent className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                    لا توجد صفوف. أنشئ صفاً جديداً للبدء.
                  </GlassCardContent>
                </GlassCard>
              ) : (
                <Card>
                  <CardContent className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                    لا توجد صفوف. أنشئ صفاً جديداً للبدء.
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {classrooms?.slice(0, 6).map((classroom) => (
                  isGlass 
                    ? <GlassClassroomCardLocal key={classroom.id} classroom={classroom} />
                    : <ClassroomCard key={classroom.id} classroom={classroom} basePath="/teacher" />
                ))}
              </div>
            )}
          </div>

          {/* جدول اليوم - Show second on mobile */}
          <div className="lg:col-span-1 order-1 lg:order-1">
            <TodaySchedule 
              classrooms={classrooms || []} 
            />
          </div>
        </div>
      </div>
      
      {/* Onboarding Tour for new users */}
      <OnboardingTour />
      
      {/* Notification Permission Prompt - shows once on first login */}
      <NotificationPermissionPrompt />
    </TeacherLayout>
  );
}
