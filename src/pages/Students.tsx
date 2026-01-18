import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { StudentCard } from '@/components/students/StudentCard';
import { GlassStudentCard } from '@/components/students/GlassStudentCard';
import { ImportStudentsDialog } from '@/components/students/ImportStudentsDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useStudents } from '@/hooks/useStudents';
import { useClassrooms } from '@/hooks/useClassrooms';
import { Users, Plus, Search, Filter, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Input } from '@/components/ui/input';
import { GlassInput } from '@/components/ui/glass-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Students() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: classrooms = [], isLoading: loadingClassrooms } = useClassrooms();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { isLiquidGlass } = useTheme();

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.student_id.includes(searchTerm);
    const matchesClass = selectedClassroom === 'all' || s.classroom_id === selectedClassroom;
    return matchesSearch && matchesClass;
  });

  const getClassroomName = (classroomId: string) => {
    return classrooms.find(c => c.id === classroomId)?.name || '';
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

  const SearchInput = isLiquidGlass ? GlassInput : Input;
  const ActionButton = isLiquidGlass ? GlassButton : Button;

  return (
    <TeacherLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">الطلاب</h1>
            <p className="text-muted-foreground mt-1">{students.length} طالب مسجل</p>
          </div>
          <div className="flex gap-2">
            <ActionButton 
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="w-4 h-4 ml-2" />
              استيراد
            </ActionButton>
            <Link to="/teacher/students/new">
              <ActionButton className={isLiquidGlass ? "" : "gradient-hero shadow-md hover:shadow-lg transition-shadow"}>
                <Plus className="w-4 h-4 ml-2" />
                طالب جديد
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <SearchInput
              placeholder="بحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
            <SelectTrigger className={`w-full sm:w-48 ${isLiquidGlass ? 'rounded-xl bg-background/50 backdrop-blur-md border-border/50' : ''}`}>
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="جميع الصفوف" />
            </SelectTrigger>
            <SelectContent className={isLiquidGlass ? 'rounded-xl backdrop-blur-xl bg-background/90' : ''}>
              <SelectItem value="all">جميع الصفوف</SelectItem>
              {classrooms.map((classroom) => (
                <SelectItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              isLiquidGlass ? (
                <GlassStudentCard 
                  key={student.id}
                  student={student} 
                  classroomName={getClassroomName(student.classroom_id)}
                  onClick={() => navigate(`/teacher/students/${student.id}`)}
                />
              ) : (
                <div key={student.id} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground px-1 truncate">
                    {getClassroomName(student.classroom_id)}
                  </span>
                  <StudentCard 
                    student={student} 
                    onClick={() => navigate(`/teacher/students/${student.id}`)}
                  />
                </div>
              )
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="لا يوجد طلاب"
            description="أضف طلابك لتبدأ بتتبع حضورهم ودرجاتهم"
            actionLabel="إضافة طالب"
            onAction={() => navigate('/teacher/students/new')}
          />
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
