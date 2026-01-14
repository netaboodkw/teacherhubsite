import { useMemo, useState, useRef } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms, type Classroom } from '@/hooks/useClassrooms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Filter, GraduationCap, Printer } from 'lucide-react';
import { educationSchedules, getScheduleByEducationLevel, weekDays, type EducationSchedule } from '@/lib/periodSchedules';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';

export default function TeacherSchedule() {
  const { data: classrooms, isLoading } = useClassrooms();
  const { profile } = useProfile();
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');

  const handlePrint = () => {
    window.print();
  };

  // Get unique education levels from classrooms
  const educationLevels = useMemo(() => {
    if (!classrooms) return [];
    const levels = new Map<string, { id: string; name: string; name_ar: string }>();
    classrooms.forEach(c => {
      if (c.education_level) {
        levels.set(c.education_level.id, c.education_level);
      }
    });
    return Array.from(levels.values());
  }, [classrooms]);

  // Filter classrooms based on selection
  const filteredClassrooms = useMemo(() => {
    if (!classrooms) return [];
    let filtered = classrooms;
    
    if (selectedEducationLevel !== 'all') {
      filtered = filtered.filter(c => c.education_level?.id === selectedEducationLevel);
    }
    
    if (selectedClassroom !== 'all') {
      filtered = filtered.filter(c => c.id === selectedClassroom);
    }
    
    return filtered;
  }, [classrooms, selectedClassroom, selectedEducationLevel]);

  // Get the schedule for the selected education level
  const currentSchedule: EducationSchedule = useMemo(() => {
    if (selectedEducationLevel !== 'all') {
      const level = educationLevels.find(l => l.id === selectedEducationLevel);
      return getScheduleByEducationLevel(level?.name_ar || level?.name);
    }
    // Default to first classroom's education level or elementary
    if (filteredClassrooms.length > 0 && filteredClassrooms[0].education_level) {
      return getScheduleByEducationLevel(filteredClassrooms[0].education_level.name_ar);
    }
    return educationSchedules[0];
  }, [selectedEducationLevel, educationLevels, filteredClassrooms]);

  // Build the schedule grid
  const scheduleGrid = useMemo(() => {
    const grid: { [periodIndex: number]: { [day: string]: Classroom[] } } = {};
    
    // Only include non-break periods
    const classPeriods = currentSchedule.periods.filter(p => !p.isBreak);
    
    classPeriods.forEach((_, index) => {
      grid[index] = {};
      weekDays.forEach(day => {
        grid[index][day.key] = [];
      });
    });

    filteredClassrooms.forEach(classroom => {
      if (!classroom.class_schedule) return;
      
      Object.entries(classroom.class_schedule).forEach(([day, periods]) => {
        if (!Array.isArray(periods)) return;
        periods.forEach(period => {
          // Find the index in classPeriods (non-break periods)
          const periodIndex = classPeriods.findIndex(p => p.period === period);
          if (periodIndex !== -1 && grid[periodIndex] && grid[periodIndex][day]) {
            grid[periodIndex][day].push(classroom);
          }
        });
      });
    });

    return grid;
  }, [filteredClassrooms, currentSchedule]);

  const classPeriods = currentSchedule.periods.filter(p => !p.isBreak);

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="p-4 lg:p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-hero">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">جدول الحصص</h1>
                <p className="text-muted-foreground">عرض الجدول الأسبوعي لجميع الصفوف</p>
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة الجدول
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={selectedEducationLevel} onValueChange={setSelectedEducationLevel}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="المرحلة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المراحل</SelectItem>
                {educationLevels.map(level => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-[200px]">
                <GraduationCap className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {classrooms?.filter(c => 
                  selectedEducationLevel === 'all' || c.education_level?.id === selectedEducationLevel
                ).map(classroom => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">جدول الحصص الأسبوعي</h1>
          <p className="text-lg">{currentSchedule.levelNameAr}</p>
          {profile?.school_name && <p className="text-muted-foreground">{profile.school_name}</p>}
          {profile?.full_name && <p className="text-muted-foreground">المعلم: {profile.full_name}</p>}
        </div>

        {/* Period Times Card */}
        <Card className="print:shadow-none print:border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg print:text-xl">
              <Clock className="w-5 h-5 print:hidden" />
              أوقات الحصص - {currentSchedule.levelNameAr}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {currentSchedule.periods.map((period, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg text-center text-sm",
                    period.isBreak 
                      ? "bg-muted/50 text-muted-foreground" 
                      : "bg-primary/5 border border-primary/20"
                  )}
                >
                  <div className="font-medium">{period.nameAr}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {period.startTime} - {period.endTime}
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {period.duration} دقيقة
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card className="print:shadow-none print:border-0">
          <CardHeader className="print:pb-2">
            <CardTitle className="flex items-center gap-2 print:text-xl">
              <Calendar className="w-5 h-5 print:hidden" />
              الجدول الأسبوعي
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[600px] border-collapse print:min-w-0 print:text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/50 p-3 text-right font-medium">
                    الحصة
                  </th>
                  {weekDays.map(day => (
                    <th key={day.key} className="border border-border bg-muted/50 p-3 text-center font-medium">
                      {day.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classPeriods.map((period, periodIndex) => (
                  <tr key={periodIndex}>
                    <td className="border border-border bg-muted/30 p-3">
                      <div className="font-medium">{period.nameAr}</div>
                      <div className="text-xs text-muted-foreground">
                        {period.startTime} - {period.endTime}
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const cellClassrooms = scheduleGrid[periodIndex]?.[day.key] || [];
                      return (
                        <td key={day.key} className="border border-border p-2 align-top">
                          {cellClassrooms.length > 0 ? (
                            <div className="space-y-1">
                              {cellClassrooms.map(classroom => (
                                <div
                                  key={classroom.id}
                                  className="p-2 rounded-lg text-xs"
                                  style={{ 
                                    backgroundColor: `${classroom.color}20`,
                                    borderRight: `3px solid ${classroom.color}`
                                  }}
                                >
                                  <div className="font-medium truncate">{classroom.name}</div>
                                  <div className="text-muted-foreground truncate">{classroom.subject}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground text-xs py-2">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Legend */}
        {filteredClassrooms.length > 0 && (
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">دليل الألوان</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 print:gap-2">
                {filteredClassrooms.map(classroom => (
                  <div
                    key={classroom.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border print:px-2 print:py-1 print:text-sm"
                    style={{ borderColor: classroom.color }}
                  >
                    <div
                      className="w-4 h-4 rounded print:w-3 print:h-3"
                      style={{ backgroundColor: classroom.color }}
                    />
                    <span className="text-sm font-medium">{classroom.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredClassrooms.length === 0 && (
          <Card className="print:hidden">
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد صفوف</h3>
              <p className="text-muted-foreground">
                قم بإضافة صفوف وتحديد جدول الحصص لعرضها هنا
              </p>
            </CardContent>
          </Card>
        )}

        {/* Print Footer */}
        <div className="hidden print:block text-center mt-8 pt-4 border-t text-sm text-muted-foreground">
          <p>تم الطباعة بتاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>
    </TeacherLayout>
  );
}
