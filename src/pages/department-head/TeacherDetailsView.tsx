import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowRight, Users, User, School, BookOpen, Loader2,
  GraduationCap, ClipboardList, TrendingUp, AlertCircle
} from 'lucide-react';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  color: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  classroom_id: string;
  special_needs: boolean;
  avatar_url: string | null;
}

interface Grade {
  id: string;
  student_id: string;
  title: string;
  score: number;
  max_score: number;
  type: string;
  date: string;
}

interface BehaviorNote {
  id: string;
  student_id: string;
  type: string;
  description: string;
  points: number;
  date: string;
}

export default function TeacherDetailsView() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [behaviorNotes, setBehaviorNotes] = useState<BehaviorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  useEffect(() => {
    const loadTeacherData = async () => {
      if (!teacherId) return;

      setLoading(true);
      try {
        // Load teacher profile
        const { data: teacherData, error: teacherError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', teacherId)
          .maybeSingle();

        if (teacherError) throw teacherError;
        setTeacher(teacherData);

        // Load classrooms
        const { data: classroomsData, error: classroomsError } = await supabase
          .from('classrooms')
          .select('*')
          .eq('user_id', teacherId)
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (classroomsError) throw classroomsError;
        setClassrooms(classroomsData || []);

        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', teacherId)
          .order('name');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Load grades
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select('*')
          .eq('user_id', teacherId)
          .order('date', { ascending: false })
          .limit(100);

        if (gradesError) throw gradesError;
        setGrades(gradesData || []);

        // Load behavior notes
        const { data: notesData, error: notesError } = await supabase
          .from('behavior_notes')
          .select('*')
          .eq('user_id', teacherId)
          .order('date', { ascending: false })
          .limit(100);

        if (notesError) throw notesError;
        setBehaviorNotes(notesData || []);

      } catch (error) {
        console.error('Error loading teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [teacherId]);

  const filteredStudents = selectedClassroomId 
    ? students.filter(s => s.classroom_id === selectedClassroomId)
    : students;

  const filteredGrades = selectedClassroomId
    ? grades.filter(g => {
        const student = students.find(s => s.id === g.student_id);
        return student?.classroom_id === selectedClassroomId;
      })
    : grades;

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'غير معروف';
  };

  const getClassroomName = (classroomId: string) => {
    return classrooms.find(c => c.id === classroomId)?.name || 'غير معروف';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">لم يتم العثور على المعلم</h3>
            <Button onClick={() => navigate('/department-head')}>
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/department-head')}
            className="mb-4"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={teacher.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{teacher.full_name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {teacher.subject && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {teacher.subject}
                  </span>
                )}
                {teacher.school_name && (
                  <span className="flex items-center gap-1">
                    <School className="h-4 w-4" />
                    {teacher.school_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{classrooms.length}</p>
              <p className="text-sm text-muted-foreground">فصل</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">طالب</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{grades.length}</p>
              <p className="text-sm text-muted-foreground">درجة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ClipboardList className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{behaviorNotes.length}</p>
              <p className="text-sm text-muted-foreground">ملاحظة سلوكية</p>
            </CardContent>
          </Card>
        </div>

        {/* Classroom Filter */}
        <Card>
          <CardHeader>
            <CardTitle>الفصول الدراسية</CardTitle>
            <CardDescription>اختر فصلاً لتصفية البيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedClassroomId === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedClassroomId(null)}
              >
                الكل
              </Button>
              {classrooms.map((classroom) => (
                <Button
                  key={classroom.id}
                  variant={selectedClassroomId === classroom.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedClassroomId(classroom.id)}
                >
                  {classroom.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">الطلاب ({filteredStudents.length})</TabsTrigger>
            <TabsTrigger value="grades">الدرجات ({filteredGrades.length})</TabsTrigger>
            <TabsTrigger value="behavior">السلوك ({behaviorNotes.length})</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>الرقم التعريفي</TableHead>
                      <TableHead>الفصل</TableHead>
                      <TableHead>احتياجات خاصة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar_url || undefined} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                        <TableCell>{getClassroomName(student.classroom_id)}</TableCell>
                        <TableCell>
                          {student.special_needs && (
                            <Badge variant="outline">نعم</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          لا يوجد طلاب
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrades.slice(0, 50).map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{getStudentName(grade.student_id)}</TableCell>
                        <TableCell>{grade.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {grade.score} / {grade.max_score}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(grade.date).toLocaleDateString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                    {filteredGrades.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد درجات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>النقاط</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {behaviorNotes.slice(0, 50).map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{getStudentName(note.student_id)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={note.type === 'positive' ? 'default' : note.type === 'negative' ? 'destructive' : 'outline'}
                          >
                            {note.type === 'positive' ? 'إيجابي' : note.type === 'negative' ? 'سلبي' : 'ملاحظة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{note.description}</TableCell>
                        <TableCell>
                          <span className={note.points > 0 ? 'text-green-600' : note.points < 0 ? 'text-red-600' : ''}>
                            {note.points > 0 ? '+' : ''}{note.points}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(note.date).toLocaleDateString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                    {behaviorNotes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد ملاحظات سلوكية
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
