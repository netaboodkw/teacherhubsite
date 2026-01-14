import { useMemo, useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms, type Classroom } from '@/hooks/useClassrooms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Filter, GraduationCap, Printer, Maximize2, Minimize2 } from 'lucide-react';
import { educationSchedules, getScheduleByEducationLevel, weekDays, type EducationSchedule } from '@/lib/periodSchedules';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function TeacherSchedule() {
  const { data: classrooms, isLoading } = useClassrooms();
  const { profile } = useProfile();
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

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
        <div className="flex flex-col gap-4">
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
            <div className="flex items-center gap-2">
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as 'full' | 'compact')}
                className="border rounded-lg"
              >
                <ToggleGroupItem value="full" aria-label="عرض كامل" className="gap-1.5 px-3">
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">كامل</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" aria-label="عرض مختصر" className="gap-1.5 px-3">
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">مختصر</span>
                </ToggleGroupItem>
              </ToggleGroup>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة الجدول</span>
                <span className="sm:hidden">طباعة</span>
              </Button>
            </div>
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

        {/* Period Times Card - Only show in full mode */}
        {viewMode === 'full' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
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
        )}

        {/* Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              الجدول الأسبوعي
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
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
                    <td className={cn(
                      "border border-border bg-muted/30",
                      viewMode === 'compact' ? "p-1.5" : "p-3"
                    )}>
                      <div className={cn(
                        "font-medium",
                        viewMode === 'compact' && "text-xs"
                      )}>{period.nameAr}</div>
                      {viewMode === 'full' && (
                        <div className="text-xs text-muted-foreground">
                          {period.startTime} - {period.endTime}
                        </div>
                      )}
                    </td>
                    {weekDays.map(day => {
                      const cellClassrooms = scheduleGrid[periodIndex]?.[day.key] || [];
                      return (
                        <td key={day.key} className={cn(
                          "border border-border align-top",
                          viewMode === 'compact' ? "p-1" : "p-2"
                        )}>
                          {cellClassrooms.length > 0 ? (
                            <div className={viewMode === 'compact' ? "space-y-0.5" : "space-y-1"}>
                              {cellClassrooms.map(classroom => (
                                <div
                                  key={classroom.id}
                                  className={cn(
                                    "rounded-lg",
                                    viewMode === 'compact' ? "p-1 text-[10px]" : "p-2 text-xs"
                                  )}
                                  style={{ 
                                    backgroundColor: `${classroom.color}20`,
                                    borderRight: `3px solid ${classroom.color}`
                                  }}
                                >
                                  <div className="font-medium truncate">{classroom.name}</div>
                                  {viewMode === 'full' && (
                                    <div className="text-muted-foreground truncate">{classroom.subject}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={cn(
                              "text-center text-muted-foreground",
                              viewMode === 'compact' ? "text-[10px] py-1" : "text-xs py-2"
                            )}>-</div>
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

        {/* Legend - Only show in full mode */}
        {viewMode === 'full' && filteredClassrooms.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">دليل الألوان</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {filteredClassrooms.map(classroom => (
                  <div
                    key={classroom.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{ borderColor: classroom.color }}
                  >
                    <div
                      className="w-4 h-4 rounded"
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
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد صفوف</h3>
              <p className="text-muted-foreground">
                قم بإضافة صفوف وتحديد جدول الحصص لعرضها هنا
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Container - Hidden on screen, visible on print */}
      <div className="hidden print:block print-container print-arabic-font">
        <div className="print-header">
          <h1>جدول الحصص الأسبوعي</h1>
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentSchedule.levelNameAr}</p>
          {profile?.school_name && <p>المدرسة: {profile.school_name}</p>}
          {profile?.full_name && <p>المعلم/ة: {profile.full_name}</p>}
        </div>

        {/* Period Times for Print */}
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'right' }}>أوقات الحصص:</h3>
          <table className="print-table" style={{ marginBottom: '10px' }}>
            <thead>
              <tr>
                {currentSchedule.periods.map((period, index) => (
                  <th key={index} style={{ 
                    backgroundColor: period.isBreak ? '#fff3cd' : '#e8f4fd',
                    fontSize: '8px',
                    padding: '4px 2px'
                  }}>
                    {period.nameAr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {currentSchedule.periods.map((period, index) => (
                  <td key={index} style={{ fontSize: '8px', padding: '3px 2px' }}>
                    {period.startTime} - {period.endTime}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Schedule Table for Print */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>الحصة</th>
              {weekDays.map(day => (
                <th key={day.key}>{day.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classPeriods.map((period, periodIndex) => (
              <tr key={periodIndex}>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <div>{period.nameAr}</div>
                  <div style={{ fontSize: '7px', color: '#666' }}>
                    {period.startTime} - {period.endTime}
                  </div>
                </td>
                {weekDays.map(day => {
                  const cellClassrooms = scheduleGrid[periodIndex]?.[day.key] || [];
                  return (
                    <td key={day.key} style={{ padding: '3px' }}>
                      {cellClassrooms.length > 0 ? (
                        cellClassrooms.map(classroom => (
                          <div
                            key={classroom.id}
                            style={{ 
                              padding: '3px',
                              marginBottom: '2px',
                              backgroundColor: `${classroom.color}30`,
                              borderRight: `3px solid ${classroom.color}`,
                              borderRadius: '3px',
                              fontSize: '8px'
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{classroom.name}</div>
                            <div style={{ fontSize: '7px', color: '#666' }}>{classroom.subject}</div>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend for Print */}
        {filteredClassrooms.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>دليل الألوان:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filteredClassrooms.map(classroom => (
                <div
                  key={classroom.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '3px 6px',
                    border: `1px solid ${classroom.color}`,
                    borderRadius: '4px',
                    fontSize: '8px'
                  }}
                >
                  <div
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '2px',
                      backgroundColor: classroom.color 
                    }}
                  />
                  <span>{classroom.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ccc', fontSize: '9px', color: '#666' }}>
          تم الطباعة بتاريخ: {new Date().toLocaleDateString('ar-SA')}
        </div>
      </div>
    </TeacherLayout>
  );
}
