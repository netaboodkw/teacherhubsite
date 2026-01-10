import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AttendanceButton } from '@/components/attendance/AttendanceButton';
import { useApp } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Check, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export default function Attendance() {
  const { classrooms, getStudentsByClassroom, markAttendance, attendance } = useApp();
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0]?.id || '');
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});

  const students = getStudentsByClassroom(selectedClassroom);
  
  // Initialize local attendance from context
  const getStudentStatus = (studentId: string): AttendanceStatus | null => {
    if (localAttendance[studentId]) return localAttendance[studentId];
    const record = attendance.find(
      a => a.studentId === studentId && a.date === selectedDate && a.classroomId === selectedClassroom
    );
    return record?.status || null;
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAll = () => {
    Object.entries(localAttendance).forEach(([studentId, status]) => {
      markAttendance({
        studentId,
        classroomId: selectedClassroom,
        date: selectedDate,
        status,
      });
    });
    toast.success('تم حفظ الحضور بنجاح');
    setLocalAttendance({});
  };

  const handleMarkAllPresent = () => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      newAttendance[s.id] = 'present';
    });
    setLocalAttendance(newAttendance);
  };

  const presentCount = students.filter(s => getStudentStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getStudentStatus(s.id) === 'absent').length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">تسجيل الحضور</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(selectedDate).toLocaleDateString('ar-SA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleMarkAllPresent}>
              <Check className="w-4 h-4 ml-2" />
              الكل حاضر
            </Button>
            
            <Button className="gradient-hero" onClick={handleSaveAll}>
              <ClipboardCheck className="w-4 h-4 ml-2" />
              حفظ الحضور
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">الطلاب</p>
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
          </div>
          <div className="bg-success/10 rounded-xl p-4 border border-success/20">
            <p className="text-sm text-success">حاضر</p>
            <p className="text-2xl font-bold text-success">{presentCount}</p>
          </div>
          <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
            <p className="text-sm text-destructive">غائب</p>
            <p className="text-2xl font-bold text-destructive">{absentCount}</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <p className="text-sm text-primary">نسبة الحضور</p>
            <p className="text-2xl font-bold text-primary">
              {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-foreground">قائمة الطلاب</h2>
          </div>
          
          <div className="divide-y divide-border">
            {students.map((student) => {
              const currentStatus = getStudentStatus(student.id);
              const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              
              return (
                <div 
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.studentId}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </MainLayout>
  );
}
