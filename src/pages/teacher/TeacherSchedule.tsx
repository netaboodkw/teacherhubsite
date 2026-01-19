import { useMemo, useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms, type Classroom } from '@/hooks/useClassrooms';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, ChevronLeft, ChevronRight, Printer, BookOpen, Settings, Bell, Volume2, Vibrate, Play } from 'lucide-react';
import { educationSchedules, getScheduleByEducationLevel, weekDays, getKuwaitDayKey, type EducationSchedule } from '@/lib/periodSchedules';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { usePeriodReminder, getReminderSettings, saveReminderSettings, type ReminderSettings } from '@/hooks/usePeriodReminder';
import { UpcomingPeriodAlert } from '@/components/schedule/UpcomingPeriodAlert';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { soundOptions, previewSound, type SoundType } from '@/lib/notificationSounds';
import { toast } from 'sonner';

// Color mapping for Tailwind class names to hex colors
const colorClassToHex: { [key: string]: string } = {
  'bg-blue-200': '#bfdbfe',
  'bg-blue-500': '#3b82f6',
  'bg-yellow-200': '#fef08a',
  'bg-yellow-500': '#eab308',
  'bg-teal-200': '#99f6e4',
  'bg-teal-500': '#14b8a6',
  'bg-green-200': '#bbf7d0',
  'bg-green-500': '#22c55e',
  'bg-red-200': '#fecaca',
  'bg-red-500': '#ef4444',
  'bg-purple-200': '#e9d5ff',
  'bg-purple-500': '#a855f7',
  'bg-pink-200': '#fbcfe8',
  'bg-pink-500': '#ec4899',
  'bg-orange-200': '#fed7aa',
  'bg-orange-500': '#f97316',
  'bg-indigo-200': '#c7d2fe',
  'bg-indigo-500': '#6366f1',
  'bg-cyan-200': '#a5f3fc',
  'bg-cyan-500': '#06b6d4',
  'bg-primary': '#00b8d4',
};

// Helper function to get hex color from class name or hex value
const getHexColor = (color: string | null | undefined): string => {
  if (!color) return '#888888';
  if (color.startsWith('#')) return color;
  return colorClassToHex[color] || '#888888';
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const hexColor = getHexColor(hex);
  if (!hexColor || hexColor.length < 7) return `rgba(136, 136, 136, ${alpha})`;
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function TeacherSchedule() {
  const { data: classrooms, isLoading } = useClassrooms();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayKey = getKuwaitDayKey();
    const index = weekDays.findIndex(d => d.key === todayKey);
    return index >= 0 ? index : 0;
  });
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(getReminderSettings);

  const updateReminderSettings = (updates: Partial<ReminderSettings>) => {
    const newSettings = { ...reminderSettings, ...updates };
    setReminderSettings(newSettings);
    saveReminderSettings(newSettings);
    toast.success('تم حفظ الإعدادات');
  };

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

  // Filter classrooms based on education level
  const filteredClassrooms = useMemo(() => {
    if (!classrooms) return [];
    if (selectedEducationLevel === 'all') return classrooms;
    return classrooms.filter(c => c.education_level?.id === selectedEducationLevel);
  }, [classrooms, selectedEducationLevel]);

  // Get the schedule for the selected education level
  const currentSchedule: EducationSchedule = useMemo(() => {
    if (selectedEducationLevel !== 'all') {
      const level = educationLevels.find(l => l.id === selectedEducationLevel);
      return getScheduleByEducationLevel(level?.name_ar || level?.name);
    }
    if (filteredClassrooms.length > 0 && filteredClassrooms[0].education_level) {
      return getScheduleByEducationLevel(filteredClassrooms[0].education_level.name_ar);
    }
    return educationSchedules[0];
  }, [selectedEducationLevel, educationLevels, filteredClassrooms]);

  // Period reminder hook
  const {
    upcomingPeriod,
    isRepeating,
    stopRepeating,
  } = usePeriodReminder(currentSchedule, classrooms || [], true);

  const classPeriods = currentSchedule.periods.filter(p => !p.isBreak);
  const selectedDay = weekDays[selectedDayIndex];
  const todayKey = getKuwaitDayKey();

  // Get classes for selected day
  const dayClasses = useMemo(() => {
    const classes: { period: typeof classPeriods[0]; classroom: Classroom | null }[] = [];
    
    classPeriods.forEach(period => {
      let foundClassroom: Classroom | null = null;
      
      filteredClassrooms.forEach(classroom => {
        if (!classroom.class_schedule) return;
        const daySchedule = classroom.class_schedule[selectedDay.key];
        if (Array.isArray(daySchedule) && daySchedule.includes(period.period)) {
          foundClassroom = classroom;
        }
      });
      
      classes.push({ period, classroom: foundClassroom });
    });
    
    return classes;
  }, [filteredClassrooms, classPeriods, selectedDay]);

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDayIndex(prev => (prev === 0 ? weekDays.length - 1 : prev - 1));
    } else {
      setSelectedDayIndex(prev => (prev === weekDays.length - 1 ? 0 : prev + 1));
    }
  };

  if (isLoading) {
    return (
      <TeacherLayout hideHeader={isMobile} hidePadding={isMobile}>
        <div className="p-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </TeacherLayout>
    );
  }

  // Mobile iOS-style Layout
  if (isMobile) {
    return (
      <TeacherLayout hideHeader hidePadding>
        <div className="min-h-screen bg-background pb-24">
          {/* iOS Header */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
            <div className="px-4 pt-12 pb-4 safe-area-inset-top">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">جدول الحصص</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showSettings ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="rounded-full gap-1"
                  >
                    <Settings className={cn("h-4 w-4", showSettings && "rotate-90 transition-transform")} />
                    {showSettings ? "إغلاق" : "التذكيرات"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrint}
                    className="h-10 w-10 rounded-full"
                  >
                    <Printer className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Education Level Filter */}
              {educationLevels.length > 1 && (
                <Select value={selectedEducationLevel} onValueChange={setSelectedEducationLevel}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-muted/50 border-0">
                    <SelectValue placeholder="جميع المراحل" />
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
              )}
            </div>
          </div>

          {/* Settings Section - At Top When Open */}
          {showSettings && (
            <div className="px-4 pt-4 animate-in slide-in-from-top duration-200">
              <div className="rounded-2xl bg-muted/30 p-4 space-y-4">
                {/* Enable Reminder */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">تذكير الحصص</p>
                      <p className="text-xs text-muted-foreground">تنبيه قبل بداية الحصة</p>
                    </div>
                  </div>
                  <div dir="ltr">
                    <Switch
                      checked={reminderSettings.enabled}
                      onCheckedChange={(checked) => updateReminderSettings({ enabled: checked })}
                    />
                  </div>
                </div>

                {reminderSettings.enabled && (
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    {/* Minutes Before */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">التنبيه قبل الحصة بـ</span>
                      <Select
                        value={reminderSettings.minutesBefore.toString()}
                        onValueChange={(value) => updateReminderSettings({ minutesBefore: parseInt(value) })}
                      >
                        <SelectTrigger className="w-28 h-9 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 دقائق</SelectItem>
                          <SelectItem value="5">5 دقائق</SelectItem>
                          <SelectItem value="10">10 دقائق</SelectItem>
                          <SelectItem value="15">15 دقيقة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">الصوت</span>
                      </div>
                      <div dir="ltr">
                        <Switch
                          checked={reminderSettings.soundEnabled}
                          onCheckedChange={(checked) => updateReminderSettings({ soundEnabled: checked })}
                        />
                      </div>
                    </div>

                    {/* Sound Type */}
                    {reminderSettings.soundEnabled && (
                      <div className="flex gap-2">
                        <Select
                          value={reminderSettings.soundType}
                          onValueChange={(value) => updateReminderSettings({ soundType: value as SoundType })}
                        >
                          <SelectTrigger className="flex-1 h-9 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {soundOptions.map((sound) => (
                              <SelectItem key={sound.id} value={sound.id}>
                                {sound.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg"
                          onClick={() => previewSound(reminderSettings.soundType)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Vibration Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Vibrate className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">الاهتزاز</span>
                      </div>
                      <div dir="ltr">
                        <Switch
                          checked={reminderSettings.vibrationEnabled}
                          onCheckedChange={(checked) => updateReminderSettings({ vibrationEnabled: checked })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Period Alert */}
          {upcomingPeriod && (
            <div className="px-4 pt-4">
              <UpcomingPeriodAlert
                upcomingPeriod={upcomingPeriod} 
                isRepeating={isRepeating}
                onStopRepeating={stopRepeating}
              />
            </div>
          )}

          {/* Day Selector */}
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between bg-card rounded-2xl p-2 border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDay('next')}
                className="h-10 w-10 rounded-xl"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 flex items-center justify-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{selectedDay.name}</span>
                {selectedDay.key === todayKey && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    اليوم
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDay('prev')}
                className="h-10 w-10 rounded-xl"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Days Quick Select */}
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {weekDays.map((day, index) => (
                <button
                  key={day.key}
                  onClick={() => setSelectedDayIndex(index)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    index === selectedDayIndex
                      ? "bg-primary text-primary-foreground shadow-md"
                      : day.key === todayKey
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>

          {/* Period Times */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{currentSchedule.levelNameAr}</span>
            </div>
          </div>

          {/* Classes List */}
          <div className="px-4 space-y-3 pb-4">
            {dayClasses.map(({ period, classroom }, index) => {
              const hexColor = classroom ? getHexColor(classroom.color) : null;
              const isCurrentPeriod = upcomingPeriod?.period?.period === period.period && selectedDay.key === todayKey;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-2xl overflow-hidden transition-all",
                    isCurrentPeriod && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={classroom ? {
                    backgroundColor: hexToRgba(classroom.color, 0.12),
                    borderRight: `4px solid ${hexColor}`,
                  } : undefined}
                >
                  <div
                    className={cn(
                      "p-4",
                      !classroom && "bg-muted/30 border border-border/50 rounded-2xl"
                    )}
                    onClick={() => classroom && navigate(`/teacher/classrooms/${classroom.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs font-medium",
                              isCurrentPeriod ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                          >
                            {period.nameAr}
                          </Badge>
                          {isCurrentPeriod && (
                            <span className="text-xs text-primary font-medium animate-pulse">الآن</span>
                          )}
                        </div>
                        
                        {classroom ? (
                          <>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {classroom.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <BookOpen className="h-4 w-4" />
                              <span>{classroom.subject}</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">لا يوجد حصة</p>
                        )}
                      </div>
                      
                      <div className="text-left">
                        <div className="text-sm font-medium text-foreground">
                          {period.startTime}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {period.endTime}
                        </div>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {period.duration} د
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredClassrooms.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">لا توجد صفوف</h3>
              <p className="text-muted-foreground text-sm">
                قم بإضافة صفوف وتحديد جدول الحصص
              </p>
            </div>
          )}
        </div>

        {/* Print Container */}
        <PrintContainer 
          currentSchedule={currentSchedule}
          filteredClassrooms={filteredClassrooms}
          classPeriods={classPeriods}
          getHexColor={getHexColor}
          hexToRgba={hexToRgba}
        />
      </TeacherLayout>
    );
  }

  // Desktop Layout
  return (
    <TeacherLayout>
      <div className="p-4 lg:p-6 space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              جدول الحصص
            </h1>
            <p className="text-muted-foreground mt-1">عرض الجدول الأسبوعي لجميع الصفوف</p>
          </div>
          
          <div className="flex items-center gap-3">
            {educationLevels.length > 1 && (
              <Select value={selectedEducationLevel} onValueChange={setSelectedEducationLevel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="جميع المراحل" />
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
            )}
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </div>

        {/* Upcoming Period Alert */}
        <UpcomingPeriodAlert
          upcomingPeriod={upcomingPeriod} 
          isRepeating={isRepeating}
          onStopRepeating={stopRepeating}
        />

        {/* Period Times */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">أوقات الحصص - {currentSchedule.levelNameAr}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
            {currentSchedule.periods.map((period, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-xl text-center text-sm transition-all",
                  period.isBreak 
                    ? "bg-muted/50 text-muted-foreground" 
                    : "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                )}
              >
                <div className="font-medium">{period.nameAr}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {period.startTime} - {period.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-card rounded-2xl border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              الجدول الأسبوعي
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-l bg-muted/50 p-3 text-right font-semibold min-w-[100px]">
                    الحصة
                  </th>
                  {weekDays.map(day => (
                    <th 
                      key={day.key} 
                      className={cn(
                        "border-b border-l last:border-l-0 p-3 text-center font-semibold",
                        day.key === todayKey ? "bg-primary/10" : "bg-muted/50"
                      )}
                    >
                      <span>{day.name}</span>
                      {day.key === todayKey && (
                        <Badge variant="secondary" className="mr-2 bg-primary text-primary-foreground text-xs">
                          اليوم
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classPeriods.map((period, periodIndex) => (
                  <tr key={periodIndex} className="hover:bg-muted/10 transition-colors">
                    <td className="border-b border-l bg-muted/20 p-3">
                      <div className="font-semibold text-sm">{period.nameAr}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {period.startTime} - {period.endTime}
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const cellClassrooms = filteredClassrooms.filter(classroom => {
                        if (!classroom.class_schedule) return false;
                        const daySchedule = classroom.class_schedule[day.key];
                        return Array.isArray(daySchedule) && daySchedule.includes(period.period);
                      });
                      
                      return (
                        <td 
                          key={day.key} 
                          className={cn(
                            "border-b border-l last:border-l-0 align-top p-2 min-w-[120px]",
                            day.key === todayKey && "bg-primary/5"
                          )}
                        >
                          {cellClassrooms.length > 0 ? (
                            <div className="space-y-1.5">
                              {cellClassrooms.map(classroom => {
                                const hexColor = getHexColor(classroom.color);
                                const bgColor = hexToRgba(classroom.color, 0.2);
                                
                                return (
                                  <div
                                    key={classroom.id}
                                  onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
                                    className="rounded-lg p-2 cursor-pointer transition-all hover:shadow-md"
                                    style={{ 
                                      backgroundColor: bgColor,
                                      borderRight: `3px solid ${hexColor}`,
                                    }}
                                  >
                                    <div className="font-medium text-xs text-foreground">
                                      {classroom.name}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      {classroom.subject}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground/40 text-sm py-2">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Color Legend */}
        {filteredClassrooms.length > 0 && (
          <div className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold mb-3">دليل الألوان</h3>
            <div className="flex flex-wrap gap-2">
              {filteredClassrooms.map(classroom => {
                const hexColor = getHexColor(classroom.color);
                return (
                  <div
                    key={classroom.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:shadow-sm cursor-pointer"
                    style={{ 
                      backgroundColor: hexToRgba(classroom.color, 0.15),
                      border: `1px solid ${hexToRgba(classroom.color, 0.3)}`
                    }}
                    onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: hexColor }}
                    />
                    <span className="text-sm font-medium">{classroom.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredClassrooms.length === 0 && (
          <div className="bg-card rounded-2xl border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">لا توجد صفوف</h3>
            <p className="text-muted-foreground">
              قم بإضافة صفوف وتحديد جدول الحصص لعرضها هنا
            </p>
          </div>
        )}
      </div>

      {/* Print Container */}
      <PrintContainer 
        currentSchedule={currentSchedule}
        filteredClassrooms={filteredClassrooms}
        classPeriods={classPeriods}
        getHexColor={getHexColor}
        hexToRgba={hexToRgba}
      />
    </TeacherLayout>
  );
}

// Print Container Component
function PrintContainer({
  currentSchedule,
  filteredClassrooms,
  classPeriods,
  getHexColor,
  hexToRgba,
}: {
  currentSchedule: EducationSchedule;
  filteredClassrooms: Classroom[];
  classPeriods: EducationSchedule['periods'];
  getHexColor: (color: string | null | undefined) => string;
  hexToRgba: (hex: string, alpha: number) => string;
}) {
  return (
    <div className="hidden print:block print-container print-arabic-font">
      <div className="print-header">
        <h1>جدول الحصص الأسبوعي</h1>
        <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentSchedule.levelNameAr}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '14px' }}>أوقات الحصص</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {currentSchedule.periods.map((period, index) => (
            <div
              key={index}
              style={{
                padding: '6px 12px',
                backgroundColor: period.isBreak ? '#e9ecef' : '#e3f2fd',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <strong>{period.nameAr}</strong>: {period.startTime} - {period.endTime}
            </div>
          ))}
        </div>
      </div>

      <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f9fa' }}>الحصة</th>
            {weekDays.map(day => (
              <th key={day.key} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f9fa' }}>
                {day.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classPeriods.map((period, periodIndex) => (
            <tr key={periodIndex}>
              <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#fafafa' }}>
                <strong>{period.nameAr}</strong>
                <br />
                <small>{period.startTime} - {period.endTime}</small>
              </td>
              {weekDays.map(day => {
                const cellClassrooms = filteredClassrooms.filter(classroom => {
                  if (!classroom.class_schedule) return false;
                  const daySchedule = classroom.class_schedule[day.key];
                  return Array.isArray(daySchedule) && daySchedule.includes(period.period);
                });
                
                return (
                  <td key={day.key} style={{ border: '1px solid #ddd', padding: '6px' }}>
                    {cellClassrooms.map(classroom => (
                      <div
                        key={classroom.id}
                        style={{
                          padding: '4px 8px',
                          marginBottom: '4px',
                          backgroundColor: hexToRgba(classroom.color, 0.2),
                          borderRight: `3px solid ${getHexColor(classroom.color)}`,
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        <strong>{classroom.name}</strong>
                        <br />
                        <small>{classroom.subject}</small>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '14px' }}>دليل الألوان</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filteredClassrooms.map(classroom => (
            <div
              key={classroom.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: hexToRgba(classroom.color, 0.15),
                border: `1px solid ${hexToRgba(classroom.color, 0.3)}`,
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: getHexColor(classroom.color),
                }}
              />
              <span>{classroom.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
