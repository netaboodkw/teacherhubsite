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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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

interface DraggableStudentProps {
  student: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  position: { x: number; y: number };
  isArrangeMode: boolean;
  onPositionChange: (studentId: string, x: number, y: number) => void;
  onTap: (student: SelectedStudent) => void;
  getShortName: (name: string) => string;
  containerRef: React.RefObject<HTMLDivElement>;
}

function DraggableStudent({ 
  student, 
  position, 
  isArrangeMode, 
  onPositionChange, 
  onTap, 
  getShortName,
  containerRef 
}: DraggableStudentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isArrangeMode || !nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeWidth = nodeRef.current?.offsetWidth || 100;
    const nodeHeight = nodeRef.current?.offsetHeight || 120;
    
    let newX = clientX - containerRect.left - dragOffset.x;
    let newY = clientY - containerRect.top - dragOffset.y;
    
    // Clamp to container bounds
    newX = Math.max(0, Math.min(newX, containerRect.width - nodeWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - nodeHeight));
    
    onPositionChange(student.id, newX, newY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isArrangeMode) return;
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isArrangeMode) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 100 : 1,
        cursor: isArrangeMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: isArrangeMode ? 'none' : 'auto',
      }}
      className={`flex flex-col items-center p-3 bg-card rounded-xl border-2 shadow-sm select-none transition-shadow ${
        isDragging 
          ? 'border-primary shadow-xl scale-105 ring-2 ring-primary/30' 
          : 'border-border/50 hover:border-primary/30 hover:shadow-md'
      }`}
      onClick={() => !isArrangeMode && !isDragging && onTap(student)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
    >
      {isArrangeMode && (
        <div className="absolute -top-2 -right-2 p-2 bg-primary text-primary-foreground rounded-full z-10 shadow-lg">
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
            draggable={false}
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
      className={`flex flex-col items-center p-3 bg-card rounded-xl border-2 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 ${getAttendanceBorder(status)}`}
      onClick={() => onTap(student)}
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
        )}
        {status && (
          <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow border">
            {getAttendanceIcon(status)}
          </div>
        )}
      </div>
      <p className="text-sm text-center font-medium truncate w-full leading-tight">
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
  const arrangeContainerRef = useRef<HTMLDivElement>(null);
  
  const [studentPositions, setStudentPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
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

        const positionsMap = new Map<string, { x: number; y: number }>();
        
        if (data && data.length > 0) {
          data.forEach(p => {
            positionsMap.set(p.student_id, { x: p.position_x, y: p.position_y });
          });
        }
        
        // Add default positions for students without saved positions
        const cardWidth = 110;
        const cardHeight = 130;
        const cols = 5;
        const gap = 20;
        
        students.forEach((student, index) => {
          if (!positionsMap.has(student.id)) {
            const col = index % cols;
            const row = Math.floor(index / cols);
            positionsMap.set(student.id, {
              x: col * (cardWidth + gap) + gap,
              y: row * (cardHeight + gap) + gap
            });
          }
        });
        
        setStudentPositions(positionsMap);
      } catch (error) {
        console.error('Error loading positions:', error);
        // Set default grid positions
        const positionsMap = new Map<string, { x: number; y: number }>();
        const cardWidth = 110;
        const cardHeight = 130;
        const cols = 5;
        const gap = 20;
        
        students.forEach((student, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          positionsMap.set(student.id, {
            x: col * (cardWidth + gap) + gap,
            y: row * (cardHeight + gap) + gap
          });
        });
        
        setStudentPositions(positionsMap);
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

  const handlePositionChange = (studentId: string, x: number, y: number) => {
    setStudentPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, { x, y });
      return newMap;
    });
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
      case 'present': return <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      case 'absent': return <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
      case 'excused': return <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
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

      const positionsToInsert = Array.from(studentPositions.entries()).map(([studentId, pos]) => ({
        student_id: studentId,
        classroom_id: classroomId,
        position_x: Math.round(pos.x),
        position_y: Math.round(pos.y),
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

  // Calculate container height based on positions
  const containerHeight = useMemo(() => {
    if (studentPositions.size === 0) return 400;
    let maxY = 0;
    studentPositions.forEach(pos => {
      if (pos.y > maxY) maxY = pos.y;
    });
    return Math.max(400, maxY + 150);
  }, [studentPositions]);

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
              <div className="flex items-center shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate('/teacher')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>الرئيسية</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/classrooms')}>
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>الفصول</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
      <div className="p-3 sm:p-4 max-w-5xl mx-auto">
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
              <span>اسحب الطالب وضعه في المكان المطلوب</span>
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
              <div 
                ref={arrangeContainerRef}
                className="relative bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20"
                style={{ minHeight: containerHeight }}
              >
                {students.map((student) => {
                  const position = studentPositions.get(student.id) || { x: 20, y: 20 };
                  return (
                    <DraggableStudent
                      key={student.id}
                      student={student}
                      position={position}
                      isArrangeMode={true}
                      onPositionChange={handlePositionChange}
                      onTap={handleStudentTap}
                      getShortName={getShortName}
                      containerRef={arrangeContainerRef}
                    />
                  );
                })}
              </div>
            ) : activeTab === 'attendance' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {students.map((student) => (
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
              <div 
                className="relative bg-muted/30 rounded-lg"
                style={{ minHeight: containerHeight }}
              >
                {students.map((student) => {
                  const hasNotes = studentsWithNotes.has(student.id);
                  const notesCount = studentsWithNotes.get(student.id) || 0;
                  const position = studentPositions.get(student.id) || { x: 20, y: 20 };
                  
                  return (
                    <div
                      key={student.id}
                      style={{
                        position: 'absolute',
                        left: position.x,
                        top: position.y,
                      }}
                      className="relative flex flex-col items-center p-3 bg-card rounded-xl border-2 border-border/50 shadow-sm cursor-pointer transition-all hover:scale-105 hover:border-primary/50 active:scale-95"
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

                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2 mt-1">
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
                      <p className="text-sm text-center font-medium truncate w-full leading-tight max-w-[90px]">
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
        <DialogContent dir="rtl" className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              اختر ملاحظة سريعة أو اكتب ملاحظة مخصصة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Positive Options */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-green-600">
                <Plus className="h-4 w-4" />
                ملاحظات إيجابية سريعة
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'مشاركة ممتازة',
                  'إجابة صحيحة',
                  'سلوك مميز',
                  'تعاون مع الزملاء',
                  'التزام بالنظام',
                  'إبداع في الحل',
                  'مساعدة الآخرين',
                  'حفظ متقن',
                ].map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                    onClick={() => {
                      setNoteType('positive');
                      setNoteDescription(option);
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Negative Options */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-red-600">
                <Minus className="h-4 w-4" />
                ملاحظات سلبية سريعة
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'عدم الانتباه',
                  'الحديث مع الزملاء',
                  'عدم إحضار الكتاب',
                  'عدم حل الواجب',
                  'التأخر عن الحصة',
                  'إزعاج الآخرين',
                  'استخدام الجوال',
                  'عدم المشاركة',
                ].map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                    onClick={() => {
                      setNoteType('negative');
                      setNoteDescription(option);
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">أو اكتب ملاحظة مخصصة</span>
              </div>
            </div>

            {/* Custom Note Type */}
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
                className="min-h-[80px]"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={saveNote}
              disabled={saving || !noteDescription.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ الملاحظة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>أرشفة الصف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أرشفة هذا الصف؟ سيتم نقله إلى قسم الصفوف المؤرشفة ولن يظهر في القائمة الرئيسية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveClassroom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
