import { useState, useMemo } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, FileText, BarChart3, Loader2, Calendar, Users, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Reports() {
  const { data: classrooms = [], isLoading: lc } = useClassrooms();
  const { data: students = [], isLoading: ls } = useStudents();
  const { data: attendance = [], isLoading: la } = useAttendance();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const isLoading = lc || ls || la;

  // Filter attendance based on selections
  const filteredAttendance = useMemo(() => {
    let filtered = [...attendance];
    
    if (selectedClassroom !== 'all') {
      filtered = filtered.filter(a => a.classroom_id === selectedClassroom);
    }
    
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(a => a.date === dateStr);
    }
    
    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(a => a.period === parseInt(selectedPeriod));
    }
    
    return filtered;
  }, [attendance, selectedClassroom, selectedDate, selectedPeriod]);

  // Statistics
  const stats = useMemo(() => {
    const present = filteredAttendance.filter(a => a.status === 'present').length;
    const absent = filteredAttendance.filter(a => a.status === 'absent').length;
    const late = filteredAttendance.filter(a => a.status === 'late').length;
    const excused = filteredAttendance.filter(a => a.status === 'excused').length;
    const total = filteredAttendance.length;
    
    return {
      present,
      absent,
      late,
      excused,
      total,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
      absentRate: total > 0 ? Math.round((absent / total) * 100) : 0,
    };
  }, [filteredAttendance]);

  // Get attendance records grouped by student for selected date
  const attendanceRecords = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayRecords = attendance.filter(a => {
      let match = a.date === dateStr;
      if (selectedClassroom !== 'all') match = match && a.classroom_id === selectedClassroom;
      if (selectedPeriod !== 'all') match = match && a.period === parseInt(selectedPeriod);
      return match;
    });

    return dayRecords.map(record => {
      const student = students.find(s => s.id === record.student_id);
      const classroom = classrooms.find(c => c.id === record.classroom_id);
      return {
        ...record,
        student,
        classroom,
      };
    });
  }, [attendance, students, classrooms, selectedDate, selectedClassroom, selectedPeriod]);

  const attendanceByClass = classrooms.map(c => {
    const cs = students.filter(s => s.classroom_id === c.id);
    const ca = filteredAttendance.filter(a => a.classroom_id === c.id);
    const pc = ca.filter(a => a.status === 'present').length;
    return { name: c.name.slice(0, 15), حضور: ca.length > 0 ? Math.round((pc / ca.length) * 100) : 0, طلاب: cs.length };
  });

  const attendanceDistribution = [
    { name: 'حاضر', value: stats.present, color: 'hsl(142, 71%, 45%)' },
    { name: 'غائب', value: stats.absent, color: 'hsl(0, 84%, 60%)' },
    { name: 'متأخر', value: stats.late, color: 'hsl(38, 92%, 50%)' },
    { name: 'بعذر', value: stats.excused, color: 'hsl(215, 16%, 47%)' },
  ].filter(i => i.value > 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 border-green-200">حاضر</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 border-red-200">غائب</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">متأخر</Badge>;
      case 'excused':
        return <Badge variant="secondary">بعذر</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) return <TeacherLayout><div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></TeacherLayout>;

  return (
    <TeacherLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">التقارير والتحليلات</h1>
            <p className="text-muted-foreground mt-1">عرض وتحليل بيانات الحضور والغياب</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline"><FileText className="w-4 h-4 ml-2" />تصدير CSV</Button>
            <Button className="gradient-hero"><FileDown className="w-4 h-4 ml-2" />تصدير PDF</Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-primary" />
              تصفية النتائج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">التاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <Calendar className="ml-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: ar }) : 'اختر تاريخاً'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedDate(undefined)}
                    className="text-xs"
                  >
                    مسح التاريخ
                  </Button>
                )}
              </div>

              {/* Classroom Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">الصف</label>
                <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصفوف</SelectItem>
                    {classrooms.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">الحصة</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحصص" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحصص</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7].map(p => (
                      <SelectItem key={p} value={p.toString()}>الحصة {p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                حاضر
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.present}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stats.presentRate}% من الإجمالي</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                غائب
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.absent}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stats.absentRate}% من الإجمالي</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                متأخر
              </CardDescription>
              <CardTitle className="text-3xl text-amber-600">{stats.late}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stats.excused} بعذر</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                إجمالي السجلات
              </CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{classrooms.length} صف، {students.length} طالب</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records for Selected Date */}
        {selectedDate && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Present Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  الطلاب الحاضرين
                </CardTitle>
                <CardDescription>
                  {attendanceRecords.filter(r => r.status === 'present').length} طالب حاضر في {format(selectedDate, 'dd MMMM yyyy', { locale: ar })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.filter(r => r.status === 'present').length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>لا يوجد طلاب حاضرين</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {attendanceRecords.filter(r => r.status === 'present').map(record => (
                      <div 
                        key={record.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900"
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={record.student?.avatar_url || undefined} />
                          <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                            {record.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {record.student?.name || 'طالب محذوف'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {record.classroom?.name} • الحصة {record.period}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Absent Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  الطلاب الغائبين
                </CardTitle>
                <CardDescription>
                  {attendanceRecords.filter(r => r.status === 'absent').length} طالب غائب في {format(selectedDate, 'dd MMMM yyyy', { locale: ar })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.filter(r => r.status === 'absent').length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <XCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>لا يوجد طلاب غائبين</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {attendanceRecords.filter(r => r.status === 'absent').map(record => (
                      <div 
                        key={record.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={record.student?.avatar_url || undefined} />
                          <AvatarFallback className="bg-red-100 text-red-700 text-sm">
                            {record.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {record.student?.name || 'طالب محذوف'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {record.classroom?.name} • الحصة {record.period}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Late Students */}
            {attendanceRecords.filter(r => r.status === 'late').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <Clock className="w-5 h-5" />
                    الطلاب المتأخرين
                  </CardTitle>
                  <CardDescription>
                    {attendanceRecords.filter(r => r.status === 'late').length} طالب متأخر
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {attendanceRecords.filter(r => r.status === 'late').map(record => (
                      <div 
                        key={record.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900"
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={record.student?.avatar_url || undefined} />
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                            {record.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {record.student?.name || 'طالب محذوف'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {record.classroom?.name} • الحصة {record.period}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Excused Students */}
            {attendanceRecords.filter(r => r.status === 'excused').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    طلاب بعذر
                  </CardTitle>
                  <CardDescription>
                    {attendanceRecords.filter(r => r.status === 'excused').length} طالب بعذر
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {attendanceRecords.filter(r => r.status === 'excused').map(record => (
                      <div 
                        key={record.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={record.student?.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {record.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {record.student?.name || 'طالب محذوف'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {record.classroom?.name} • الحصة {record.period}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Records Message */}
            {attendanceRecords.length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">لا توجد سجلات حضور</h3>
                    <p>لم يتم تسجيل أي حضور لهذا التاريخ</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                نسبة الحضور حسب الصف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceByClass} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip />
                    <Bar dataKey="حضور" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>توزيع الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {attendanceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={attendanceDistribution} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={5} 
                        dataKey="value" 
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendanceDistribution.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات حضور بعد
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  );
}
