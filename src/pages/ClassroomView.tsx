import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useClassroom } from '@/hooks/useClassrooms';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowRight, User, Plus, Minus, MessageSquare, Save, Loader2, 
  Move, Check, X, Clock, FileText, ClipboardCheck, Users
} from 'lucide-react';

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

interface DragState {
  isDragging: boolean;
  studentId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export default function ClassroomView() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classroom, isLoading: loadingClassroom } = useClassroom(classroomId || '');
  const { data: students = [], isLoading: loadingStudents } = useStudents(classroomId);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [positions, setPositions] = useState<StudentPosition[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [dialogMode, setDialogMode] = useState<'note' | 'attendance'>('note');
  const [noteType, setNoteType] = useState<'positive' | 'negative' | 'note'>('positive');
  const [noteDescription, setNoteDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'arrange' | 'attendance'>('notes');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    studentId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const GRID_SIZE = 80;
  const STUDENT_SIZE = 70;

  const today = new Date().toISOString().split('T')[0];

  // Load existing positions and handle new students
  useEffect(() => {
    const loadPositions = async () => {
      if (!classroomId || !user) return;

      try {
        const { data, error } = await supabase
          .from('student_positions')
          .select('student_id, position_x, position_y')
          .eq('classroom_id', classroomId);

        if (error) throw error;

        const existingPositions = data || [];
        const existingStudentIds = new Set(existingPositions.map(p => p.student_id));
        
        // Find students without positions (new students)
        const studentsWithoutPositions = students.filter(s => !existingStudentIds.has(s.id));
        
        if (studentsWithoutPositions.length > 0) {
          // Calculate starting position for new students
          const cols = 5;
          let maxY = 0;
          existingPositions.forEach(p => {
            if (p.position_y > maxY) maxY = p.position_y;
          });
          
          const startRow = existingPositions.length > 0 ? Math.floor(maxY / GRID_SIZE) + 1 : 0;
          
          const newPositions = studentsWithoutPositions.map((student, index) => ({
            student_id: student.id,
            position_x: (index % cols) * GRID_SIZE + 20,
            position_y: (startRow + Math.floor(index / cols)) * GRID_SIZE + 20,
          }));
          
          setPositions([...existingPositions, ...newPositions]);
        } else if (existingPositions.length > 0) {
          setPositions(existingPositions);
        } else if (students.length > 0) {
          // No positions at all, create default for all students
          const cols = 5;
          const defaultPositions = students.map((student, index) => ({
            student_id: student.id,
            position_x: (index % cols) * GRID_SIZE + 20,
            position_y: Math.floor(index / cols) * GRID_SIZE + 20,
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

  // Load attendance for selected period
  useEffect(() => {
    const loadAttendance = async () => {
      if (!classroomId || !user) return;

      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('student_id, status')
          .eq('classroom_id', classroomId)
          .eq('date', today)
          .eq('period', selectedPeriod);

        if (error) throw error;

        if (data) {
          setAttendanceRecords(data.map(r => ({
            student_id: r.student_id,
            status: r.status as AttendanceRecord['status'],
          })));
        } else {
          setAttendanceRecords([]);
        }
      } catch (error) {
        console.error('Error loading attendance:', error);
      }
    };

    loadAttendance();
  }, [classroomId, user, today, selectedPeriod]);

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const handlePointerDown = (e: React.PointerEvent, studentId: string) => {
    if (activeTab !== 'arrange') return;
    
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    const pos = positions.find(p => p.student_id === studentId);
    if (!pos) return;

    setDragState({
      isDragging: true,
      studentId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: pos.position_x,
      offsetY: pos.position_y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.studentId || !containerRef.current) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = dragState.offsetX + deltaX;
    let newY = dragState.offsetY + deltaY;

    // Always snap to grid while dragging (Snapchat-like behavior)
    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    // Constrain to container
    newX = Math.max(0, Math.min(newX, snapToGrid(containerRect.width - STUDENT_SIZE)));
    newY = Math.max(0, Math.min(newY, snapToGrid(containerRect.height - STUDENT_SIZE)));

    setPositions(prev =>
      prev.map(p =>
        p.student_id === dragState.studentId
          ? { ...p, position_x: newX, position_y: newY }
          : p
      )
    );
  };

  const handlePointerUp = () => {
    if (!dragState.isDragging || !dragState.studentId) return;

    // Already snapped during drag, no need to snap again

    setDragState({
      isDragging: false,
      studentId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handleStudentTap = (student: SelectedStudent) => {
    if (dragState.isDragging) return;
    
    if (activeTab === 'attendance') {
      cycleAttendance(student.id);
    } else if (activeTab === 'notes') {
      setSelectedStudent(student);
      setDialogMode('note');
      setNoteType('positive');
      setNoteDescription('');
    }
  };

  const getAttendanceStatus = (studentId: string): AttendanceRecord['status'] | null => {
    return attendanceRecords.find(r => r.student_id === studentId)?.status || null;
  };

  const cycleAttendance = (studentId: string) => {
    const currentStatus = getAttendanceStatus(studentId);
    const statusOrder: (AttendanceRecord['status'] | null)[] = [null, 'present', 'absent', 'late', 'excused'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    if (nextStatus === null) {
      setAttendanceRecords(prev => prev.filter(r => r.student_id !== studentId));
    } else {
      setAttendanceRecords(prev => {
        const exists = prev.find(r => r.student_id === studentId);
        if (exists) {
          return prev.map(r => r.student_id === studentId ? { ...r, status: nextStatus } : r);
        }
        return [...prev, { student_id: studentId, status: nextStatus }];
      });
    }
  };

  const setAllAttendance = (status: AttendanceRecord['status']) => {
    const allRecords = students.map(s => ({
      student_id: s.id,
      status,
    }));
    setAttendanceRecords(allRecords);
  };

  const getAttendanceIcon = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present': return <Check className="h-4 w-4 text-green-600" />;
      case 'absent': return <X className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'excused': return <FileText className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getAttendanceBorder = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present': return 'border-green-500 bg-green-50';
      case 'absent': return 'border-red-500 bg-red-50';
      case 'late': return 'border-yellow-500 bg-yellow-50';
      case 'excused': return 'border-blue-500 bg-blue-50';
      default: return 'border-transparent';
    }
  };

  const savePositions = async () => {
    if (!classroomId || !user) return;

    setSaving(true);
    try {
      await supabase
        .from('student_positions')
        .delete()
        .eq('classroom_id', classroomId);

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

  const saveAttendance = async () => {
    if (!classroomId || !user) return;

    setSaving(true);
    try {
      // Delete records for this classroom, date, and period
      await supabase
        .from('attendance_records')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('date', today)
        .eq('period', selectedPeriod);

      if (attendanceRecords.length > 0) {
        const recordsToInsert = attendanceRecords.map(r => ({
          student_id: r.student_id,
          classroom_id: classroomId,
          user_id: user.id,
          date: today,
          status: r.status,
          period: selectedPeriod,
        }));

        const { error } = await supabase
          .from('attendance_records')
          .insert(recordsToInsert);

        if (error) throw error;
      }

      toast.success(`تم حفظ حضور الحصة ${selectedPeriod} بنجاح`);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
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

  const getShortName = (fullName: string) => {
    const parts = fullName.split(' ');
    return parts.slice(0, 2).join(' ');
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/classrooms')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{classroom.name}</h1>
              <p className="text-sm text-muted-foreground">{classroom.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'notes' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('arrange')}>
                  <Move className="h-4 w-4 ml-1" />
                  ترتيب الطلاب
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('attendance')}>
                  <ClipboardCheck className="h-4 w-4 ml-1" />
                  تسجيل الحضور
                </Button>
              </>
            )}
            {activeTab === 'arrange' && (
              <>
                <Button variant="outline" onClick={() => setActiveTab('notes')}>
                  رجوع
                </Button>
                <Button onClick={savePositions} disabled={saving}>
                  {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                  حفظ الترتيب
                </Button>
              </>
            )}
            {activeTab === 'attendance' && (
              <>
                <Button variant="outline" onClick={() => setActiveTab('notes')}>
                  رجوع
                </Button>
                <Button onClick={saveAttendance} disabled={saving}>
                  {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                  حفظ الحضور
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {activeTab === 'arrange' ? (
          <>
            {/* Arrange Mode */}
            <Card className="mb-4 bg-muted/50">
              <CardContent className="p-4 text-center">
                <div className="bg-background border-2 border-dashed rounded-lg py-4">
                  <p className="text-muted-foreground font-medium">السبورة</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              <Move className="h-4 w-4" />
              <span>اسحب الطالب لتحريكه • اضغط عليه لإضافة ملاحظة</span>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {loadingPositions || loadingStudents ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <User className="h-12 w-12 mb-4" />
                    <p>لا يوجد طلاب في هذا الفصل</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate(`/teacher/students/new?classroomId=${classroomId}`)}
                    >
                      إضافة طالب
                    </Button>
                  </div>
                ) : (
                  <div
                    ref={containerRef}
                    className="relative min-h-[500px] touch-none select-none bg-muted/20"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {students.map((student) => {
                      const pos = getStudentPosition(student.id);
                      const isDragging = dragState.studentId === student.id;
                      
                      return (
                        <div
                          key={student.id}
                          className={`absolute transition-transform touch-none ${
                            isDragging 
                              ? 'scale-110 z-50 cursor-grabbing' 
                              : 'cursor-grab hover:scale-105'
                          }`}
                          style={{
                            left: pos.position_x,
                            top: pos.position_y,
                            width: STUDENT_SIZE,
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                          }}
                          onPointerDown={(e) => handlePointerDown(e, student.id)}
                          onClick={() => handleStudentTap({
                            id: student.id,
                            name: student.name,
                            avatar_url: student.avatar_url,
                          })}
                        >
                          <div className={`flex flex-col items-center p-1.5 bg-card rounded-xl border-2 shadow-md ${
                            isDragging ? 'border-primary shadow-lg' : 'border-transparent'
                          }`}>
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-0.5">
                              {student.avatar_url ? (
                                <img
                                  src={student.avatar_url}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                              ) : (
                                <User className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-[10px] text-center font-medium truncate w-full leading-tight">
                              {getShortName(student.name)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : activeTab === 'attendance' ? (
          <>
            {/* Attendance Mode */}
            <Card className="mb-4 bg-muted/50">
              <CardContent className="p-4 text-center">
                <div className="bg-background border-2 border-dashed rounded-lg py-4">
                  <p className="text-muted-foreground font-medium">السبورة</p>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" />
              <span>اضغط على الطالب لتغيير حالة الحضور</span>
            </div>

            {/* Period Selection & Bulk Actions */}
            <div className="space-y-4 mb-4">
              {/* Period Selection */}
              <div className="flex items-center justify-center gap-4">
                <Label className="text-sm font-medium">الحصة:</Label>
                <Select value={String(selectedPeriod)} onValueChange={(v) => setSelectedPeriod(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">الحصة 1</SelectItem>
                    <SelectItem value="2">الحصة 2</SelectItem>
                    <SelectItem value="3">الحصة 3</SelectItem>
                    <SelectItem value="4">الحصة 4</SelectItem>
                    <SelectItem value="5">الحصة 5</SelectItem>
                    <SelectItem value="6">الحصة 6</SelectItem>
                    <SelectItem value="7">الحصة 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Attendance Actions */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground ml-2">تسجيل جماعي:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => setAllAttendance('present')}
                >
                  <Check className="h-3 w-3" />
                  الكل حاضر
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => setAllAttendance('absent')}
                >
                  <X className="h-3 w-3" />
                  الكل غائب
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => setAllAttendance('late')}
                >
                  <Clock className="h-3 w-3" />
                  الكل متأخر
                </Button>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50" />
                  <span>حاضر</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50" />
                  <span>غائب</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-50" />
                  <span>متأخر</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50" />
                  <span>عذر</span>
                </div>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {loadingStudents ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <User className="h-12 w-12 mb-4" />
                    <p>لا يوجد طلاب في هذا الفصل</p>
                  </div>
                ) : (
                  <div
                    ref={containerRef}
                    className="relative min-h-[500px] select-none bg-muted/20"
                  >
                    {students.map((student) => {
                      const pos = getStudentPosition(student.id);
                      const status = getAttendanceStatus(student.id);
                      
                      return (
                        <div
                          key={student.id}
                          className="absolute cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            left: pos.position_x,
                            top: pos.position_y,
                            width: STUDENT_SIZE,
                          }}
                          onClick={() => handleStudentTap({
                            id: student.id,
                            name: student.name,
                            avatar_url: student.avatar_url,
                          })}
                        >
                          <div className={`flex flex-col items-center p-1.5 bg-card rounded-xl border-2 shadow-md ${getAttendanceBorder(status)}`}>
                            <div className="relative w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-0.5">
                              {student.avatar_url ? (
                                <img
                                  src={student.avatar_url}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 text-primary" />
                              )}
                              {status && (
                                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow">
                                  {getAttendanceIcon(status)}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-center font-medium truncate w-full leading-tight">
                              {getShortName(student.name)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Notes Mode (Default) */}
            <Card className="mb-4 bg-muted/50">
              <CardContent className="p-4 text-center">
                <div className="bg-background border-2 border-dashed rounded-lg py-4">
                  <p className="text-muted-foreground font-medium">السبورة</p>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>اضغط على الطالب لإضافة ملاحظة أو نقاط</span>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {loadingStudents ? (
                  <div className="flex items-center justify-center h-[500px]">
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
                    ref={containerRef}
                    className="relative min-h-[500px] select-none bg-muted/20"
                  >
                    {students.map((student) => {
                      const pos = getStudentPosition(student.id);
                      
                      return (
                        <div
                          key={student.id}
                          className="absolute cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            left: pos.position_x,
                            top: pos.position_y,
                            width: STUDENT_SIZE,
                          }}
                          onClick={() => handleStudentTap({
                            id: student.id,
                            name: student.name,
                            avatar_url: student.avatar_url,
                          })}
                        >
                          <div className="flex flex-col items-center p-1.5 bg-card rounded-xl border-2 border-transparent shadow-md hover:border-primary/50">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-0.5">
                              {student.avatar_url ? (
                                <img
                                  src={student.avatar_url}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-[10px] text-center font-medium truncate w-full leading-tight">
                              {getShortName(student.name)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Student Note Dialog */}
      <Dialog open={!!selectedStudent && dialogMode === 'note'} onOpenChange={() => setSelectedStudent(null)}>
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
