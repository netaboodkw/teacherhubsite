import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { useTeacherClassroom, useTeacherStudents, useTeacherStudentPositions, useTeacherBehaviorNotes } from '@/hooks/useDepartmentHeadData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, User, Loader2, Users, BookOpen, ThumbsUp, ThumbsDown, StickyNote, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function ClassroomViewContent() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  
  const { data: classroom, isLoading: loadingClassroom } = useTeacherClassroom(classroomId || null);
  const { data: students = [], isLoading: loadingStudents } = useTeacherStudents(classroom?.user_id || null, classroomId);
  const { data: positions = [] } = useTeacherStudentPositions(classroomId || null);
  const { data: behaviorNotes = [] } = useTeacherBehaviorNotes(classroom?.user_id || null, classroomId);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create position map
  const positionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positions.forEach((p: any) => {
      map.set(p.student_id, { x: p.position_x, y: p.position_y });
    });
    
    // Add default positions for students without saved positions
    const cardWidth = 110;
    const cardHeight = 130;
    const cols = 5;
    const gap = 20;
    
    students.forEach((student: any, index: number) => {
      if (!map.has(student.id)) {
        const col = index % cols;
        const row = Math.floor(index / cols);
        map.set(student.id, {
          x: col * (cardWidth + gap) + gap,
          y: row * (cardHeight + gap) + gap
        });
      }
    });
    
    return map;
  }, [positions, students]);

  // Get student behavior notes
  const getStudentNotes = (studentId: string) => {
    return behaviorNotes.filter((n: any) => n.student_id === studentId);
  };

  const getShortName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return name;
  };

  // Calculate container height based on student positions
  const containerHeight = useMemo(() => {
    if (students.length === 0) return 400;
    let maxY = 0;
    students.forEach((student: any) => {
      const pos = positionMap.get(student.id);
      if (pos) {
        maxY = Math.max(maxY, pos.y);
      }
    });
    return Math.max(400, maxY + 150);
  }, [students, positionMap]);

  if (loadingClassroom || loadingStudents) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">لم يتم العثور على الصف</p>
          <Button variant="link" onClick={() => navigate('/department-head/classrooms')}>
            العودة للصفوف
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/department-head/classrooms')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          <p className="text-muted-foreground">{classroom.subject}</p>
        </div>
        <Link to={`/department-head/grades?classroom=${classroomId}`}>
          <Button variant="outline">
            <BookOpen className="h-4 w-4 ml-2" />
            عرض الدرجات
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">طالب</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{behaviorNotes.filter((n: any) => n.type === 'positive').length}</p>
                <p className="text-sm text-muted-foreground">إيجابية</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ThumbsDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{behaviorNotes.filter((n: any) => n.type === 'negative').length}</p>
                <p className="text-sm text-muted-foreground">سلبية</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <StickyNote className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{behaviorNotes.filter((n: any) => n.type === 'note').length}</p>
                <p className="text-sm text-muted-foreground">ملاحظات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ترتيب الطلاب في الفصل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا يوجد طلاب في هذا الصف
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative bg-muted/30 rounded-xl border-2 border-dashed border-border overflow-auto"
              style={{ height: containerHeight, minHeight: 400 }}
            >
              {students.map((student: any) => {
                const pos = positionMap.get(student.id) || { x: 0, y: 0 };
                const studentNotes = getStudentNotes(student.id);
                
                return (
                  <div
                    key={student.id}
                    style={{
                      position: 'absolute',
                      left: pos.x,
                      top: pos.y,
                    }}
                    className="flex flex-col items-center p-3 bg-card rounded-xl border-2 border-border/50 shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
                    onClick={() => setSelectedStudent(student)}
                  >
                    {studentNotes.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {studentNotes.length}
                      </Badge>
                    )}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-center font-medium truncate w-full leading-tight px-1 max-w-[90px]">
                      {getShortName(student.name)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                <p className="text-sm text-muted-foreground font-normal">رقم: {selectedStudent?.student_id}</p>
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

export default function DHClassroomView() {
  return (
    <DepartmentHeadViewLayout requireTeacher={false}>
      <ClassroomViewContent />
    </DepartmentHeadViewLayout>
  );
}
