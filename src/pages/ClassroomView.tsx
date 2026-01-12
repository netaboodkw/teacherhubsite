import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useClassroom, useArchiveClassroom } from '@/hooks/useClassrooms';
import { useBehaviorNotesByClassroom } from '@/hooks/useBehaviorNotes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  ArrowRight, User, Plus, Minus, MessageSquare, Save, Loader2, 
  Move, Check, X, Clock, FileText, ClipboardCheck,
  MoreVertical, Archive, Settings, UserPlus, GripVertical, HeartPulse, StickyNote
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface SortableStudentProps {
  student: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isArrangeMode: boolean;
  onTap: (student: SelectedStudent) => void;
  getShortName: (name: string) => string;
}

function SortableStudent({ student, isArrangeMode, onTap, getShortName }: SortableStudentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: student.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col items-center p-3 bg-card rounded-xl border-2 shadow-sm transition-all min-h-[80px] ${
        isDragging ? 'border-primary shadow-lg scale-105' : 'border-border/50 hover:border-primary/30'
      }`}
      onClick={() => !isArrangeMode && onTap(student)}
    >
      {isArrangeMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -top-2 -right-2 p-1.5 bg-primary text-primary-foreground rounded-full cursor-grab active:cursor-grabbing touch-none z-10 shadow-md"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-1">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
      </div>
      <p className="text-xs text-center font-medium truncate w-full leading-tight">
        {getShortName(student.name)}
      </p>
    </div>
  );
}

interface AttendanceStudentProps {
  student: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  status: AttendanceRecord['status'] | null;
  onTap: (student: SelectedStudent) => void;
  getShortName: (name: string) => string;
  getAttendanceBorder: (status: AttendanceRecord['status'] | null) => string;
  getAttendanceIcon: (status: AttendanceRecord['status'] | null) => React.ReactNode;
}

function AttendanceStudent({ student, status, onTap, getShortName, getAttendanceBorder, getAttendanceIcon }: AttendanceStudentProps) {
  return (
    <div
      className={`flex flex-col items-center p-2 bg-card rounded-xl border-2 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 ${getAttendanceBorder(status)}`}
      onClick={() => onTap(student)}
    >
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-1">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
        {status && (
          <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow border">
            {getAttendanceIcon(status)}
          </div>
        )}
      </div>
      <p className="text-xs text-center font-medium truncate w-full leading-tight">
        {getShortName(student.name)}
      </p>
    </div>
  );
}

export default function ClassroomView() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classroom, isLoading: loadingClassroom } = useClassroom(classroomId || '');
  const { data: students = [], isLoading: loadingStudents } = useStudents(classroomId);
  const { data: behaviorNotes = [] } = useBehaviorNotesByClassroom(classroomId);
  const archiveClassroom = useArchiveClassroom();
  
  const [studentOrder, setStudentOrder] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [dialogMode, setDialogMode] = useState<'note' | 'attendance'>('note');
  const [noteType, setNoteType] = useState<'positive' | 'negative' | 'note'>('positive');
  const [noteDescription, setNoteDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'arrange' | 'attendance'>('notes');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Create a map of students who have notes
  const studentsWithNotes = useMemo(() => {
    const noteMap = new Map<string, number>();
    behaviorNotes.forEach(note => {
      noteMap.set(note.student_id, (noteMap.get(note.student_id) || 0) + 1);
    });
    return noteMap;
  }, [behaviorNotes]);

  // DnD Kit sensors with touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleArchiveClassroom = () => {
    if (!classroomId) return;
    archiveClassroom.mutate(classroomId, {
      onSuccess: () => {
        navigate('/teacher/classrooms');
      }
    });
    setArchiveDialogOpen(false);
  };

  const today = new Date().toISOString().split('T')[0];

  // Load existing positions and convert to order
  useEffect(() => {
    const loadPositions = async () => {
      if (!classroomId || !user) return;

      try {
        const { data, error } = await supabase
          .from('student_positions')
          .select('student_id, position_x, position_y')
          .eq('classroom_id', classroomId)
          .order('position_y', { ascending: true })
          .order('position_x', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Sort by position and extract order
          const orderedIds = data.map(p => p.student_id);
          // Add any new students not in positions
          const existingIds = new Set(orderedIds);
          const newStudentIds = students.filter(s => !existingIds.has(s.id)).map(s => s.id);
          setStudentOrder([...orderedIds, ...newStudentIds]);
        } else {
          // Default order from students array
          setStudentOrder(students.map(s => s.id));
        }
      } catch (error) {
        console.error('Error loading positions:', error);
        setStudentOrder(students.map(s => s.id));
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStudentOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleStudentTap = (student: SelectedStudent) => {
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
      case 'present': return <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
      case 'absent': return <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
      case 'late': return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />;
      case 'excused': return <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getAttendanceBorder = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present': return 'border-green-500 bg-green-50 dark:bg-green-950/30';
      case 'absent': return 'border-red-500 bg-red-50 dark:bg-red-950/30';
      case 'late': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
      case 'excused': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/30';
      default: return 'border-border/50';
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

      // Convert order to positions (grid-based)
      const cols = 5;
      const gridSize = 80;
      const positionsToInsert = studentOrder.map((studentId, index) => ({
        student_id: studentId,
        classroom_id: classroomId,
        position_x: (index % cols) * gridSize + 20,
        position_y: Math.floor(index / cols) * gridSize + 20,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('student_positions')
        .insert(positionsToInsert);

      if (error) throw error;

      toast.success('تم حفظ ترتيب الطلاب بنجاح');
      setActiveTab('notes');
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
      setActiveTab('notes');
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

  const getShortName = (fullName: string) => {
    const parts = fullName.split(' ');
    return parts.slice(0, 2).join(' ');
  };

  const orderedStudents = studentOrder
    .map(id => students.find(s => s.id === id))
    .filter(Boolean) as typeof students;

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
      {/* Header - Mobile Optimized */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/teacher/classrooms')}>
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">{classroom.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{classroom.subject}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {activeTab === 'notes' && (
                <>
                  {/* Mobile: Show icons only */}
                  <Button variant="outline" size="icon" className="sm:hidden" onClick={() => setActiveTab('arrange')}>
                    <Move className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="sm:hidden" onClick={() => setActiveTab('attendance')}>
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                  
                  {/* Desktop: Show full buttons */}
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setActiveTab('arrange')}>
                    <Move className="h-4 w-4 ml-1" />
                    ترتيب الطلاب
                  </Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setActiveTab('attendance')}>
                    <ClipboardCheck className="h-4 w-4 ml-1" />
                    تسجيل الحضور
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/teacher/students/new?classroomId=${classroomId}`)}>
                        <UserPlus className="h-4 w-4 ml-2" />
                        إضافة طالب
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/teacher/classrooms/${classroomId}/edit`)}>
                        <Settings className="h-4 w-4 ml-2" />
                        إعدادات الصف
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setArchiveDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Archive className="h-4 w-4 ml-2" />
                        أرشفة الصف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {activeTab === 'arrange' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('notes')}>
                    <X className="h-4 w-4 sm:ml-1" />
                    <span className="hidden sm:inline">إلغاء</span>
                  </Button>
                  <Button size="sm" onClick={savePositions} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 sm:ml-1" />}
                    <span className="hidden sm:inline">حفظ</span>
                  </Button>
                </>
              )}
              
              {activeTab === 'attendance' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('notes')}>
                    <X className="h-4 w-4 sm:ml-1" />
                    <span className="hidden sm:inline">إلغاء</span>
                  </Button>
                  <Button size="sm" onClick={saveAttendance} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 sm:ml-1" />}
                    <span className="hidden sm:inline">حفظ</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 max-w-4xl mx-auto">
        {/* Board */}
        <Card className="mb-3 sm:mb-4 bg-muted/50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="bg-background border-2 border-dashed rounded-lg py-3 sm:py-4">
              <p className="text-muted-foreground font-medium text-sm sm:text-base">السبورة</p>
            </div>
          </CardContent>
        </Card>

        {/* Mode-specific instructions */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
          {activeTab === 'arrange' && (
            <>
              <GripVertical className="h-4 w-4" />
              <span>اسحب أيقونة الترتيب لتحريك الطالب</span>
            </>
          )}
          {activeTab === 'attendance' && (
            <>
              <ClipboardCheck className="h-4 w-4" />
              <span>اضغط على الطالب لتغيير الحالة</span>
            </>
          )}
          {activeTab === 'notes' && (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>اضغط على الطالب لإضافة ملاحظة</span>
            </>
          )}
        </div>

        {/* Attendance Controls */}
        {activeTab === 'attendance' && (
          <div className="space-y-3 mb-4">
            {/* Period Selection */}
            <div className="flex items-center justify-center gap-3">
              <Label className="text-sm font-medium">الحصة:</Label>
              <Select value={String(selectedPeriod)} onValueChange={(v) => setSelectedPeriod(Number(v))}>
                <SelectTrigger className="w-28 sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7].map(n => (
                    <SelectItem key={n} value={String(n)}>الحصة {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 border-green-500 text-green-600 hover:bg-green-50 text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => setAllAttendance('present')}
              >
                <Check className="h-3 w-3" />
                <span className="hidden xs:inline">الكل</span> حاضر
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 border-red-500 text-red-600 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => setAllAttendance('absent')}
              >
                <X className="h-3 w-3" />
                <span className="hidden xs:inline">الكل</span> غائب
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => setAllAttendance('late')}
              >
                <Clock className="h-3 w-3" />
                <span className="hidden xs:inline">الكل</span> متأخر
              </Button>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-green-500 bg-green-50" />
                <span>حاضر</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-red-500 bg-red-50" />
                <span>غائب</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-yellow-500 bg-yellow-50" />
                <span>متأخر</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-blue-500 bg-blue-50" />
                <span>عذر</span>
              </div>
            </div>
          </div>
        )}

        {/* Students Grid */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            {loadingStudents || loadingPositions ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
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
            ) : activeTab === 'arrange' ? (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={studentOrder}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
                    {orderedStudents.map((student) => (
                      <SortableStudent
                        key={student.id}
                        student={student}
                        isArrangeMode={true}
                        onTap={handleStudentTap}
                        getShortName={getShortName}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : activeTab === 'attendance' ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
                {orderedStudents.map((student) => (
                  <AttendanceStudent
                    key={student.id}
                    student={student}
                    status={getAttendanceStatus(student.id)}
                    onTap={handleStudentTap}
                    getShortName={getShortName}
                    getAttendanceBorder={getAttendanceBorder}
                    getAttendanceIcon={getAttendanceIcon}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
                {orderedStudents.map((student) => {
                  const hasNotes = studentsWithNotes.has(student.id);
                  const notesCount = studentsWithNotes.get(student.id) || 0;
                  
                  return (
                    <div
                      key={student.id}
                      className="relative flex flex-col items-center p-2 bg-card rounded-xl border-2 border-border/50 shadow-sm cursor-pointer transition-all hover:scale-105 hover:border-primary/50 active:scale-95"
                      onClick={() => handleStudentTap({
                        id: student.id,
                        name: student.name,
                        avatar_url: student.avatar_url,
                      })}
                    >
                      {/* Status Icons */}
                      <div className="absolute -top-1 right-0 flex gap-0.5">
                        {student.special_needs && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-0.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                                <HeartPulse className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>احتياجات خاصة</TooltipContent>
                          </Tooltip>
                        )}
                        {hasNotes && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                <StickyNote className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{notesCount} ملاحظة</TooltipContent>
                          </Tooltip>
                        )}
                        {student.notes && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-0.5 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                                <MessageSquare className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-48 text-right">{student.notes}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-1 mt-1">
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-center font-medium truncate w-full leading-tight">
                        {getShortName(student.name)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Note Dialog */}
      <Dialog open={!!selectedStudent && dialogMode === 'note'} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent dir="rtl" className="max-w-[95vw] sm:max-w-md">
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
              <span className="truncate">{selectedStudent?.name}</span>
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
                className="flex flex-wrap gap-3 sm:gap-4"
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

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              أرشفة الصف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أرشفة هذا الصف؟
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground text-sm">
                <li>سيتم إخفاء الصف من قائمة صفوفك</li>
                <li>جميع البيانات ستبقى محفوظة</li>
                <li>يمكن للمشرف استعادة الصف لاحقاً</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchiveClassroom}
              className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600"
            >
              <Archive className="h-4 w-4 ml-1" />
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
