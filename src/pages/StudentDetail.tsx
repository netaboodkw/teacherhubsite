import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClassroom, useClassrooms } from '@/hooks/useClassrooms';
import { useBehaviorNotes, useUpdateBehaviorNote, useDeleteBehaviorNote } from '@/hooks/useBehaviorNotes';
import { useGrades } from '@/hooks/useGrades';
import { useAttendance } from '@/hooks/useAttendance';
import { useClassroomGradingStructure } from '@/hooks/useGradingStructures';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { StudentAvatarUpload } from '@/components/students/StudentAvatarUpload';
import { toast } from 'sonner';
import { 
  ArrowRight, Save, Loader2, User, Plus, Minus, MessageSquare, 
  Trash2, Edit2, Calendar, Clock, HeartPulse, GraduationCap,
  UserX, ThumbsUp, ThumbsDown, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading: loadingStudent } = useStudent(studentId || '');
  const { data: classroom } = useClassroom(student?.classroom_id || '');
  const { data: classrooms = [] } = useClassrooms();
  const { data: behaviorNotes = [], isLoading: loadingNotes } = useBehaviorNotes(studentId);
  const { data: grades = [] } = useGrades(student?.classroom_id || undefined, studentId);
  const { data: allAttendance = [] } = useAttendance(student?.classroom_id || undefined);
  
  // Get grading structure to resolve column names
  const { data: gradingStructure } = useClassroomGradingStructure(classroom ? {
    education_level_id: classroom.education_level_id,
    grade_level_id: classroom.grade_level_id,
    subject_id: classroom.subject_id,
    teacher_template_id: classroom.teacher_template_id,
  } : undefined);
  
  // Create a map of column IDs to their Arabic names
  const columnNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (gradingStructure?.structure?.groups) {
      gradingStructure.structure.groups.forEach(group => {
        group.columns.forEach(col => {
          map[col.id] = col.name_ar;
        });
      });
    }
    return map;
  }, [gradingStructure]);
  
  // Helper to get display name for a grade
  const getGradeDisplayTitle = (gradeTitle: string): string => {
    // Check if it's a column ID (starts with col_)
    if (gradeTitle.startsWith('col_') && columnNamesMap[gradeTitle]) {
      return columnNamesMap[gradeTitle];
    }
    return gradeTitle;
  };
  
  // Filter attendance for this student
  const studentAttendance = allAttendance.filter(a => a.student_id === studentId);
  
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const updateNote = useUpdateBehaviorNote();
  const deleteNote = useDeleteBehaviorNote();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [studentIdValue, setStudentIdValue] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [notes, setNotes] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [editingNote, setEditingNote] = useState<typeof behaviorNotes[0] | null>(null);
  const [editNoteDescription, setEditNoteDescription] = useState('');

  const initials = student?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2) || '';

  // Calculate statistics
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
  const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
  const lateCount = studentAttendance.filter(a => a.status === 'late').length;
  const presentCount = studentAttendance.filter(a => a.status === 'present').length;
  const positiveNotes = behaviorNotes.filter(n => n.type === 'positive').length;
  const negativeNotes = behaviorNotes.filter(n => n.type === 'negative').length;
  const totalPoints = behaviorNotes.reduce((sum, note) => sum + note.points, 0);

  const handleStartEdit = () => {
    if (student) {
      setName(student.name);
      setStudentIdValue(student.student_id);
      setClassroomId(student.classroom_id);
      setNotes(student.notes || '');
      setSpecialNeeds(student.special_needs || false);
      setAvatarUrl(student.avatar_url);
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    if (!studentId) return;

    try {
      await updateStudent.mutateAsync({
        id: studentId,
        name,
        student_id: studentIdValue,
        classroom_id: classroomId,
        notes: notes || null,
        special_needs: specialNeeds,
        avatar_url: avatarUrl,
      });
      setEditMode(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!studentId) return;

    try {
      await deleteStudent.mutateAsync(studentId);
      navigate('/teacher/students');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditNote = (note: typeof behaviorNotes[0]) => {
    setEditingNote(note);
    setEditNoteDescription(note.description);
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;

    try {
      await updateNote.mutateAsync({
        id: editingNote.id,
        description: editNoteDescription,
      });
      setEditingNote(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'positive': return <Plus className="h-4 w-4 text-green-600" />;
      case 'negative': return <Minus className="h-4 w-4 text-red-600" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNoteColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loadingStudent) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  if (!student) {
    return (
      <TeacherLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
          <User className="h-12 w-12 mb-4" />
          <p>الطالب غير موجود</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/teacher/students')}>
            العودة للطلاب
          </Button>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/students')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
            <p className="text-muted-foreground">{classroom?.name || 'الفصل'}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>حذف الطالب</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع بياناته وسجلاته.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{totalScore}</p>
              <p className="text-xs text-muted-foreground">مجموع الدرجات</p>
            </CardContent>
          </Card>
          
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4 text-center">
              <User className="h-6 w-6 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-success">{presentCount}</p>
              <p className="text-xs text-muted-foreground">أيام الحضور</p>
            </CardContent>
          </Card>
          
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 text-center">
              <UserX className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{absentCount}</p>
              <p className="text-xs text-muted-foreground">أيام الغياب</p>
            </CardContent>
          </Card>
          
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-warning">{lateCount}</p>
              <p className="text-xs text-muted-foreground">أيام التأخير</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 text-center">
              <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{positiveNotes}</p>
              <p className="text-xs text-muted-foreground">سلوكيات إيجابية</p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 text-center">
              <ThumbsDown className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{negativeNotes}</p>
              <p className="text-xs text-muted-foreground">سلوكيات سلبية</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-4">
              <div className="relative">
                <StudentAvatarUpload
                  studentId={studentId || ''}
                  currentAvatarUrl={editMode ? avatarUrl : student.avatar_url}
                  initials={initials}
                  onUpload={(url) => setAvatarUrl(url)}
                  size="lg"
                />
                {student.special_needs && !editMode && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1.5">
                    <HeartPulse className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-sm text-muted-foreground font-normal">{student.student_id}</p>
              </div>
            </CardTitle>
            {!editMode && (
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 ml-2" />
                تعديل
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الطالب</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسم الطالب"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">رقم الطالب</Label>
                    <Input
                      id="studentId"
                      value={studentIdValue}
                      onChange={(e) => setStudentIdValue(e.target.value)}
                      placeholder="رقم الطالب"
                    />
                  </div>
                </div>

                {/* Classroom Selection */}
                <div className="space-y-2">
                  <Label>الصف الدراسي</Label>
                  <Select value={classroomId} onValueChange={setClassroomId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classroomId !== student?.classroom_id && (
                    <p className="text-xs text-amber-600">⚠️ سيتم نقل الطالب إلى الصف الجديد</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات عن الطالب..."
                    rows={3}
                  />
                </div>
                
                {/* Special Needs Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <HeartPulse className="w-5 h-5 text-amber-500" />
                    <div>
                      <Label htmlFor="special_needs" className="font-medium">احتياجات خاصة / يحتاج متابعة</Label>
                      <p className="text-sm text-muted-foreground">تفعيل هذا الخيار سيظهر أيقونة خاصة بجانب اسم الطالب</p>
                    </div>
                  </div>
                  <Switch
                    id="special_needs"
                    checked={specialNeeds}
                    onCheckedChange={setSpecialNeeds}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateStudent.isPending}>
                    {updateStudent.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">النقاط:</span>
                    <Badge variant={totalPoints >= 0 ? 'default' : 'destructive'} className="text-lg px-3 py-1">
                      {totalPoints}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">الفصل:</span>
                    <span className="font-medium">{classroom?.name}</span>
                  </div>
                </div>
                {student.notes && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">ملاحظات:</p>
                    <p className="text-foreground">{student.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades Summary */}
        {grades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                آخر الدرجات
                <Badge variant="secondary" className="mr-auto">{grades.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {grades.slice(0, 12).map((grade) => (
                  <div key={grade.id} className="p-3 rounded-lg bg-muted/50 text-center space-y-1">
                    <p className="text-lg font-bold text-primary">{grade.score}/{grade.max_score}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2" title={getGradeDisplayTitle(grade.title)}>{getGradeDisplayTitle(grade.title)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Behavior Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              سجل السلوكيات
              <Badge variant="secondary" className="mr-auto">{behaviorNotes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingNotes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : behaviorNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد ملاحظات سلوكية</p>
              </div>
            ) : (
              <div className="space-y-3">
                {behaviorNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg border ${getNoteColor(note.type)} flex items-start gap-3 group`}
                  >
                    <div className="mt-1">{getNoteIcon(note.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{note.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.date), 'dd MMMM yyyy', { locale: ar })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(note.created_at), 'HH:mm')}
                        </span>
                        {note.points !== 0 && (
                          <Badge variant="outline" className="text-xs">
                            {note.points > 0 ? '+' : ''}{note.points}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditNote(note)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الملاحظة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذه الملاحظة؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteNote(note.id)} 
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الملاحظة</DialogTitle>
            <DialogDescription>
              قم بتعديل وصف الملاحظة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDescription">الوصف</Label>
              <Textarea
                id="editDescription"
                value={editNoteDescription}
                onChange={(e) => setEditNoteDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveNote} disabled={updateNote.isPending}>
              {updateNote.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}
