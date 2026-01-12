import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { useDepartmentHeadContext } from '@/contexts/DepartmentHeadContext';
import { useTeacherClassrooms, useTeacherStudents, useTeacherGrades } from '@/hooks/useDepartmentHeadData';
import { useClassroomGradingStructure } from '@/hooks/useGradingStructures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, User, ChevronDown, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function GradesContent() {
  const [searchParams] = useSearchParams();
  const initialClassroom = searchParams.get('classroom') || '';
  
  const { selectedTeacherId } = useDepartmentHeadContext();
  const { data: classrooms = [], isLoading: loadingClassrooms } = useTeacherClassrooms(selectedTeacherId);
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroom);
  
  const { data: students = [], isLoading: loadingStudents } = useTeacherStudents(selectedTeacherId, selectedClassroom || undefined);
  const { data: grades = [], isLoading: loadingGrades } = useTeacherGrades(selectedTeacherId, selectedClassroom || undefined);
  
  const classroom = classrooms.find((c: any) => c.id === selectedClassroom);
  const { data: gradingStructure } = useClassroomGradingStructure(classroom || null);
  
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  };

  const calculateColumnValue = (studentId: string, column: any, group: any): number => {
    if (column.type === 'score') {
      const grade = grades.find((g: any) => g.student_id === studentId && g.title === column.id);
      return grade?.score || 0;
    }
    if (column.type === 'internal_sum') {
      const sourceIds = column.internalSourceColumns || column.sourceColumnIds || [];
      return sourceIds.reduce((sum: number, colId: string) => {
        const col = group.columns.find((c: any) => c.id === colId);
        return col ? sum + calculateColumnValue(studentId, col, group) : sum;
      }, 0);
    }
    if (column.type === 'total') {
      const sourceIds = column.sourceColumnIds || group.columns.filter((c: any) => c.type === 'score').map((c: any) => c.id);
      return sourceIds.reduce((sum: number, colId: string) => {
        const col = group.columns.find((c: any) => c.id === colId);
        return col ? sum + calculateColumnValue(studentId, col, group) : sum;
      }, 0);
    }
    if (column.type === 'grand_total' || column.type === 'group_sum' || column.type === 'external_sum') {
      let total = 0;
      if (column.sourceGroupIds) {
        column.sourceGroupIds.forEach((key: string) => {
          if (key.includes(':')) {
            const [grpId, colId] = key.split(':');
            const grp = gradingStructure?.structure?.groups?.find((g: any) => g.id === grpId);
            const col = grp?.columns.find((c: any) => c.id === colId);
            if (col && grp) total += calculateColumnValue(studentId, col, grp);
          }
        });
      }
      if (column.externalSourceColumns) {
        column.externalSourceColumns.forEach((key: string) => {
          const [grpId, colId] = key.split(':');
          const grp = gradingStructure?.structure?.groups?.find((g: any) => g.id === grpId);
          const col = grp?.columns.find((c: any) => c.id === colId);
          if (col && grp) total += calculateColumnValue(studentId, col, grp);
        });
      }
      if (column.sourceColumnIds) {
        column.sourceColumnIds.forEach((colId: string) => {
          const col = group.columns.find((c: any) => c.id === colId);
          if (col) total += calculateColumnValue(studentId, col, group);
        });
      }
      return total;
    }
    return 0;
  };

  const calculateGroupTotal = (studentId: string, group: any): number => {
    const totalCol = group.columns.find((c: any) => c.type === 'total');
    if (totalCol) return calculateColumnValue(studentId, totalCol, group);
    return group.columns.filter((c: any) => c.type === 'score').reduce((sum: number, col: any) => {
      const grade = grades.find((g: any) => g.student_id === studentId && g.title === col.id);
      return sum + (grade?.score || 0);
    }, 0);
  };

  const calculateGroupMaxScore = (group: any): number => {
    const totalCol = group.columns.find((c: any) => c.type === 'total');
    if (totalCol) return totalCol.max_score;
    return group.columns.filter((c: any) => c.type === 'score').reduce((sum: number, c: any) => sum + c.max_score, 0);
  };

  const calculateStudentTotal = (studentId: string) => {
    if (!gradingStructure) return 0;
    return (gradingStructure.structure?.groups || []).reduce((sum: number, group: any) => {
      return sum + group.columns.filter((c: any) => c.type === 'score').reduce((s: number, col: any) => {
        const grade = grades.find((g: any) => g.student_id === studentId && g.title === col.id);
        return s + (grade?.score || 0);
      }, 0);
    }, 0);
  };

  const calculateTotalMaxScore = () => {
    if (!gradingStructure) return 100;
    return (gradingStructure.structure?.groups || []).reduce((sum: number, group: any) => {
      return sum + group.columns.filter((c: any) => c.type === 'score').reduce((s: number, c: any) => s + c.max_score, 0);
    }, 0);
  };

  const isLoading = loadingClassrooms || loadingStudents || loadingGrades;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">الدرجات</h1>
          <p className="text-muted-foreground mt-1">عرض درجات الطلاب</p>
        </div>
        
        <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="اختر الصف" />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name} - {c.subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedClassroom ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">اختر صفاً</h3>
            <p className="text-muted-foreground">الرجاء اختيار صف لعرض درجاته</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !gradingStructure ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">لا يوجد قالب درجات لهذا الصف</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="border p-3 bg-muted text-right min-w-[180px]" rowSpan={2}>اسم الطالب</th>
                    {(gradingStructure.structure?.groups || []).map((group: any) => {
                      const isCollapsed = collapsedGroups.has(group.id);
                      return (
                        <th key={group.id} colSpan={isCollapsed ? 1 : group.columns.length}
                          className="border p-2 text-center font-bold cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: group.color }}
                          onClick={() => toggleGroupCollapse(group.id)}>
                          <div className="flex items-center justify-center gap-2">
                            {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {group.name_ar}
                            {isCollapsed && <Badge variant="secondary" className="text-xs">{group.columns.length}</Badge>}
                          </div>
                        </th>
                      );
                    })}
                    <th className="border p-3 bg-muted text-center min-w-[80px]" rowSpan={2}>
                      المجموع<br/><span className="text-xs text-muted-foreground">({calculateTotalMaxScore()})</span>
                    </th>
                  </tr>
                  <tr>
                    {(gradingStructure.structure?.groups || []).map((group: any) => {
                      const isCollapsed = collapsedGroups.has(group.id);
                      if (isCollapsed) {
                        return <th key={`${group.id}-collapsed`} className="border p-2 text-center text-xs" style={{ backgroundColor: `${group.color}50` }}>
                          المجموع<br/>({calculateGroupMaxScore(group)})
                        </th>;
                      }
                      return group.columns.map((col: any) => (
                        <th key={col.id} className="border p-2 text-center text-xs min-w-[70px]" style={{ backgroundColor: `${group.color}50` }}>
                          {col.name_ar}<br/>({col.max_score})
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={100} className="p-8 text-center text-muted-foreground">لا يوجد طلاب</td></tr>
                  ) : students.map((student: any, idx: number) => {
                    const initials = student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
                    return (
                      <tr key={student.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 border">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm w-6">{idx + 1}</span>
                            <Avatar className="w-8 h-8">
                              {student.avatar_url && <AvatarImage src={student.avatar_url} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{student.name}</span>
                          </div>
                        </td>
                        {(gradingStructure.structure?.groups || []).map((group: any) => {
                          const isCollapsed = collapsedGroups.has(group.id);
                          if (isCollapsed) {
                            const groupTotal = calculateGroupTotal(student.id, group);
                            const maxScore = calculateGroupMaxScore(group);
                            const pct = maxScore > 0 ? (groupTotal / maxScore) * 100 : 0;
                            return <td key={`${group.id}-sum`} className="border p-2 text-center">
                              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold ${
                                pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{groupTotal}</div>
                            </td>;
                          }
                          return group.columns.map((col: any) => {
                            const value = calculateColumnValue(student.id, col, group);
                            const pct = col.max_score > 0 ? (value / col.max_score) * 100 : 0;
                            const isCalculated = col.type !== 'score';
                            return <td key={col.id} className="border p-2 text-center">
                              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                                isCalculated ? 'bg-muted' : pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-yellow-100 text-yellow-700' : pct > 0 ? 'bg-red-100 text-red-700' : 'bg-muted/50 text-muted-foreground'
                              }`}>{value || '-'}</div>
                            </td>;
                          });
                        })}
                        <td className="border p-3 text-center bg-primary/5">
                          <span className="font-bold text-lg text-primary">{calculateStudentTotal(student.id)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DHGrades() {
  return (
    <DepartmentHeadViewLayout>
      <GradesContent />
    </DepartmentHeadViewLayout>
  );
}
