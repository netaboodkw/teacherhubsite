import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClassroom, useClassrooms } from '@/hooks/useClassrooms';
import { useBehaviorNotes, useUpdateBehaviorNote, useDeleteBehaviorNote } from '@/hooks/useBehaviorNotes';
import { useGrades } from '@/hooks/useGrades';
import { useAttendance } from '@/hooks/useAttendance';
import { useClassroomGradingStructure } from '@/hooks/useGradingStructures';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { AttendanceHistoryDialog } from '@/components/attendance/AttendanceHistoryDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowRight, Save, Loader2, User, Plus, Minus, MessageSquare, 
  Trash2, Edit2, Calendar, Clock, HeartPulse, GraduationCap,
  UserX, ThumbsUp, ThumbsDown, Phone, Eye, X
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: student, isLoading: loadingStudent } = useStudent(studentId || '');
  const { data: classroom } = useClassroom(student?.classroom_id || '');
  const { data: classrooms = [] } = useClassrooms();
  const { data: behaviorNotes = [], isLoading: loadingNotes } = useBehaviorNotes(studentId);
  const { data: grades = [] } = useGrades(student?.classroom_id || undefined, studentId);
  const { data: allAttendance = [] } = useAttendance(student?.classroom_id || undefined);
  
  const { data: gradingStructure } = useClassroomGradingStructure(classroom ? {
    education_level_id: classroom.education_level_id,
    grade_level_id: classroom.grade_level_id,
    subject_id: classroom.subject_id,
    teacher_template_id: classroom.teacher_template_id,
  } : undefined);
  
  const columnNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (gradingStructure?.structure?.groups) {
      gradingStructure.structure.groups.forEach(group => {
        if (group.id) map[group.id] = group.name_ar;
        group.columns.forEach(col => {
          map[col.id] = col.name_ar;
          if (col.id.startsWith('col_')) {
            map[col.id.replace('col_', '')] = col.name_ar;
          }
        });
      });
    }
    return map;
  }, [gradingStructure]);
  
  const getGradeDisplayTitle = (gradeTitle: string): string => {
    if (columnNamesMap[gradeTitle]) return columnNamesMap[gradeTitle];
    if (gradeTitle.startsWith('col_')) {
      const withoutPrefix = gradeTitle.replace('col_', '');
      if (columnNamesMap[withoutPrefix]) return columnNamesMap[withoutPrefix];
    }
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    const partialUuidPattern = /^[a-f0-9]{6,}$/i;
    if (uuidPattern.test(gradeTitle) || partialUuidPattern.test(gradeTitle)) {
      if (columnNamesMap[gradeTitle]) return columnNamesMap[gradeTitle];
      return 'درجة';
    }
    if (/^(col_|group_|column_|grade_)/i.test(gradeTitle)) {
      const cleanId = gradeTitle.replace(/^(col_|group_|column_|grade_)/i, '');
      if (columnNamesMap[cleanId]) return columnNamesMap[cleanId];
    }
    if (/^[a-zA-Z0-9_]+$/.test(gradeTitle) && /\d/.test(gradeTitle) && gradeTitle.length > 10) {
      return 'درجة';
    }
    return gradeTitle;
  };

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
  const [isWatched, setIsWatched] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const [editingNote, setEditingNote] = useState<typeof behaviorNotes[0] | null>(null);
  const [editNoteDescription, setEditNoteDescription] = useState('');
  const [attendanceDialogType, setAttendanceDialogType] = useState<'absent' | 'late' | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const initials = student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '';

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
      setIsWatched((student as any).is_watched || false);
      setAvatarUrl(student.avatar_url);
      setParentName((student as any).parent_name || '');
      setParentPhone((student as any).parent_phone || '');
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
        is_watched: isWatched,
        avatar_url: avatarUrl,
        parent_name: parentName || null,
        parent_phone: parentPhone || null,
      } as any);
      setEditMode(false);
    } catch (error) {}
  };

  const handleDelete = async () => {
    if (!studentId) return;
    try {
      await deleteStudent.mutateAsync(studentId);
      navigate('/teacher/students');
    } catch (error) {}
  };

  const handleEditNote = (note: typeof behaviorNotes[0]) => {
    setEditingNote(note);
    setEditNoteDescription(note.description);
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;
    try {
      await updateNote.mutateAsync({ id: editingNote.id, description: editNoteDescription });
      setEditingNote(null);
    } catch (error) {}
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
    } catch (error) {}
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
      case 'positive': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loadingStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground p-4">
        <User className="h-12 w-12 mb-4" />
        <p>الطالب غير موجود</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/teacher/students')}>
          العودة للطلاب
        </Button>
      </div>
    );
  }

  // iOS Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        {/* iOS Header */}
        <div className={cn(
          "sticky top-0 z-20",
          "bg-background/60 backdrop-blur-2xl backdrop-saturate-200",
          "border-b border-border/10",
          "pt-[env(safe-area-inset-top)]"
        )}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/students')} className="h-10 w-10">
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="flex-1" />
              {!editMode ? (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleStartEdit} className="h-10 w-10">
                    <Edit2 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)} className="h-10 w-10 text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} className="h-10">
                    <X className="h-5 w-5" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateStudent.isPending} className="h-10">
                    {updateStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-24 space-y-4">
          {/* Student Profile Header */}
          <div className="flex flex-col items-center py-4">
            <div className="relative mb-3">
              {editMode ? (
                <StudentAvatarUpload
                  studentId={studentId || ''}
                  currentAvatarUrl={avatarUrl}
                  initials={initials}
                  onUpload={(url) => setAvatarUrl(url)}
                  size="lg"
                />
              ) : (
                <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                  <AvatarImage src={student.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
              )}
              {student.special_needs && !editMode && (
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1.5 shadow-lg">
                  <HeartPulse className="w-4 h-4 text-white" />
                </div>
              )}
              {(student as any).is_watched && !editMode && (
                <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1.5 shadow-lg">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            {editMode ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center text-xl font-bold h-12 max-w-xs"
                placeholder="اسم الطالب"
              />
            ) : (
              <>
                <h1 className="text-xl font-bold text-center">{student.name}</h1>
                <p className="text-sm text-muted-foreground">{classroom?.name}</p>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <GraduationCap className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold text-primary">{totalScore}</p>
              <p className="text-[10px] text-muted-foreground">الدرجات</p>
            </div>
            <div 
              className="p-3 rounded-xl bg-destructive/10 text-center cursor-pointer active:scale-95 transition-transform"
              onClick={() => absentCount > 0 && setAttendanceDialogType('absent')}
            >
              <UserX className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold text-destructive">{absentCount}</p>
              <p className="text-[10px] text-muted-foreground">غياب</p>
            </div>
            <div 
              className="p-3 rounded-xl bg-amber-500/10 text-center cursor-pointer active:scale-95 transition-transform"
              onClick={() => lateCount > 0 && setAttendanceDialogType('late')}
            >
              <Clock className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-lg font-bold text-amber-600">{lateCount}</p>
              <p className="text-[10px] text-muted-foreground">تأخير</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-green-500/10 text-center">
              <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold text-green-600">{positiveNotes}</p>
              <p className="text-[10px] text-muted-foreground">إيجابي</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-center">
              <ThumbsDown className="h-5 w-5 mx-auto mb-1 text-red-600" />
              <p className="text-lg font-bold text-red-600">{negativeNotes}</p>
              <p className="text-[10px] text-muted-foreground">سلبي</p>
            </div>
            <div className={cn(
              "p-3 rounded-xl text-center",
              totalPoints >= 0 ? "bg-green-500/10" : "bg-red-500/10"
            )}>
              <p className={cn("text-lg font-bold", totalPoints >= 0 ? "text-green-600" : "text-red-600")}>
                {totalPoints > 0 ? '+' : ''}{totalPoints}
              </p>
              <p className="text-[10px] text-muted-foreground">النقاط</p>
            </div>
          </div>

          {/* Edit Form */}
          {editMode && (
            <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="space-y-2">
                <Label>رقم الطالب</Label>
                <Input value={studentIdValue} onChange={(e) => setStudentIdValue(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label>الصف</Label>
                <Select value={classroomId} onValueChange={setClassroomId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-amber-500" />
                  <span className="text-sm">احتياجات خاصة</span>
                </div>
                <Switch checked={specialNeeds} onCheckedChange={setSpecialNeeds} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">تحت المتابعة</span>
                </div>
                <Switch checked={isWatched} onCheckedChange={setIsWatched} />
              </div>

              <div className="space-y-3 p-3 rounded-xl bg-background">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">بيانات ولي الأمر</span>
                </div>
                <Input placeholder="اسم ولي الأمر" value={parentName} onChange={(e) => setParentName(e.target.value)} />
                <Input placeholder="رقم الهاتف" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} dir="ltr" />
              </div>
            </div>
          )}

          {/* Student Info (View Mode) */}
          {!editMode && (
            <>
              {student.notes && (
                <div className="p-4 rounded-2xl bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm">{student.notes}</p>
                </div>
              )}

              {((student as any).parent_name || (student as any).parent_phone) && (
                <div className="p-4 rounded-2xl bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">ولي الأمر</span>
                      </div>
                      {(student as any).parent_name && <p className="font-medium">{(student as any).parent_name}</p>}
                      {(student as any).parent_phone && <p className="text-sm text-muted-foreground" dir="ltr">{(student as any).parent_phone}</p>}
                    </div>
                    {(student as any).parent_phone && (
                      <a
                        href={`https://wa.me/965${(student as any).parent_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium"
                      >
                        واتساب
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Grades */}
          {grades.length > 0 && !editMode && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                الدرجات
                <Badge variant="secondary">{grades.length}</Badge>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {grades.slice(0, 9).map((grade) => (
                  <div key={grade.id} className="p-2 rounded-xl bg-card border border-border/50 text-center">
                    <p className="text-sm font-bold text-primary">{grade.score}/{grade.max_score}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{getGradeDisplayTitle(grade.title)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavior Notes */}
          {!editMode && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                سجل السلوكيات
                <Badge variant="secondary">{behaviorNotes.length}</Badge>
              </h3>
              
              {behaviorNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد ملاحظات</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {behaviorNotes.map((note) => (
                    <div
                      key={note.id}
                      className={cn("p-3 rounded-xl border", getNoteColor(note.type))}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{getNoteIcon(note.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{note.description}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {format(new Date(note.date), 'dd MMM yyyy', { locale: ar })}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleEditNote(note)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl" className="max-w-[90vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الطالب</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد من حذف هذا الطالب؟</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel className="h-12">إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="h-12 bg-destructive">حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent dir="rtl" className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>تعديل الملاحظة</DialogTitle>
            </DialogHeader>
            <Textarea value={editNoteDescription} onChange={(e) => setEditNoteDescription(e.target.value)} rows={3} />
            <DialogFooter className="flex-row-reverse gap-2">
              <Button variant="outline" onClick={() => setEditingNote(null)}>إلغاء</Button>
              <Button onClick={handleSaveNote} disabled={updateNote.isPending}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Attendance History Dialog */}
        <AttendanceHistoryDialog
          open={attendanceDialogType !== null}
          onOpenChange={() => setAttendanceDialogType(null)}
          studentName={student?.name || ''}
          attendanceRecords={studentAttendance}
          type={attendanceDialogType || 'absent'}
        />
      </div>
    );
  }

  // Desktop Layout
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
          {!editMode && (
            <Button variant="outline" onClick={handleStartEdit}>
              <Edit2 className="h-4 w-4 ml-2" />
              تعديل
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>حذف الطالب</AlertDialogTitle>
                <AlertDialogDescription>هل أنت متأكد من حذف هذا الطالب؟</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive">حذف</AlertDialogAction>
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
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 text-center">
              <User className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-muted-foreground">أيام الحضور</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20 cursor-pointer hover:bg-destructive/20" onClick={() => absentCount > 0 && setAttendanceDialogType('absent')}>
            <CardContent className="p-4 text-center">
              <UserX className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{absentCount}</p>
              <p className="text-xs text-muted-foreground">أيام الغياب</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/20 cursor-pointer hover:bg-amber-500/20" onClick={() => lateCount > 0 && setAttendanceDialogType('late')}>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
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
          <CardHeader>
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
                <p className="text-sm text-muted-foreground font-normal">{student.student_id}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الطالب</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الطالب</Label>
                    <Input value={studentIdValue} onChange={(e) => setStudentIdValue(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select value={classroomId} onValueChange={setClassroomId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {classrooms.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <HeartPulse className="w-5 h-5 text-amber-500" />
                    <Label>احتياجات خاصة</Label>
                  </div>
                  <Switch checked={specialNeeds} onCheckedChange={setSpecialNeeds} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-purple-500" />
                    <Label>تحت المتابعة</Label>
                  </div>
                  <Switch checked={isWatched} onCheckedChange={setIsWatched} />
                </div>
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">بيانات ولي الأمر</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="اسم ولي الأمر" value={parentName} onChange={(e) => setParentName(e.target.value)} />
                    <Input placeholder="رقم الهاتف" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateStudent.isPending}>
                    {updateStudent.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    <Save className="h-4 w-4 ml-2" />
                    حفظ
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">النقاط:</span>
                    <Badge variant={totalPoints >= 0 ? 'default' : 'destructive'}>{totalPoints}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">الفصل:</span>
                    <span className="font-medium">{classroom?.name}</span>
                  </div>
                </div>
                {student.notes && <p className="text-muted-foreground">{student.notes}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades */}
        {grades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                الدرجات
                <Badge variant="secondary">{grades.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {grades.slice(0, 12).map((grade) => (
                  <div key={grade.id} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold text-primary">{grade.score}/{grade.max_score}</p>
                    <p className="text-xs text-muted-foreground truncate">{getGradeDisplayTitle(grade.title)}</p>
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
              <Badge variant="secondary">{behaviorNotes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {behaviorNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد ملاحظات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {behaviorNotes.map((note) => (
                  <div key={note.id} className={cn("p-4 rounded-lg border flex items-start gap-3 group", getNoteColor(note.type))}>
                    <div className="mt-1">{getNoteIcon(note.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{note.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.date), 'dd MMMM yyyy', { locale: ar })}
                        </span>
                        {note.points !== 0 && <Badge variant="outline">{note.points > 0 ? '+' : ''}{note.points}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditNote(note)}>
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
                            <AlertDialogDescription>هل أنت متأكد؟</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive">حذف</AlertDialogAction>
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

      {/* Dialogs */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الملاحظة</DialogTitle>
            <DialogDescription>قم بتعديل وصف الملاحظة</DialogDescription>
          </DialogHeader>
          <Textarea value={editNoteDescription} onChange={(e) => setEditNoteDescription(e.target.value)} rows={3} />
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setEditingNote(null)}>إلغاء</Button>
            <Button onClick={handleSaveNote} disabled={updateNote.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttendanceHistoryDialog
        open={attendanceDialogType !== null}
        onOpenChange={() => setAttendanceDialogType(null)}
        studentName={student?.name || ''}
        attendanceRecords={studentAttendance}
        type={attendanceDialogType || 'absent'}
      />
    </TeacherLayout>
  );
}
