import { useState, useMemo, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassrooms, Classroom } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { useGrades, useCreateGrade, useUpdateGrade, GradeType } from '@/hooks/useGrades';
import { useClassroomGradingStructure, GradingStructureData, GradingColumn, GradingGroup } from '@/hooks/useGradingStructures';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, ChevronLeft, Plus, Loader2, Table, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const WEEKS_COUNT = 18; // عدد الأسابيع في الفصل الدراسي

// Fallback simple grading view
function SimpleGradingView({ 
  students, 
  grades, 
  isLoading, 
  visibleWeeks, 
  currentWeekStart, 
  goToPreviousWeeks, 
  goToNextWeeks,
  openGradeDialog,
  getGradeForWeek,
  getTotalScore,
  getGradeColor
}: {
  students: any[];
  grades: any[];
  isLoading: boolean;
  visibleWeeks: number[];
  currentWeekStart: number;
  goToPreviousWeeks: () => void;
  goToNextWeeks: () => void;
  openGradeDialog: (studentId: string, week: number) => void;
  getGradeForWeek: (studentId: string, week: number) => any;
  getTotalScore: (studentId: string) => number;
  getGradeColor: (score: number) => string;
}) {
  return (
    <>
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
                  const initials = student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
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
    </>
  );
}

// Advanced grading view based on grading structure
function StructuredGradingView({
  structure,
  students,
  isLoading,
  grades,
  onCellClick
}: {
  structure: GradingStructureData;
  students: any[];
  isLoading: boolean;
  grades: any[];
  onCellClick: (studentId: string, columnId: string, groupId: string, maxScore: number) => void;
}) {
  // Track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };
  
  const collapseAll = () => {
    setCollapsedGroups(new Set(structure.groups.map(g => g.id)));
  };
  
  const expandAll = () => {
    setCollapsedGroups(new Set());
  };

  // Calculate visible columns count (excluding collapsed groups)
  const getVisibleColumnsCount = () => {
    return structure.groups.reduce((sum, g) => {
      if (collapsedGroups.has(g.id)) {
        return sum + 1; // Just the summary column
      }
      return sum + g.columns.length;
    }, 0);
  };
  
  // Calculate total columns count
  const totalColumns = structure.groups.reduce((sum, g) => sum + g.columns.length, 0);
  const calculateColumnValue = (studentId: string, column: GradingColumn, group: GradingGroup): number => {
    if (column.type === 'score') {
      const grade = grades.find(g => 
        g.student_id === studentId && 
        g.title === column.id
      );
      return grade?.score || 0;
    }
    
    if (column.type === 'total') {
      // Sum selected columns in same group
      const sourceIds = column.sourceColumnIds || group.columns.filter(c => c.type === 'score').map(c => c.id);
      return sourceIds.reduce((sum, colId) => {
        const col = group.columns.find(c => c.id === colId);
        if (col && col.type === 'score') {
          const grade = grades.find(g => g.student_id === studentId && g.title === colId);
          return sum + (grade?.score || 0);
        }
        return sum;
      }, 0);
    }
    
    if (column.type === 'grand_total' || column.type === 'group_sum') {
      let total = 0;
      
      // Sum from source groups
      if (column.sourceGroupIds) {
        column.sourceGroupIds.forEach(key => {
          if (key.includes(':')) {
            const [grpId, colId] = key.split(':');
            const grp = structure.groups.find(g => g.id === grpId);
            if (grp) {
              const col = grp.columns.find(c => c.id === colId);
              if (col) {
                total += calculateColumnValue(studentId, col, grp);
              }
            }
          } else {
            // Old format
            const grp = structure.groups.find(g => g.id === key);
            if (grp) {
              const totalCol = grp.columns.find(c => c.type === 'total');
              if (totalCol) {
                total += calculateColumnValue(studentId, totalCol, grp);
              }
            }
          }
        });
      }
      
      // Sum from same-group columns
      if (column.sourceColumnIds) {
        column.sourceColumnIds.forEach(colId => {
          const col = group.columns.find(c => c.id === colId);
          if (col) {
            total += calculateColumnValue(studentId, col, group);
          }
        });
      }
      
      return total;
    }
    
    return 0;
  };

  // Calculate total max score
  const calculateTotalMaxScore = () => {
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, c) => s + c.max_score, 0);
    }, 0);
  };

  // Calculate student's total score
  const calculateStudentTotal = (studentId: string) => {
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, col) => {
          const grade = grades.find(g => g.student_id === studentId && g.title === col.id);
          return s + (grade?.score || 0);
        }, 0);
    }, 0);
  };

  // Calculate group total for a student (for collapsed view)
  const calculateGroupTotal = (studentId: string, group: GradingGroup): number => {
    const totalCol = group.columns.find(c => c.type === 'total');
    if (totalCol) {
      return calculateColumnValue(studentId, totalCol, group);
    }
    // Fallback: sum all score columns
    return group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, col) => {
        const grade = grades.find(g => g.student_id === studentId && g.title === col.id);
        return sum + (grade?.score || 0);
      }, 0);
  };
  
  // Calculate group max score
  const calculateGroupMaxScore = (group: GradingGroup): number => {
    const totalCol = group.columns.find(c => c.type === 'total');
    if (totalCol) {
      return totalCol.max_score;
    }
    return group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, c) => sum + c.max_score, 0);
  };

  return (
    <div className="space-y-2">
      {/* Collapse/Expand Controls */}
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={expandAll} disabled={collapsedGroups.size === 0}>
          <ChevronDown className="h-4 w-4 ml-1" />
          توسيع الكل
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll} disabled={collapsedGroups.size === structure.groups.length}>
          <ChevronUp className="h-4 w-4 ml-1" />
          طي الكل
        </Button>
      </div>
      
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Group headers row */}
              <tr>
                <th 
                  className="border p-3 bg-muted text-right min-w-[180px]" 
                  rowSpan={2}
                >
                  اسم الطالب
                </th>
                {structure.groups.map(group => {
                  const isCollapsed = collapsedGroups.has(group.id);
                  return (
                    <th 
                      key={group.id}
                      colSpan={isCollapsed ? 1 : group.columns.length}
                      className="border p-2 text-center font-bold cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: group.color }}
                      onClick={() => toggleGroupCollapse(group.id)}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isCollapsed ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {group.name_ar}
                        {isCollapsed && (
                          <Badge variant="secondary" className="text-xs">
                            {group.columns.length}
                          </Badge>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th 
                  className="border p-3 bg-muted text-center min-w-[80px]" 
                  rowSpan={2}
                >
                  المجموع الكلي<br/>
                  <span className="text-xs text-muted-foreground">({calculateTotalMaxScore()})</span>
                </th>
              </tr>
              {/* Column headers row */}
              <tr>
                {structure.groups.map(group => {
                  const isCollapsed = collapsedGroups.has(group.id);
                  
                  if (isCollapsed) {
                    // Show summary header for collapsed group
                    return (
                      <th 
                        key={`${group.id}-collapsed`}
                        className="border p-2 text-center text-sm min-w-[80px]"
                        style={{ backgroundColor: group.color }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>المجموع</span>
                          <Badge variant="default" className="text-xs">
                            {calculateGroupMaxScore(group)}
                          </Badge>
                        </div>
                      </th>
                    );
                  }
                  
                  // Show individual columns for expanded group
                  return group.columns.map(column => (
                    <th 
                      key={column.id}
                      className="border p-2 text-center text-sm min-w-[70px]"
                      style={{ 
                        backgroundColor: column.useGroupColor !== false ? group.color : 'var(--card)'
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{column.name_ar}</span>
                        <Badge 
                          variant={column.type === 'score' ? 'secondary' : column.type === 'total' ? 'default' : (column.type === 'grand_total' || column.type === 'group_sum') ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {column.max_score}
                        </Badge>
                      </div>
                    </th>
                  ));
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={getVisibleColumnsCount() + 2} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={getVisibleColumnsCount() + 2} className="p-8 text-center text-muted-foreground">
                    لا يوجد طلاب في هذا الصف
                  </td>
                </tr>
              ) : (
                students.map((student, index) => {
                  const initials = student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
                  const studentTotal = calculateStudentTotal(student.id);
                  
                  return (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="border p-3 sticky right-0 bg-card">
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
                      {structure.groups.map(group => {
                        const isCollapsed = collapsedGroups.has(group.id);
                        
                        if (isCollapsed) {
                          // Show group total only
                          const groupTotal = calculateGroupTotal(student.id, group);
                          const groupMax = calculateGroupMaxScore(group);
                          return (
                            <td 
                              key={`${group.id}-collapsed`}
                              className="border p-2 text-center font-semibold"
                              style={{ backgroundColor: `${group.color}50` }}
                            >
                              {groupTotal}/{groupMax}
                            </td>
                          );
                        }
                        
                        // Show individual columns
                        return group.columns.map(column => {
                          const value = calculateColumnValue(student.id, column, group);
                          const isEditable = column.type === 'score';
                          
                          return (
                            <td 
                              key={column.id}
                              className={`border p-2 text-center ${
                                column.type === 'grand_total' || column.type === 'group_sum' ? 'bg-primary/10 font-bold' : 
                                column.type === 'total' ? 'bg-muted/50 font-semibold' : ''
                              }`}
                              style={{ 
                                backgroundColor: column.useGroupColor !== false && column.type === 'score' 
                                  ? `${group.color}50` 
                                  : undefined 
                              }}
                            >
                              {isEditable ? (
                                <button
                                  onClick={() => onCellClick(student.id, column.id, group.id, column.max_score)}
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto transition-all hover:scale-105 ${
                                    value > 0
                                      ? 'bg-primary/20 text-primary font-bold'
                                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {value > 0 ? value : <Plus className="w-4 h-4" />}
                                </button>
                              ) : (
                                <span className={column.type === 'grand_total' || column.type === 'group_sum' ? 'text-primary' : ''}>
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        });
                      })}
                      <td className="border p-3 text-center bg-primary/5">
                        <span className="font-bold text-lg text-primary">{studentTotal}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Grades() {
  const { data: classrooms = [] } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ 
    studentId: string; 
    week?: number; 
    columnId?: string;
    groupId?: string;
    maxScore?: number;
  } | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [gradeType, setGradeType] = useState<GradeType>('participation');

  // Get selected classroom data
  const selectedClassroomData = useMemo(() => {
    return classrooms.find(c => c.id === selectedClassroom);
  }, [classrooms, selectedClassroom]);

  // تحديد الصف الأول تلقائياً
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  const { data: students = [] } = useStudents(selectedClassroom || undefined);
  const { data: grades = [], isLoading } = useGrades(selectedClassroom || undefined);
  const { data: gradingStructure, isLoading: structureLoading } = useClassroomGradingStructure(selectedClassroomData);
  
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

  // فتح نافذة إضافة/تعديل درجة (للعرض البسيط)
  const openGradeDialog = (studentId: string, week: number) => {
    const existingGrade = getGradeForWeek(studentId, week);
    setSelectedCell({ studentId, week });
    setGradeValue(existingGrade ? String(existingGrade.score) : '');
    setGradeType(existingGrade ? existingGrade.type as GradeType : 'participation');
    setIsDialogOpen(true);
  };

  // فتح نافذة إضافة/تعديل درجة (للعرض المتقدم)
  const openStructuredGradeDialog = (studentId: string, columnId: string, groupId: string, maxScore: number) => {
    const existingGrade = grades.find(g => g.student_id === studentId && g.title === columnId);
    setSelectedCell({ studentId, columnId, groupId, maxScore });
    setGradeValue(existingGrade ? String(existingGrade.score) : '');
    setGradeType('participation');
    setIsDialogOpen(true);
  };

  // حفظ الدرجة
  const handleSaveGrade = async () => {
    if (!selectedCell || !gradeValue) return;
    
    const score = parseFloat(gradeValue);
    const maxScore = selectedCell.maxScore || 10;
    
    // التحقق من الحد الأقصى
    if (score > maxScore) {
      toast.error(`الدرجة لا يمكن أن تتجاوز ${maxScore}`);
      return;
    }
    
    if (score < 0) {
      toast.error('الدرجة لا يمكن أن تكون سالبة');
      return;
    }
    
    if (selectedCell.week !== undefined) {
      // Simple grading mode
      const existingGrade = getGradeForWeek(selectedCell.studentId, selectedCell.week);
      
      if (existingGrade) {
        await updateGrade.mutateAsync({
          id: existingGrade.id,
          score: score,
          type: gradeType,
        });
      } else {
        await createGrade.mutateAsync({
          student_id: selectedCell.studentId,
          classroom_id: selectedClassroom,
          type: gradeType,
          title: `الأسبوع ${selectedCell.week}`,
          score: score,
          max_score: maxScore,
          week_number: selectedCell.week,
        });
      }
    } else if (selectedCell.columnId) {
      // Structured grading mode
      const existingGrade = grades.find(g => 
        g.student_id === selectedCell.studentId && 
        g.title === selectedCell.columnId
      );
      
      if (existingGrade) {
        await updateGrade.mutateAsync({
          id: existingGrade.id,
          score: score,
          type: 'participation',
        });
      } else {
        await createGrade.mutateAsync({
          student_id: selectedCell.studentId,
          classroom_id: selectedClassroom,
          type: 'participation',
          title: selectedCell.columnId,
          score: score,
          max_score: maxScore,
          week_number: 1,
        });
      }
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

  // Check if we have a grading structure
  const hasStructure = gradingStructure?.structure?.groups && gradingStructure.structure.groups.length > 0;

  return (
    <TeacherLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">سجل الدرجات</h1>
            <p className="text-muted-foreground mt-1">
              {hasStructure 
                ? `نظام الدرجات: ${gradingStructure.name_ar}` 
                : 'تتبع درجات الطلاب الأسبوعية'}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
        </div>

        {/* Structure Info Card */}
        {hasStructure && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Table className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{gradingStructure.name_ar}</span>
                    <div className="flex gap-2 mt-1">
                      {gradingStructure.structure.groups.map(group => (
                        <Badge 
                          key={group.id} 
                          variant="outline"
                          style={{ borderColor: group.border, backgroundColor: group.color }}
                        >
                          {group.name_ar} ({group.columns.length})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Structure Warning */}
        {!hasStructure && selectedClassroomData && !structureLoading && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-warning">لم يتم تعيين نظام درجات لهذا الصف</p>
                  <p className="text-sm text-muted-foreground">
                    يتم استخدام النظام الافتراضي. يمكن للمشرف تعيين نظام درجات مخصص من إعدادات النظام.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {structureLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Grading View */}
        {!structureLoading && (
          hasStructure ? (
            <StructuredGradingView
              structure={gradingStructure.structure}
              students={students}
              isLoading={isLoading}
              grades={grades}
              onCellClick={openStructuredGradeDialog}
            />
          ) : (
            <SimpleGradingView
              students={students}
              grades={grades}
              isLoading={isLoading}
              visibleWeeks={visibleWeeks}
              currentWeekStart={currentWeekStart}
              goToPreviousWeeks={goToPreviousWeeks}
              goToNextWeeks={goToNextWeeks}
              openGradeDialog={openGradeDialog}
              getGradeForWeek={getGradeForWeek}
              getTotalScore={getTotalScore}
              getGradeColor={getGradeColor}
            />
          )
        )}

        {/* Grade Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {selectedCell?.week 
                  ? (getGradeForWeek(selectedCell.studentId, selectedCell.week) ? 'تعديل الدرجة' : 'إضافة درجة')
                  : (grades.find(g => g.student_id === selectedCell?.studentId && g.title === selectedCell?.columnId) ? 'تعديل الدرجة' : 'إضافة درجة')
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedCell?.week !== undefined && (
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
              )}
              <div className="space-y-2">
                <Label>الدرجة (من {selectedCell?.maxScore || 10})</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedCell?.maxScore || 10}
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
    </TeacherLayout>
  );
}
