import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useIsMobile } from '@/hooks/use-mobile';
import { ImportStudentsDialog } from '@/components/students/ImportStudentsDialog';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, FileSpreadsheet, Loader2, ChevronLeft, HeartPulse, Eye, GraduationCap, UserX, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGrades } from '@/hooks/useGrades';
import { useBehaviorNotes } from '@/hooks/useBehaviorNotes';
import { useAttendance } from '@/hooks/useAttendance';

// Helper function to convert Tailwind class colors to hex
const getHexColor = (color: string | null | undefined): string => {
  if (!color) return '#3b82f6';
  if (color.startsWith('#')) return color;
  
  const colorMap: { [key: string]: string } = {
    'bg-blue-200': '#93c5fd', 'bg-blue-500': '#3b82f6',
    'bg-green-200': '#bbf7d0', 'bg-green-500': '#22c55e',
    'bg-purple-200': '#e9d5ff', 'bg-purple-500': '#a855f7',
    'bg-orange-200': '#fed7aa', 'bg-orange-500': '#f97316',
    'bg-pink-200': '#fbcfe8', 'bg-pink-500': '#ec4899',
    'bg-yellow-200': '#fef08a', 'bg-yellow-500': '#eab308',
    'bg-teal-200': '#99f6e4', 'bg-teal-500': '#14b8a6',
    'bg-red-200': '#fecaca', 'bg-red-500': '#ef4444',
    'bg-indigo-200': '#c7d2fe', 'bg-indigo-500': '#6366f1',
    'bg-cyan-200': '#a5f3fc', 'bg-cyan-500': '#06b6d4',
    'bg-primary': '#00b8d4',
  };
  return colorMap[color] || '#3b82f6';
};

// iOS-style Student Row Component
function StudentRow({ 
  student, 
  classroomName, 
  onClick 
}: { 
  student: any; 
  classroomName: string;
  onClick: () => void;
}) {
  const { data: grades = [] } = useGrades(student.classroom_id, student.id);
  const { data: behaviorNotes = [] } = useBehaviorNotes(student.id);
  const { data: attendance = [] } = useAttendance(student.classroom_id);
  
  const initials = student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
  const positiveNotes = behaviorNotes.filter(n => n.type === 'positive').length;
  const negativeNotes = behaviorNotes.filter(n => n.type === 'negative').length;
  const studentAttendance = attendance.filter(a => a.student_id === student.id);
  const absentCount = studentAttendance.filter(a => a.status === 'absent').length;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 bg-card/80 backdrop-blur-sm",
        "active:bg-muted transition-colors cursor-pointer",
        "border-b border-border/30 last:border-b-0"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="w-12 h-12 border border-border/50">
          <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {student.special_needs && (
          <div className="absolute -top-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5">
            <HeartPulse className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {student.is_watched && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-purple-500 rounded-full p-0.5">
            <Eye className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate">{student.name}</h4>
        <p className="text-xs text-muted-foreground truncate">{classroomName}</p>
        
        {/* Mini Stats */}
        <div className="flex items-center gap-2 mt-1">
          {totalScore > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-primary">
              <GraduationCap className="w-3 h-3" />
              {totalScore}
            </span>
          )}
          {absentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-destructive">
              <UserX className="w-3 h-3" />
              {absentCount}
            </span>
          )}
          {positiveNotes > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-green-600">
              <ThumbsUp className="w-3 h-3" />
              {positiveNotes}
            </span>
          )}
          {negativeNotes > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-600">
              <ThumbsDown className="w-3 h-3" />
              {negativeNotes}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronLeft className="w-5 h-5 text-muted-foreground/50 shrink-0" />
    </div>
  );
}

export default function Students() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: classrooms = [], isLoading: loadingClassrooms } = useClassrooms();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.student_id.includes(searchTerm);
    const matchesClass = selectedClassroom === 'all' || s.classroom_id === selectedClassroom;
    return matchesSearch && matchesClass;
  });

  // Group students by classroom
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const classroom = classrooms.find(c => c.id === student.classroom_id);
    const classroomName = classroom?.name || 'بدون صف';
    if (!acc[classroomName]) {
      acc[classroomName] = [];
    }
    acc[classroomName].push(student);
    return acc;
  }, {} as Record<string, typeof students>);

  const getClassroomName = (classroomId: string) => {
    return classrooms.find(c => c.id === classroomId)?.name || 'بدون صف';
  };

  const isLoading = loadingStudents || loadingClassrooms;

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  // Mobile layout - matching Grades page design
  if (isMobile) {
    return (
      <TeacherLayout>
        <div className="space-y-4">
          {/* Title & Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">الطلاب</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={() => setImportDialogOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
              <Button 
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={() => navigate('/teacher/students/new')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Classroom Selector - Dropdown with colors */}
          <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
            <SelectTrigger className="w-full bg-muted/50 border-border/50 rounded-xl">
              <SelectValue placeholder="جميع الصفوف" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">جميع الصفوف</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getHexColor(c.color) }}
                    />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-10 rounded-xl bg-muted/50 border-border/50"
            />
          </div>

          {/* Content */}
          <div className="pb-20">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">لا يوجد طلاب</p>
                <p className="text-sm text-muted-foreground/70 text-center mb-6">أضف طلابك لتبدأ بتتبع حضورهم ودرجاتهم</p>
                <Button onClick={() => navigate('/teacher/students/new')}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة طالب
                </Button>
              </div>
            ) : selectedClassroom === 'all' ? (
              // Grouped by classroom
              Object.entries(groupedStudents).map(([classroomName, classStudents]) => (
                <div key={classroomName} className="mb-4">
                  <div className="py-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {classroomName} ({classStudents.length})
                    </p>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-border/30 bg-card">
                    {classStudents.map((student) => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        classroomName={classroomName}
                        onClick={() => navigate(`/teacher/students/${student.id}`)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Single classroom list
              <div className="rounded-xl overflow-hidden border border-border/30 bg-card">
                {filteredStudents.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    classroomName={getClassroomName(student.classroom_id)}
                    onClick={() => navigate(`/teacher/students/${student.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <ImportStudentsDialog 
          open={importDialogOpen} 
          onOpenChange={setImportDialogOpen}
          defaultClassroomId={selectedClassroom !== 'all' ? selectedClassroom : undefined}
        />
      </TeacherLayout>
    );
  }

  // Desktop layout
  return (
    <TeacherLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الطلاب</h1>
            <p className="text-muted-foreground">{students.length} طالب مسجل</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              استيراد
            </Button>
            <Button onClick={() => navigate('/teacher/students/new')}>
              <Plus className="w-4 h-4 ml-2" />
              طالب جديد
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="جميع الصفوف" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">جميع الصفوف</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getHexColor(c.color) }}
                    />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div 
                key={student.id}
                onClick={() => navigate(`/teacher/students/${student.id}`)}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={student.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{student.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{getClassroomName(student.classroom_id)}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">لا يوجد طلاب</p>
            <Button onClick={() => navigate('/teacher/students/new')}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة طالب
            </Button>
          </div>
        )}
      </div>

      <ImportStudentsDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen}
        defaultClassroomId={selectedClassroom !== 'all' ? selectedClassroom : undefined}
      />
    </TeacherLayout>
  );
}