import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useStudents } from '@/hooks/useStudents';
import { useClassroom, useArchiveClassroom } from '@/hooks/useClassrooms';
import { useBehaviorNotesByClassroom } from '@/hooks/useBehaviorNotes';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
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
  MoreVertical, Archive, Settings, UserPlus, GripVertical, HeartPulse, StickyNote, Shuffle, Timer, Home, Sparkles, Eye
} from 'lucide-react';
import { MobileRandomPicker } from '@/components/classroom/MobileRandomPicker';
import { MobileTimer } from '@/components/classroom/MobileTimer';
import { MobileStudentNoteSheet } from '@/components/classroom/MobileStudentNoteSheet';
import { RandomStudentPicker } from '@/components/classroom/RandomStudentPicker';
import { ClassroomTimer } from '@/components/classroom/ClassroomTimer';
import { ClassroomStatsBanner } from '@/components/classroom/ClassroomStatsBanner';
import { GlassClassroomStatsBanner } from '@/components/classroom/GlassClassroomStatsBanner';
import { StudentBadges, WeeklyAchievementsManager, WeeklyLeaderboard } from '@/components/classroom/StudentBadges';
import { GlassWeeklyLeaderboard } from '@/components/classroom/GlassWeeklyLeaderboard';
import { getCurrentPeriod, getScheduleByEducationLevel } from '@/lib/periodSchedules';
import { cn } from '@/lib/utils';

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

export default function ClassroomView() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: classroom, isLoading: loadingClassroom } = useClassroom(classroomId || '');
  const { data: students = [], isLoading: loadingStudents } = useStudents(classroomId);
  const { data: behaviorNotes = [] } = useBehaviorNotesByClassroom(classroomId);
  const archiveClassroom = useArchiveClassroom();
  const arrangeContainerRef = useRef<HTMLDivElement>(null);
  const { isLiquidGlass } = useTheme();
  const isMobile = useIsMobile();
  
  const [studentPositions, setStudentPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'arrange' | 'attendance'>('notes');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);

  // Auto-detect current period based on classroom schedule and Kuwait time
  const currentPeriodInfo = useMemo(() => {
    if (!classroom) return { period: 1, periodInfo: null, isClassDay: false };
    
    const classSchedule = classroom.class_schedule as Record<string, number[]> | null;
    const educationLevelName = classroom.education_level?.name_ar || classroom.education_level?.name;
    
    return getCurrentPeriod(classSchedule, educationLevelName);
  }, [classroom]);

  // Get schedule info for period names
  const scheduleInfo = useMemo(() => {
    if (!classroom) return null;
    const educationLevelName = classroom.education_level?.name_ar || classroom.education_level?.name;
    return getScheduleByEducationLevel(educationLevelName);
  }, [classroom]);

  // Set initial period based on auto-detection
  useEffect(() => {
    if (currentPeriodInfo.period > 0) {
      setSelectedPeriod(currentPeriodInfo.period);
    }
  }, [currentPeriodInfo.period]);

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
      setNoteSheetOpen(true);
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
      case 'present': return <Check className="h-5 w-5 text-green-600" />;
      case 'absent': return <X className="h-5 w-5 text-red-600" />;
      case 'late': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'excused': return <FileText className="h-5 w-5 text-blue-600" />;
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

      toast.success('تم حفظ ترتيب الطلاب');
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

      toast.success(`تم حفظ حضور الحصة ${selectedPeriod}`);
      setActiveTab('notes');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async (noteType: 'positive' | 'negative' | 'note', noteDescription: string) => {
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

      await queryClient.invalidateQueries({ queryKey: ['behavior_notes', 'classroom', classroomId] });
      await queryClient.invalidateQueries({ queryKey: ['behavior_notes'] });

      toast.success('تم حفظ الملاحظة');
      setSelectedStudent(null);
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

  const ActionButton = isLiquidGlass ? GlassButton : Button;
  const ContentCard = isLiquidGlass ? GlassCard : Card;
  const ContentCardContent = isLiquidGlass ? GlassCardContent : CardContent;

  // Count attendance stats
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header - iOS Style with Status Bar Blur */}
      <div className={cn(
        "sticky top-0 z-20",
        "bg-background/60 backdrop-blur-2xl backdrop-saturate-200",
        "border-b border-border/10",
        "pt-[env(safe-area-inset-top)]"
      )}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Back & Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/teacher/classrooms')}
                className="shrink-0 h-10 w-10"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{classroom.name}</h1>
                <p className="text-sm text-muted-foreground truncate">{classroom.subject} • {students.length} طالب</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {activeTab === 'notes' && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate(`/teacher/classrooms/${classroomId}/edit`)}
                  className="h-10 w-10"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
              
              {(activeTab === 'arrange' || activeTab === 'attendance') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('notes')}
                  className="h-10"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Tools - Smaller Touch Targets */}
        {activeTab === 'notes' && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setTimerOpen(true)}
              variant="outline"
              className="flex-1 h-11 gap-2 text-sm rounded-xl"
              size="sm"
            >
              <Timer className="h-4 w-4" />
              المؤقت
            </Button>
            <Button 
              onClick={() => setRandomPickerOpen(true)}
              variant="outline"
              className="flex-1 h-11 gap-2 text-sm rounded-xl"
              size="sm"
            >
              <Shuffle className="h-4 w-4" />
              اختيار عشوائي
            </Button>
          </div>
        )}

        {/* Mode Tabs - Only show in notes mode */}
        {activeTab === 'notes' && (
          <div className="flex gap-2 p-1.5 bg-muted rounded-2xl">
            <Button
              variant={activeTab === 'notes' ? 'default' : 'ghost'}
              className="flex-1 h-12 gap-2 rounded-xl"
              onClick={() => setActiveTab('notes')}
            >
              <MessageSquare className="h-5 w-5" />
              ملاحظات
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-12 gap-2 rounded-xl"
              onClick={() => setActiveTab('attendance')}
            >
              <ClipboardCheck className="h-5 w-5" />
              الحضور
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-12 gap-2 rounded-xl"
              onClick={() => setActiveTab('arrange')}
            >
              <Move className="h-5 w-5" />
              ترتيب
            </Button>
          </div>
        )}

        {/* Stats Banner */}
        {activeTab === 'notes' && classroom.show_stats_banner !== false && (
          isLiquidGlass ? (
            <GlassClassroomStatsBanner 
              students={students}
              behaviorNotes={behaviorNotes}
              classroomId={classroomId || ''}
              classroomName={classroom.name}
            />
          ) : (
            <ClassroomStatsBanner 
              students={students}
              behaviorNotes={behaviorNotes}
              classroomId={classroomId || ''}
              classroomName={classroom.name}
            />
          )
        )}

        {/* Weekly Achievements Manager */}
        {classroom.show_badges !== false && (
          <WeeklyAchievementsManager
            students={students}
            behaviorNotes={behaviorNotes}
            classroomId={classroomId || ''}
          />
        )}

        {/* Weekly Leaderboard */}
        {activeTab === 'notes' && classroom.show_leaderboard !== false && (
          <div className="mb-4">
            {isLiquidGlass ? (
              <GlassWeeklyLeaderboard
                students={students}
                behaviorNotes={behaviorNotes}
                classroomId={classroomId || ''}
              />
            ) : (
              <WeeklyLeaderboard
                students={students}
                behaviorNotes={behaviorNotes}
                classroomId={classroomId || ''}
              />
            )}
          </div>
        )}

        {/* Attendance Controls */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {/* Period Selection */}
            <div className="flex items-center gap-3">
              <Select value={String(selectedPeriod)} onValueChange={(v) => setSelectedPeriod(Number(v))}>
                <SelectTrigger className="flex-1 h-12 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleInfo?.periods.filter(p => !p.isBreak && p.period > 0).map(p => (
                    <SelectItem key={p.period} value={String(p.period)} className="text-base">
                      {p.nameAr}
                      {p.period === currentPeriodInfo.period && (
                        <span className="mr-2 text-primary">(الحالية)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-12 gap-2 rounded-xl border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                onClick={() => setAllAttendance('present')}
              >
                <Check className="h-5 w-5" />
                الكل حاضر
              </Button>
              <Button 
                variant="outline"
                className="h-12 gap-2 rounded-xl border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                onClick={() => setAllAttendance('absent')}
              >
                <X className="h-5 w-5" />
                الكل غائب
              </Button>
            </div>

            {/* Attendance Stats */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{presentCount}</p>
                <p className="text-sm text-green-600 dark:text-green-500">حاضر</p>
              </div>
              <div className="flex-1 p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{absentCount}</p>
                <p className="text-sm text-red-600 dark:text-red-500">غائب</p>
              </div>
              <div className="flex-1 p-3 bg-muted rounded-xl text-center">
                <p className="text-2xl font-bold text-foreground">{students.length - presentCount - absentCount}</p>
                <p className="text-sm text-muted-foreground">بدون</p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Instructions & Save Button - Above Students */}
        {activeTab !== 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground bg-muted/50 rounded-xl">
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
            </div>
            
            {/* Save Button - Above Students */}
            <Button 
              onClick={activeTab === 'arrange' ? savePositions : saveAttendance}
              disabled={saving}
              className="w-full h-14 text-lg gap-3 rounded-2xl shadow-lg"
              size="lg"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {activeTab === 'arrange' ? 'حفظ الترتيب' : `حفظ حضور الحصة ${selectedPeriod}`}
            </Button>

            {/* Reset Arrangement Button - Only in arrange mode */}
            {activeTab === 'arrange' && (
              <Button 
                variant="outline"
                onClick={() => {
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
                  toast.success('تم إعادة ترتيب الطلاب');
                }}
                className="w-full h-12 gap-2 rounded-xl"
              >
                <Move className="h-4 w-4" />
                إعادة الترتيب الافتراضي
              </Button>
            )}
          </div>
        )}

        {/* Students Grid */}
        <ContentCard>
          <ContentCardContent className="p-3">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-4">لا يوجد طلاب</p>
                <Button onClick={() => navigate(`/teacher/students/new?classroomId=${classroomId}`)}>
                  <UserPlus className="h-5 w-5 ml-2" />
                  إضافة طالب
                </Button>
              </div>
            ) : activeTab === 'arrange' ? (
              <div 
                ref={arrangeContainerRef}
                className="relative bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20"
                style={{ minHeight: containerHeight }}
              >
                {students.map((student) => {
                  const position = studentPositions.get(student.id) || { x: 20, y: 20 };
                  return (
                    <DraggableStudent
                      key={student.id}
                      student={student}
                      position={position}
                      onPositionChange={handlePositionChange}
                      getShortName={getShortName}
                      containerRef={arrangeContainerRef}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {students.map((student) => {
                  const hasNotes = studentsWithNotes.has(student.id);
                  const notesCount = studentsWithNotes.get(student.id) || 0;
                  const attendanceStatus = getAttendanceStatus(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className={cn(
                        "relative flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all active:scale-95",
                        activeTab === 'attendance' 
                          ? `border-2 ${getAttendanceBorder(attendanceStatus)}`
                          : "bg-card border border-border/50 hover:border-primary/50"
                      )}
                      onClick={() => handleStudentTap({
                        id: student.id,
                        name: student.name,
                        avatar_url: student.avatar_url,
                      })}
                    >
                      {/* Status Icons */}
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        {student.special_needs && (
                          <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded-full" title="احتياجات خاصة">
                            <HeartPulse className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                        {(student as any).is_watched && (
                          <div className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded-full" title="تحت المتابعة">
                            <Eye className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        {student.notes && (
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full" title="ملاحظات">
                            <StickyNote className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="relative w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2">
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-7 w-7 text-primary" />
                        )}
                        
                        {/* Attendance Icon Overlay */}
                        {activeTab === 'attendance' && attendanceStatus && (
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow">
                            {getAttendanceIcon(attendanceStatus)}
                          </div>
                        )}
                      </div>
                      
                      {/* Name */}
                      <p className="text-xs text-center font-medium leading-tight line-clamp-2 w-full">
                        {getShortName(student.name)}
                      </p>
                      
                      {/* Badges */}
                      {activeTab === 'notes' && classroom.show_badges !== false && (
                        <div className="mt-1">
                          <StudentBadges studentId={student.id} classroomId={classroomId || ''} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ContentCardContent>
        </ContentCard>

      </div>

      {/* Mobile Note Sheet */}
      <MobileStudentNoteSheet
        student={selectedStudent}
        open={noteSheetOpen}
        onOpenChange={setNoteSheetOpen}
        onSave={saveNote}
        saving={saving}
      />

      {/* Timer & Random Picker */}
      {isMobile ? (
        <>
          <MobileRandomPicker
            students={students}
            classroomId={classroomId || ''}
            open={randomPickerOpen}
            onOpenChange={setRandomPickerOpen}
          />
          <MobileTimer
            open={timerOpen}
            onOpenChange={setTimerOpen}
          />
        </>
      ) : (
        <>
          <RandomStudentPicker
            students={students}
            classroomId={classroomId || ''}
            open={randomPickerOpen}
            onOpenChange={setRandomPickerOpen}
          />
          <ClassroomTimer
            open={timerOpen}
            onOpenChange={setTimerOpen}
          />
        </>
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent dir="rtl" className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>أرشفة الصف</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              هل أنت متأكد من أرشفة هذا الصف؟ سيتم نقله إلى قسم الصفوف المؤرشفة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="h-12 px-6">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchiveClassroom} 
              className="h-12 px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Draggable Student Component
interface DraggableStudentProps {
  student: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  position: { x: number; y: number };
  onPositionChange: (studentId: string, x: number, y: number) => void;
  getShortName: (name: string) => string;
  containerRef: React.RefObject<HTMLDivElement>;
}

function DraggableStudent({ 
  student, 
  position, 
  onPositionChange, 
  getShortName,
  containerRef,
}: DraggableStudentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!nodeRef.current) return;
    
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
    
    newX = Math.max(0, Math.min(newX, containerRect.width - nodeWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - nodeHeight));
    
    onPositionChange(student.id, newX, newY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
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
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      className={cn(
        "flex flex-col items-center p-3 bg-card rounded-2xl border-2 shadow-sm select-none transition-shadow",
        isDragging 
          ? 'border-primary shadow-xl scale-105 ring-2 ring-primary/30' 
          : 'border-border/50'
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
    >
      <div className="absolute -top-2 -right-2 p-2 bg-primary text-primary-foreground rounded-full z-10 shadow-lg">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <User className="h-7 w-7 text-primary" />
        )}
      </div>
      <p className="text-xs text-center font-medium truncate w-full leading-tight max-w-[70px]">
        {getShortName(student.name)}
      </p>
    </div>
  );
}
