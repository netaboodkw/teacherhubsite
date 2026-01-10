import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { useGrades, useCreateGrade, useUpdateGrade, GradeType } from '@/hooks/useGrades';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, ChevronLeft, Plus, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const WEEKS_COUNT = 18; // عدد الأسابيع في الفصل الدراسي

export default function Grades() {
  const { data: classrooms = [] } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; week: number } | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [gradeType, setGradeType] = useState<GradeType>('participation');

  // تحديد الصف الأول تلقائياً
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  const { data: students = [] } = useStudents(selectedClassroom || undefined);
  const { data: grades = [], isLoading } = useGrades(selectedClassroom || undefined);
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();

  // الأسابيع المعروضة (4 أسابيع في كل مرة)
  const visibleWeeks = useMemo(() => {
    const weeks = [];
    for (let i = currentWeekStart; i < currentWeekStart + 4 && i <= WEEKS_COUNT; i++) {
      weeks.push(i);
    }
    return weeks;
  }, [currentWeekStart]);

  // الحصول على درجة طالب في أسبوع معين
  const getGradeForWeek = (studentId: string, week: number) => {
    return grades.find(g => g.student_id === studentId && g.week_number === week);
  };

  // حساب المجموع
  const getTotalScore = (studentId: string) => {
    const studentGrades = grades.filter(g => g.student_id === studentId);
    return studentGrades.reduce((sum, g) => sum + g.score, 0);
  };

  // فتح نافذة إضافة/تعديل درجة
  const openGradeDialog = (studentId: string, week: number) => {
    const existingGrade = getGradeForWeek(studentId, week);
    setSelectedCell({ studentId, week });
    setGradeValue(existingGrade ? String(existingGrade.score) : '');
    setGradeType(existingGrade ? existingGrade.type as GradeType : 'participation');
    setIsDialogOpen(true);
  };

  // حفظ الدرجة
  const handleSaveGrade = async () => {
    if (!selectedCell || !gradeValue) return;
    
    const existingGrade = getGradeForWeek(selectedCell.studentId, selectedCell.week);
    
    if (existingGrade) {
      await updateGrade.mutateAsync({
        id: existingGrade.id,
        score: parseFloat(gradeValue),
        type: gradeType,
      });
    } else {
      await createGrade.mutateAsync({
        student_id: selectedCell.studentId,
        classroom_id: selectedClassroom,
        type: gradeType,
        title: `الأسبوع ${selectedCell.week}`,
        score: parseFloat(gradeValue),
        max_score: 10,
        week_number: selectedCell.week,
      });
    }
    
    setIsDialogOpen(false);
    setSelectedCell(null);
    setGradeValue('');
  };

  // التنقل بين الأسابيع
  const goToPreviousWeeks = () => {
    if (currentWeekStart > 1) {
      setCurrentWeekStart(Math.max(1, currentWeekStart - 4));
    }
  };

  const goToNextWeeks = () => {
    if (currentWeekStart + 4 <= WEEKS_COUNT) {
      setCurrentWeekStart(currentWeekStart + 4);
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 9) return 'bg-success/20 text-success';
    if (score >= 7) return 'bg-primary/20 text-primary';
    if (score >= 5) return 'bg-warning/20 text-warning';
    return 'bg-destructive/20 text-destructive';
  };

  const gradeTypeLabels: Record<GradeType, string> = {
    exam: 'اختبار',
    assignment: 'واجب',
    participation: 'مشاركة',
    project: 'مشروع',
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">سجل الدرجات</h1>
            <p className="text-muted-foreground mt-1">تتبع درجات الطلاب الأسبوعية</p>
          </div>
          <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-card rounded-xl border border-border p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextWeeks}
            disabled={currentWeekStart + 4 > WEEKS_COUNT}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            الأسابيع {currentWeekStart} - {Math.min(currentWeekStart + 3, WEEKS_COUNT)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousWeeks}
            disabled={currentWeekStart <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Grades Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right p-4 font-medium text-muted-foreground sticky right-0 bg-muted/30 min-w-[180px]">
                    الطالب
                  </th>
                  {visibleWeeks.map((week) => (
                    <th key={week} className="text-center p-4 font-medium text-muted-foreground min-w-[80px]">
                      الأسبوع {week}
                    </th>
                  ))}
                  <th className="text-center p-4 font-medium text-muted-foreground min-w-[80px] bg-primary/10">
                    المجموع
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={visibleWeeks.length + 2} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={visibleWeeks.length + 2} className="p-8 text-center text-muted-foreground">
                      لا يوجد طلاب في هذا الصف
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                    const total = getTotalScore(student.id);
                    
                    return (
                      <tr key={student.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-3 sticky right-0 bg-card">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
                            <Avatar className="w-9 h-9">
                              {student.avatar_url ? (
                                <AvatarImage src={student.avatar_url} alt={student.name} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{student.name}</span>
                          </div>
                        </td>
                        {visibleWeeks.map((week) => {
                          const grade = getGradeForWeek(student.id, week);
                          return (
                            <td key={week} className="p-2 text-center">
                              <button
                                onClick={() => openGradeDialog(student.id, week)}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto transition-all hover:scale-105 ${
                                  grade
                                    ? getGradeColor(grade.score)
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                                }`}
                              >
                                {grade ? (
                                  <span className="font-bold">{grade.score}</span>
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center bg-primary/5">
                          <span className="font-bold text-lg text-primary">{total}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {selectedCell && getGradeForWeek(selectedCell.studentId, selectedCell.week)
                  ? 'تعديل الدرجة'
                  : 'إضافة درجة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>نوع التقييم</Label>
                <Select value={gradeType} onValueChange={(v) => setGradeType(v as GradeType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participation">مشاركة</SelectItem>
                    <SelectItem value="assignment">واجب</SelectItem>
                    <SelectItem value="exam">اختبار</SelectItem>
                    <SelectItem value="project">مشروع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الدرجة (من 10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  placeholder="أدخل الدرجة"
                  className="text-center text-2xl h-14"
                />
              </div>
              <Button
                className="w-full gradient-hero"
                onClick={handleSaveGrade}
                disabled={createGrade.isPending || updateGrade.isPending || !gradeValue}
              >
                {(createGrade.isPending || updateGrade.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'حفظ'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
