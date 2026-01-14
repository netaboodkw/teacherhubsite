import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Classroom } from '@/hooks/useClassrooms';
import { getScheduleByEducationLevel, weekDays } from '@/lib/periodSchedules';

interface TodayScheduleProps {
  classrooms: Classroom[];
  educationLevelName?: string;
}

// الحصول على اليوم الحالي
const getCurrentDayKey = (): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

// تحويل الوقت للمقارنة
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export function TodaySchedule({ classrooms, educationLevelName }: TodayScheduleProps) {
  const currentDay = getCurrentDayKey();
  const currentDayName = weekDays.find(d => d.key === currentDay)?.name || '';
  const schedule = getScheduleByEducationLevel(educationLevelName);
  
  // فقط أيام العمل
  const isWorkDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].includes(currentDay);
  
  // الحصول على الحصص المجدولة لليوم
  const todayPeriods = useMemo(() => {
    if (!isWorkDay) return [];
    
    const classPeriods = schedule.periods.filter(p => !p.isBreak);
    
    return classPeriods.map(period => {
      // البحث عن الصف المجدول لهذه الحصة
      let scheduledClassroom: Classroom | null = null;
      
      for (const classroom of classrooms) {
        if (classroom.class_schedule) {
          const daySchedule = classroom.class_schedule[currentDay];
          if (Array.isArray(daySchedule) && daySchedule.includes(period.period)) {
            scheduledClassroom = classroom;
            break;
          }
        }
      }
      
      return {
        period,
        classroom: scheduledClassroom,
      };
    });
  }, [classrooms, currentDay, isWorkDay, schedule.periods]);

  // الحصة الحالية أو القادمة
  const { currentPeriodIndex, status } = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < todayPeriods.length; i++) {
      const period = todayPeriods[i].period;
      const startMinutes = timeToMinutes(period.startTime);
      const endMinutes = timeToMinutes(period.endTime);
      
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return { currentPeriodIndex: i, status: 'current' as const };
      }
      if (currentMinutes < startMinutes) {
        return { currentPeriodIndex: i, status: 'upcoming' as const };
      }
    }
    
    return { currentPeriodIndex: -1, status: 'ended' as const };
  }, [todayPeriods]);

  if (!isWorkDay) {
    return (
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            جدول اليوم
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-base">🎉 إجازة سعيدة!</p>
            <p className="text-xs mt-1">لا توجد حصص اليوم</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyClass = todayPeriods.some(p => p.classroom !== null);

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 min-w-0">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate">اليوم - {currentDayName}</span>
          </CardTitle>
          <Link 
            to="/teacher/schedule" 
            className="text-xs text-primary hover:underline flex items-center gap-0.5 shrink-0"
          >
            <span className="hidden xs:inline">الجدول</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        {!hasAnyClass ? (
          <div className="text-center py-3 text-muted-foreground">
            <p className="text-sm">لا توجد حصص مجدولة</p>
            <Link to="/teacher/schedule" className="text-primary hover:underline text-xs">
              إضافة جدول
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {todayPeriods.map((item, index) => {
              const isCurrent = index === currentPeriodIndex && status === 'current';
              const isNext = index === currentPeriodIndex && status === 'upcoming';
              const isPast = status === 'ended' || (currentPeriodIndex > -1 && index < currentPeriodIndex);
              
              return (
                <div
                  key={item.period.period}
                  className={cn(
                    "flex items-center gap-2 p-1.5 sm:p-2 rounded-lg transition-colors",
                    isCurrent && "bg-primary/10 border border-primary/30",
                    isNext && "bg-amber-500/10 border border-amber-500/30",
                    isPast && "opacity-40",
                    !isCurrent && !isNext && !isPast && "hover:bg-muted/50"
                  )}
                >
                  {/* رقم الحصة */}
                  <div className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0",
                    isCurrent ? "bg-primary text-primary-foreground" :
                    isNext ? "bg-amber-500 text-white" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {item.period.period}
                  </div>
                  
                  {/* معلومات الحصة */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.classroom ? (
                        <Link 
                          to={`/teacher/classroom/${item.classroom.id}`}
                          className="font-medium text-xs sm:text-sm hover:text-primary truncate max-w-[100px] sm:max-w-[140px]"
                        >
                          {item.classroom.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">الآن</Badge>
                      )}
                      {isNext && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-amber-500/20 text-amber-700">التالية</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* الوقت */}
                  <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
                    <Clock className="w-3 h-3 hidden sm:block" />
                    <span className="font-mono">{item.period.startTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
