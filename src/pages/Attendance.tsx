import { useState, useMemo, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { AttendanceButton } from '@/components/attendance/AttendanceButton';
import { useStudents } from '@/hooks/useStudents';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useAttendance, useBulkMarkAttendance, AttendanceStatus } from '@/hooks/useAttendance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Check, 
  ClipboardCheck, 
  Loader2, 
  History, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { format, isToday, subDays, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getCurrentPeriod, getKuwaitDateString, getScheduleByEducationLevel } from '@/lib/periodSchedules';

export default function Attendance() {
  const { data: classrooms = [] } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: students = [], isLoading: loadingStudents } = useStudents(selectedClassroom || undefined);
  const { data: attendance = [] } = useAttendance(selectedClassroom || undefined, dateString);
  const { data: allAttendance = [] } = useAttendance(selectedClassroom || undefined);
  const bulkMark = useBulkMarkAttendance();

  // Get selected classroom info
  const currentClassroom = classrooms.find(c => c.id === selectedClassroom);

  // Auto-detect current period based on classroom schedule and Kuwait time
  const currentPeriodInfo = useMemo(() => {
    if (!currentClassroom) return { period: 1, periodInfo: null, isClassDay: false };
    
    const classSchedule = currentClassroom.class_schedule as Record<string, number[]> | null;
    const educationLevelName = currentClassroom.education_level?.name_ar || currentClassroom.education_level?.name;
    
    return getCurrentPeriod(classSchedule, educationLevelName);
  }, [currentClassroom]);

  // Get the schedule for displaying period name
  const scheduleInfo = useMemo(() => {
    if (!currentClassroom) return null;
    const educationLevelName = currentClassroom.education_level?.name_ar || currentClassroom.education_level?.name;
    return getScheduleByEducationLevel(educationLevelName);
  }, [currentClassroom]);

  // Get all unique dates with attendance records
  const attendanceDates = useMemo(() => {
    const dates = [...new Set(allAttendance.map(a => a.date))].sort().reverse();
    return dates;
  }, [allAttendance]);

  // Group attendance by date for history view
  const attendanceByDate = useMemo(() => {
    const grouped: Record<string, typeof allAttendance> = {};
    allAttendance.forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    });
    return grouped;
  }, [allAttendance]);

  const getStudentStatus = (studentId: string): AttendanceStatus | null => {
    if (localAttendance[studentId]) return localAttendance[studentId];
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status || null;
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAll = async () => {
    const records = Object.entries(localAttendance).map(([studentId, status]) => ({
      student_id: studentId,
      classroom_id: selectedClassroom,
      date: dateString,
      status,
      period: currentPeriodInfo.period || 1,
    }));
    if (records.length > 0) {
      await bulkMark.mutateAsync(records);
      setLocalAttendance({});
    }
  };

  const handleMarkAllPresent = () => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => { newAttendance[s.id] = 'present'; });
    setLocalAttendance(newAttendance);
  };

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
    setLocalAttendance({});
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
    setLocalAttendance({});
  };

  const presentCount = students.filter(s => getStudentStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getStudentStatus(s.id) === 'absent').length;
  const lateCount = students.filter(s => getStudentStatus(s.id) === 'late').length;
  const markedCount = presentCount + absentCount + lateCount;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  // Get date stats for history
  const getDateStats = (dateRecords: typeof allAttendance) => {
    const present = dateRecords.filter(r => r.status === 'present').length;
    const absent = dateRecords.filter(r => r.status === 'absent').length;
    const late = dateRecords.filter(r => r.status === 'late').length;
    const total = dateRecords.length;
    return { present, absent, late, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  return (
    <TeacherLayout>
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-hero">
                <ClipboardCheck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">تسجيل الحضور</h1>
                <p className="text-muted-foreground">تسجيل ومتابعة حضور الطلاب</p>
              </div>
            </div>
            
            {/* Classroom Selector */}
            <Select value={selectedClassroom} onValueChange={(v) => { setSelectedClassroom(v); setLocalAttendance({}); }}>
              <SelectTrigger className="w-56">
                <GraduationCap className="w-4 h-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedClassroom ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">اختر صفًا للبدء</h3>
              <p className="text-muted-foreground">قم باختيار الصف من القائمة أعلاه لتسجيل الحضور</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'record' | 'history')}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto sm:max-w-xs">
                <TabsTrigger value="record" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>تسجيل</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span>السجل</span>
                </TabsTrigger>
              </TabsList>

              {/* Classroom Info Badge */}
              {currentClassroom && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: currentClassroom.color?.startsWith('#') ? currentClassroom.color : '#00b8d4' }}
                  />
                  <span className="font-medium text-foreground">{currentClassroom.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {students.length} طالب
                  </Badge>
                </div>
              )}
            </div>

            {/* Record Attendance Tab */}
            <TabsContent value="record" className="space-y-6 mt-6">
              {/* Current Period & Date Navigation Card */}
              <Card>
                <CardContent className="py-4 space-y-4">
                  {/* Current Period Display */}
                  {isToday(selectedDate) && currentPeriodInfo.periodInfo && (
                    <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">
                        الحصة الحالية: {currentPeriodInfo.periodInfo.nameAr}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {currentPeriodInfo.periodInfo.startTime} - {currentPeriodInfo.periodInfo.endTime}
                      </Badge>
                    </div>
                  )}
                  
                  {isToday(selectedDate) && !currentPeriodInfo.isClassDay && currentClassroom && (
                    <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted border border-border">
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        لا توجد حصص مجدولة لهذا الصف اليوم
                      </span>
                    </div>
                  )}

                  {/* Date Navigation */}
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={handlePreviousDay} className="rounded-full">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="min-w-[240px] justify-center gap-3 text-lg font-semibold hover:bg-muted/50">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span>{format(selectedDate, 'EEEE، dd MMMM', { locale: ar })}</span>
                          {isToday(selectedDate) && (
                            <Badge className="gradient-hero text-primary-foreground border-0">اليوم</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => { if (date) { setSelectedDate(date); setLocalAttendance({}); } }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleNextDay} 
                      disabled={isToday(selectedDate)}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                        <p className="text-3xl font-bold text-foreground">{students.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-success">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">حاضرون</p>
                        <p className="text-3xl font-bold text-success">{presentCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-success/10">
                        <UserCheck className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">غائبون</p>
                        <p className="text-3xl font-bold text-destructive">{absentCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-destructive/10">
                        <UserX className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-warning">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">متأخرون</p>
                        <p className="text-3xl font-bold text-warning">{lateCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-warning/10">
                        <Clock className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress & Actions Card */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">تقدم التسجيل</span>
                        <span className="font-medium">{markedCount} / {students.length}</span>
                      </div>
                      <Progress value={students.length > 0 ? (markedCount / students.length) * 100 : 0} className="h-2" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleMarkAllPresent}
                        className="gap-2"
                      >
                        <Check className="w-4 h-4" />
                        الكل حاضر
                      </Button>
                      <Button 
                        className="gradient-hero gap-2" 
                        onClick={handleSaveAll} 
                        disabled={bulkMark.isPending || Object.keys(localAttendance).length === 0}
                      >
                        {bulkMark.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ClipboardCheck className="w-4 h-4" />
                            حفظ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students List */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    قائمة الطلاب
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingStudents ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    </div>
                  ) : students.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">لا يوجد طلاب في هذا الصف</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {students.map((student, index) => {
                        const currentStatus = getStudentStatus(student.id);
                        const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                        return (
                          <div 
                            key={student.id} 
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors",
                              currentStatus === 'present' && "bg-success/5",
                              currentStatus === 'absent' && "bg-destructive/5",
                              currentStatus === 'late' && "bg-warning/5",
                              !currentStatus && "hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground w-6 text-center">{index + 1}</span>
                              <Avatar className="w-11 h-11 border-2 border-primary/20">
                                {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.name} />}
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.student_id}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mr-10 sm:mr-0">
                              {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((status) => (
                                <AttendanceButton 
                                  key={status} 
                                  status={status} 
                                  isActive={currentStatus === status} 
                                  onClick={() => handleStatusChange(student.id, status)} 
                                  size="sm" 
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6 mt-6">
              {attendanceDates.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <History className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا يوجد سجل حضور</h3>
                    <p className="text-muted-foreground">لم يتم تسجيل أي حضور بعد لهذا الصف</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {attendanceDates.map(date => {
                    const dateRecords = attendanceByDate[date] || [];
                    const stats = getDateStats(dateRecords);
                    const absentStudents = dateRecords.filter(r => r.status === 'absent');
                    const lateStudents = dateRecords.filter(r => r.status === 'late');
                    
                    return (
                      <Card key={date} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {format(new Date(date), 'EEEE، dd MMMM yyyy', { locale: ar })}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  نسبة الحضور: <span className={cn(
                                    "font-semibold",
                                    stats.rate >= 80 ? "text-success" : stats.rate >= 60 ? "text-warning" : "text-destructive"
                                  )}>{stats.rate}%</span>
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                                <UserCheck className="w-3 h-3" />
                                {stats.present} حاضر
                              </Badge>
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                                <UserX className="w-3 h-3" />
                                {stats.absent} غائب
                              </Badge>
                              {stats.late > 0 && (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
                                  <Clock className="w-3 h-3" />
                                  {stats.late} متأخر
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        {(absentStudents.length > 0 || lateStudents.length > 0) && (
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Absent Students */}
                              {absentStudents.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-destructive">
                                    <XCircle className="w-4 h-4" />
                                    <span className="font-medium text-sm">الغائبون ({absentStudents.length})</span>
                                  </div>
                                  <div className="grid gap-2">
                                    {absentStudents.map(record => {
                                      const student = students.find(s => s.id === record.student_id);
                                      return (
                                        <div key={record.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                                          <Avatar className="w-8 h-8">
                                            {student?.avatar_url && <AvatarImage src={student.avatar_url} />}
                                            <AvatarFallback className="bg-destructive/10 text-destructive text-xs">
                                              {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium text-foreground">{student?.name || 'طالب محذوف'}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Late Students */}
                              {lateStudents.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-warning">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="font-medium text-sm">المتأخرون ({lateStudents.length})</span>
                                  </div>
                                  <div className="grid gap-2">
                                    {lateStudents.map(record => {
                                      const student = students.find(s => s.id === record.student_id);
                                      return (
                                        <div key={record.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                                          <Avatar className="w-8 h-8">
                                            {student?.avatar_url && <AvatarImage src={student.avatar_url} />}
                                            <AvatarFallback className="bg-warning/10 text-warning text-xs">
                                              {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium text-foreground">{student?.name || 'طالب محذوف'}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TeacherLayout>
  );
}
