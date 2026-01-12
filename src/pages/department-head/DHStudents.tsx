import { useState } from 'react';
import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { useDepartmentHeadContext } from '@/contexts/DepartmentHeadContext';
import { useTeacherStudents, useTeacherClassrooms, useTeacherBehaviorNotes } from '@/hooks/useDepartmentHeadData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Search, Loader2, Users, ThumbsUp, ThumbsDown, StickyNote, Calendar, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function StudentsContent() {
  const { selectedTeacherId } = useDepartmentHeadContext();
  const { data: classrooms = [] } = useTeacherClassrooms(selectedTeacherId);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const classroomId = selectedClassroom === 'all' ? undefined : selectedClassroom;
  const { data: students = [], isLoading } = useTeacherStudents(selectedTeacherId, classroomId);
  const { data: behaviorNotes = [] } = useTeacherBehaviorNotes(selectedTeacherId, classroomId);

  const filteredStudents = students.filter((s: any) => 
    s.name.includes(searchTerm)
  );

  const getStudentNotes = (studentId: string) => {
    return behaviorNotes.filter((n: any) => n.student_id === studentId);
  };

  const getClassroomName = (classroomId: string) => {
    const classroom = classrooms.find((c: any) => c.id === classroomId);
    return classroom?.name || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">الطلاب</h1>
        <p className="text-muted-foreground mt-1">عرض جميع طلاب المعلم</p>
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="جميع الصفوف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الصفوف</SelectItem>
            {classrooms.map((classroom: any) => (
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
          {filteredStudents.map((student: any) => {
            const studentNotes = getStudentNotes(student.id);
            const positiveCount = studentNotes.filter((n: any) => n.type === 'positive').length;
            const negativeCount = studentNotes.filter((n: any) => n.type === 'negative').length;
            
            return (
              <Card 
                key={student.id} 
                className="hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-7 w-7 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">رقم: {student.student_id}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <GraduationCap className="h-3 w-3" />
                        <span className="truncate">{getClassroomName(student.classroom_id)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {studentNotes.length > 0 && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">السلوك:</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-4 w-4" />
                          {positiveCount}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <ThumbsDown className="h-4 w-4" />
                          {negativeCount}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">لا يوجد طلاب</h3>
            <p className="text-muted-foreground">
              لا يوجد طلاب مطابقين للبحث
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedStudent?.avatar_url} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{selectedStudent?.name}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {getClassroomName(selectedStudent?.classroom_id)}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-4">
              {selectedStudent?.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">ملاحظات المعلم:</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  السلوكيات والملاحظات
                </h4>
                
                {selectedStudent && getStudentNotes(selectedStudent.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد ملاحظات سلوكية
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent && getStudentNotes(selectedStudent.id).map((note: any) => (
                      <div key={note.id} className={`p-3 rounded-lg border ${
                        note.type === 'positive' 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                          : note.type === 'negative'
                          ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                          : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                      }`}>
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {note.type === 'positive' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                            {note.type === 'negative' && <ThumbsDown className="h-4 w-4 text-red-600" />}
                            {note.type === 'note' && <StickyNote className="h-4 w-4 text-blue-600" />}
                            <Badge variant="outline" className="text-xs">
                              {note.type === 'positive' ? 'إيجابي' : note.type === 'negative' ? 'سلبي' : 'ملاحظة'}
                            </Badge>
                          </div>
                          {note.points !== 0 && (
                            <Badge variant={note.points > 0 ? 'default' : 'destructive'} className="text-xs">
                              {note.points > 0 ? '+' : ''}{note.points}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{note.description}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.date), 'dd MMMM yyyy', { locale: ar })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DHStudents() {
  return (
    <DepartmentHeadViewLayout>
      <StudentsContent />
    </DepartmentHeadViewLayout>
  );
}
