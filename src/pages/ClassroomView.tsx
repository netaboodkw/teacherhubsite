import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useClassroom } from '@/hooks/useClassrooms';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowRight, User, Plus, Minus, MessageSquare, Save, Loader2 } from 'lucide-react';

interface StudentPosition {
  student_id: string;
  position_x: number;
  position_y: number;
}

interface SelectedStudent {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function ClassroomView() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classroom, isLoading: loadingClassroom } = useClassroom(classroomId || '');
  const { data: students = [], isLoading: loadingStudents } = useStudents(classroomId);
  
  const [positions, setPositions] = useState<StudentPosition[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [noteType, setNoteType] = useState<'positive' | 'negative' | 'note'>('positive');
  const [noteDescription, setNoteDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);

  // Load existing positions
  useEffect(() => {
    const loadPositions = async () => {
      if (!classroomId || !user) return;

      try {
        const { data, error } = await supabase
          .from('student_positions')
          .select('student_id, position_x, position_y')
          .eq('classroom_id', classroomId);

        if (error) throw error;

        if (data && data.length > 0) {
          setPositions(data);
        } else if (students.length > 0) {
          // Initialize default positions in a grid
          const defaultPositions = students.map((student, index) => ({
            student_id: student.id,
            position_x: (index % 5) * 120 + 50,
            position_y: Math.floor(index / 5) * 120 + 50,
          }));
          setPositions(defaultPositions);
        }
      } catch (error) {
        console.error('Error loading positions:', error);
      } finally {
        setLoadingPositions(false);
      }
    };

    if (!loadingStudents && students.length > 0) {
      loadPositions();
    } else if (!loadingStudents) {
      setLoadingPositions(false);
    }
  }, [classroomId, students, user, loadingStudents]);

  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData('studentId', studentId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;

    setPositions(prev => {
      const existing = prev.find(p => p.student_id === studentId);
      if (existing) {
        return prev.map(p =>
          p.student_id === studentId
            ? { ...p, position_x: Math.max(0, x), position_y: Math.max(0, y) }
            : p
        );
      }
      return [...prev, { student_id: studentId, position_x: x, position_y: y }];
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const savePositions = async () => {
    if (!classroomId || !user) return;

    setSaving(true);
    try {
      // Delete existing positions
      await supabase
        .from('student_positions')
        .delete()
        .eq('classroom_id', classroomId);

      // Insert new positions
      const positionsToInsert = positions.map(p => ({
        student_id: p.student_id,
        classroom_id: classroomId,
        position_x: p.position_x,
        position_y: p.position_y,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('student_positions')
        .insert(positionsToInsert);

      if (error) throw error;

      toast.success('تم حفظ ترتيب الطلاب بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentClick = (student: SelectedStudent) => {
    setSelectedStudent(student);
    setNoteType('positive');
    setNoteDescription('');
  };

  const saveNote = async () => {
    if (!selectedStudent || !noteDescription.trim() || !classroomId || !user) return;

    setSaving(true);
    try {
      const points = noteType === 'positive' ? 1 : noteType === 'negative' ? -1 : 0;

      const { error } = await supabase
        .from('behavior_notes')
        .insert({
          student_id: selectedStudent.id,
          classroom_id: classroomId,
          user_id: user.id,
          type: noteType,
          description: noteDescription.trim(),
          points,
        });

      if (error) throw error;

      toast.success('تم حفظ الملاحظة بنجاح');

      setSelectedStudent(null);
      setNoteDescription('');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getStudentPosition = (studentId: string) => {
    return positions.find(p => p.student_id === studentId) || { position_x: 0, position_y: 0 };
  };

  if (loadingClassroom) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">الفصل غير موجود</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/classrooms')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{classroom.name}</h1>
              <p className="text-sm text-muted-foreground">{classroom.subject}</p>
            </div>
          </div>
          <Button onClick={savePositions} disabled={saving}>
            {saving ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            حفظ الترتيب
          </Button>
        </div>
      </div>

      {/* Classroom Area */}
      <div className="container mx-auto p-4">
        {/* Whiteboard */}
        <Card className="mb-6 bg-muted">
          <CardContent className="p-8 text-center">
            <div className="bg-background border-2 border-dashed rounded-lg p-6">
              <p className="text-lg font-medium text-muted-foreground">السبورة</p>
            </div>
          </CardContent>
        </Card>

        {/* Students Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الطلاب</CardTitle>
            <p className="text-sm text-muted-foreground">
              اسحب الطلاب لترتيبهم • اضغط على طالب لإضافة ملاحظة
            </p>
          </CardHeader>
          <CardContent>
            {loadingPositions || loadingStudents ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <User className="h-12 w-12 mb-4" />
                <p>لا يوجد طلاب في هذا الفصل</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate(`/students/new?classroomId=${classroomId}`)}
                >
                  إضافة طالب
                </Button>
              </div>
            ) : (
              <div
                className="relative bg-muted/30 rounded-lg min-h-[500px] overflow-hidden"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {students.map((student) => {
                  const pos = getStudentPosition(student.id);
                  return (
                    <div
                      key={student.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, student.id)}
                      onClick={() => handleStudentClick({
                        id: student.id,
                        name: student.name,
                        avatar_url: student.avatar_url,
                      })}
                      className="absolute cursor-pointer transition-shadow hover:shadow-lg"
                      style={{
                        left: pos.position_x,
                        top: pos.position_y,
                      }}
                    >
                      <div className="flex flex-col items-center p-2 bg-card rounded-lg border shadow-sm w-20">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-center font-medium truncate w-full">
                          {student.name.split(' ')[0]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Note Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedStudent?.avatar_url ? (
                  <img
                    src={selectedStudent.avatar_url}
                    alt={selectedStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              أضف ملاحظة أو نقاط لهذا الطالب
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع الملاحظة</Label>
              <RadioGroup
                value={noteType}
                onValueChange={(v) => setNoteType(v as 'positive' | 'negative' | 'note')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="positive" id="positive" />
                  <Label htmlFor="positive" className="flex items-center gap-1 text-green-600">
                    <Plus className="h-4 w-4" />
                    إيجابي
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="negative" id="negative" />
                  <Label htmlFor="negative" className="flex items-center gap-1 text-red-600">
                    <Minus className="h-4 w-4" />
                    سلبي
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="note" id="note" />
                  <Label htmlFor="note" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    ملاحظة
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="اكتب الملاحظة هنا..."
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={saveNote} 
              className="w-full"
              disabled={saving || !noteDescription.trim()}
            >
              {saving ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              حفظ الملاحظة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
