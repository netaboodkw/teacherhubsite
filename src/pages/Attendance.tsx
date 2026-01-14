import { useState, useMemo } from 'react';
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
import { Calendar, Check, ClipboardCheck, Loader2, History, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, addDays, isSameDay, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">تسجيل الحضور</h1>
            <p className="text-muted-foreground mt-1">تسجيل ومتابعة حضور الطلاب</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedClassroom} onValueChange={(v) => { setSelectedClassroom(v); setLocalAttendance({}); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="اختر الصف" /></SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'record' | 'history')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="record" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              تسجيل اليوم
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              سجل الحضور
            </TabsTrigger>
          </TabsList>

          {/* Record Attendance Tab */}
          <TabsContent value="record" className="space-y-6 mt-6">
            {/* Date Navigation */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-center">
                    <Calendar className="ml-2 h-4 w-4" />
                    {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: ar })}
                    {isToday(selectedDate) && <Badge variant="secondary" className="mr-2">اليوم</Badge>}
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
              <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday(selectedDate)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={handleMarkAllPresent}><Check className="w-4 h-4 ml-2" />الكل حاضر</Button>
              <Button className="gradient-hero" onClick={handleSaveAll} disabled={bulkMark.isPending || Object.keys(localAttendance).length === 0}>
                {bulkMark.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ClipboardCheck className="w-4 h-4 ml-2" />حفظ الحضور</>}
              </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border"><p className="text-sm text-muted-foreground">الطلاب</p><p className="text-2xl font-bold text-foreground">{students.length}</p></div>
              <div className="bg-success/10 rounded-xl p-4 border border-success/20"><p className="text-sm text-success">حاضر</p><p className="text-2xl font-bold text-success">{presentCount}</p></div>
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20"><p className="text-sm text-destructive">غائب</p><p className="text-2xl font-bold text-destructive">{absentCount}</p></div>
              <div className="bg-warning/10 rounded-xl p-4 border border-warning/20"><p className="text-sm text-warning">متأخر</p><p className="text-2xl font-bold text-warning">{lateCount}</p></div>
            </div>

            {/* Students List */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30"><h2 className="font-semibold text-foreground">قائمة الطلاب</h2></div>
              {loadingStudents ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>لا يوجد طلاب في هذا الصف</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((student) => {
                    const currentStatus = getStudentStatus(student.id);
                    const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                    return (
                      <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.name} />}
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{initials}</AvatarFallback>
                          </Avatar>
                          <div><p className="font-medium text-foreground">{student.name}</p><p className="text-sm text-muted-foreground">{student.student_id}</p></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((status) => (
                            <AttendanceButton key={status} status={status} isActive={currentStatus === status} onClick={() => handleStatusChange(student.id, status)} size="sm" />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6 mt-6">
            {attendanceDates.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">لا يوجد سجل حضور</h3>
                    <p>لم يتم تسجيل أي حضور بعد لهذا الصف</p>
                  </div>
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
                    <Card key={date}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-primary" />
                            {format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: ar })}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-success/10 text-success">
                              {stats.present} حاضر
                            </Badge>
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                              {stats.absent} غائب
                            </Badge>
                            {stats.late > 0 && (
                              <Badge variant="secondary" className="bg-warning/10 text-warning">
                                {stats.late} متأخر
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription>
                          نسبة الحضور: {stats.rate}%
                        </CardDescription>
                      </CardHeader>
                      
                      {(absentStudents.length > 0 || lateStudents.length > 0) && (
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Absent Students */}
                            {absentStudents.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                                  <XCircle className="w-4 h-4" />
                                  الغائبون ({absentStudents.length})
                                </p>
                                <div className="space-y-1">
                                  {absentStudents.map(record => {
                                    const student = students.find(s => s.id === record.student_id);
                                    return (
                                      <div key={record.id} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                                        <Avatar className="w-7 h-7">
                                          {student?.avatar_url && <AvatarImage src={student.avatar_url} />}
                                          <AvatarFallback className="bg-destructive/10 text-destructive text-xs">
                                            {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-foreground">{student?.name || 'طالب محذوف'}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Late Students */}
                            {lateStudents.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-warning flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  المتأخرون ({lateStudents.length})
                                </p>
                                <div className="space-y-1">
                                  {lateStudents.map(record => {
                                    const student = students.find(s => s.id === record.student_id);
                                    return (
                                      <div key={record.id} className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10">
                                        <Avatar className="w-7 h-7">
                                          {student?.avatar_url && <AvatarImage src={student.avatar_url} />}
                                          <AvatarFallback className="bg-warning/10 text-warning text-xs">
                                            {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-foreground">{student?.name || 'طالب محذوف'}</span>
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
      </div>
    </TeacherLayout>
  );
}
