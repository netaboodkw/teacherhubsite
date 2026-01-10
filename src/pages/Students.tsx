import { MainLayout } from '@/components/layout/MainLayout';
import { StudentCard } from '@/components/students/StudentCard';
import { ImportStudentsDialog } from '@/components/students/ImportStudentsDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useStudents } from '@/hooks/useStudents';
import { useClassrooms } from '@/hooks/useClassrooms';
import { Users, Plus, Search, Filter, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Students() {
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

  const getClassroomName = (classroomId: string) => {
    return classrooms.find(c => c.id === classroomId)?.name || '';
  };

  const isLoading = loadingStudents || loadingClassrooms;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">الطلاب</h1>
            <p className="text-muted-foreground mt-1">{students.length} طالب مسجل</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="w-4 h-4 ml-2" />
              استيراد
            </Button>
            <Link to="/students/new">
              <Button className="gradient-hero shadow-md hover:shadow-lg transition-shadow">
                <Plus className="w-4 h-4 ml-2" />
                طالب جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
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
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="جميع الصفوف" />
            </SelectTrigger>
            <SelectContent>
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
              <div key={student.id} className="relative">
                <StudentCard student={student} />
                <span className="absolute top-2 left-2 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  {getClassroomName(student.classroom_id)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="لا يوجد طلاب"
            description="أضف طلابك لتبدأ بتتبع حضورهم ودرجاتهم"
            actionLabel="إضافة طالب"
            onAction={() => {}}
          />
        )}
      </div>

      <ImportStudentsDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen}
        defaultClassroomId={selectedClassroom !== 'all' ? selectedClassroom : undefined}
      />
    </MainLayout>
  );
}
