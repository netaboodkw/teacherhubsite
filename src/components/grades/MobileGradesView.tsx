import { memo, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Plus, Loader2, User } from 'lucide-react';
import { GradingStructureData, GradingGroup, GradingColumn } from '@/hooks/useGradingStructures';

interface MobileGradesViewProps {
  structure: GradingStructureData;
  students: any[];
  grades: any[];
  isLoading: boolean;
  onSaveGrade: (studentId: string, columnId: string, score: number, maxScore: number) => Promise<void>;
}

// Memoized student row component
const StudentRow = memo(({ 
  student, 
  structure, 
  grades, 
  onCellClick,
  calculateColumnValue 
}: {
  student: any;
  structure: GradingStructureData;
  grades: any[];
  onCellClick: (studentId: string, columnId: string, maxScore: number, currentValue: number) => void;
  calculateColumnValue: (studentId: string, column: GradingColumn, group: GradingGroup) => number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const initials = student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  
  // Calculate total
  const total = structure.groups.reduce((sum, group) => {
    return sum + group.columns
      .filter(c => c.type === 'score')
      .reduce((s, col) => {
        const grade = grades.find(g => g.student_id === student.id && g.title === col.id);
        return s + (grade?.score || 0);
      }, 0);
  }, 0);
  
  const maxTotal = structure.groups.reduce((sum, group) => {
    return sum + group.columns
      .filter(c => c.type === 'score')
      .reduce((s, c) => s + c.max_score, 0);
  }, 0);

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full p-3 flex items-center gap-3 text-right active:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <Avatar className="w-10 h-10 shrink-0">
          {student.avatar_url ? (
            <AvatarImage src={student.avatar_url} alt={student.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{student.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {total}/{maxTotal}
            </Badge>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>
      
      {expanded && (
        <CardContent className="pt-0 pb-3 px-3 space-y-3">
          {structure.groups.map(group => (
            <div key={group.id} className="space-y-2">
              <div 
                className="text-sm font-medium px-2 py-1 rounded"
                style={{ backgroundColor: group.color }}
              >
                {group.name_ar}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {group.columns.filter(c => c.type === 'score').map(column => {
                  const value = calculateColumnValue(student.id, column, group);
                  return (
                    <button
                      key={column.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCellClick(student.id, column.id, column.max_score, value);
                      }}
                      className="flex flex-col items-center p-2 rounded-lg border bg-card active:bg-muted transition-colors"
                    >
                      <span className="text-xs text-muted-foreground truncate w-full text-center">
                        {column.name_ar}
                      </span>
                      <span className={`text-lg font-bold ${value > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {value > 0 ? value : '-'}
                      </span>
                      <span className="text-xs text-muted-foreground">/{column.max_score}</span>
                    </button>
                  );
                })}
              </div>
              {/* Group Total */}
              {group.columns.some(c => c.type === 'total') && (
                <div className="flex justify-end">
                  <Badge variant="outline" style={{ borderColor: group.color }}>
                    مجموع: {group.columns
                      .filter(c => c.type === 'score')
                      .reduce((sum, col) => {
                        const grade = grades.find(g => g.student_id === student.id && g.title === col.id);
                        return sum + (grade?.score || 0);
                      }, 0)}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
});

StudentRow.displayName = 'StudentRow';

export function MobileGradesView({
  structure,
  students,
  grades,
  isLoading,
  onSaveGrade
}: MobileGradesViewProps) {
  const [editDialog, setEditDialog] = useState<{
    studentId: string;
    columnId: string;
    maxScore: number;
    currentValue: number;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const calculateColumnValue = useCallback((studentId: string, column: GradingColumn, group: GradingGroup): number => {
    if (column.type === 'score') {
      const grade = grades.find(g => 
        g.student_id === studentId && 
        g.title === column.id
      );
      return grade?.score || 0;
    }
    return 0;
  }, [grades]);

  const handleCellClick = useCallback((studentId: string, columnId: string, maxScore: number, currentValue: number) => {
    setEditDialog({ studentId, columnId, maxScore, currentValue });
    setInputValue(currentValue > 0 ? String(currentValue) : '');
  }, []);

  const handleSave = async () => {
    if (!editDialog || !inputValue) return;
    
    const score = parseFloat(inputValue);
    if (isNaN(score) || score < 0 || score > editDialog.maxScore) return;
    
    setSaving(true);
    try {
      await onSaveGrade(editDialog.studentId, editDialog.columnId, score, editDialog.maxScore);
      setEditDialog(null);
      setInputValue('');
    } finally {
      setSaving(false);
    }
  };

  // Quick score buttons
  const quickScores = editDialog ? 
    [0, Math.floor(editDialog.maxScore / 2), editDialog.maxScore] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <User className="h-12 w-12 mb-4" />
        <p>لا يوجد طلاب في هذا الصف</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {students.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            structure={structure}
            grades={grades}
            onCellClick={handleCellClick}
            calculateColumnValue={calculateColumnValue}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent dir="rtl" className="max-w-[90vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تعديل الدرجة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الدرجة (الحد الأقصى: {editDialog?.maxScore})</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={editDialog?.maxScore}
                step="0.5"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="text-xl text-center h-14"
                autoFocus
              />
            </div>
            
            {/* Quick Score Buttons */}
            <div className="flex gap-2 justify-center">
              {quickScores.map(score => (
                <Button
                  key={score}
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setInputValue(String(score))}
                >
                  {score}
                </Button>
              ))}
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={saving || !inputValue}
              className="w-full h-12"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
