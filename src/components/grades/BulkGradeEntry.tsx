import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Check } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface BulkGradeEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  columnName: string;
  maxScore: number;
  onSave: (grades: { studentId: string; score: number }[]) => Promise<void>;
}

export function BulkGradeEntry({
  open,
  onOpenChange,
  students,
  columnName,
  maxScore,
  onSave
}: BulkGradeEntryProps) {
  const [bulkScore, setBulkScore] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set(students.map(s => s.id)));
  const [saving, setSaving] = useState(false);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedStudents(new Set(students.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedStudents(new Set());
  };

  const handleSave = async () => {
    const score = parseFloat(bulkScore);
    
    if (isNaN(score) || score < 0) {
      return;
    }
    
    if (score > maxScore) {
      return;
    }
    
    if (selectedStudents.size === 0) {
      return;
    }
    
    setSaving(true);
    try {
      const grades = Array.from(selectedStudents).map(studentId => ({
        studentId,
        score
      }));
      
      await onSave(grades);
      onOpenChange(false);
      setBulkScore('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            إدخال جماعي للدرجات
          </DialogTitle>
          <DialogDescription>
            {columnName} - الحد الأقصى: {maxScore}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Score Input */}
          <div className="space-y-2">
            <Label>الدرجة لجميع الطلاب المحددين</Label>
            <Input
              type="number"
              min={0}
              max={maxScore}
              value={bulkScore}
              onChange={(e) => setBulkScore(e.target.value)}
              placeholder={`0 - ${maxScore}`}
              className="text-center text-2xl h-14 font-bold"
            />
          </div>
          
          {/* Quick Score Buttons */}
          <div className="grid grid-cols-6 gap-1.5">
            {[0, Math.round(maxScore * 0.25), Math.round(maxScore * 0.5), Math.round(maxScore * 0.75), maxScore - 1, maxScore].map(val => (
              <Button
                key={val}
                type="button"
                variant={bulkScore === String(val) ? "default" : "outline"}
                size="sm"
                className="h-10 font-bold"
                onClick={() => setBulkScore(String(val))}
              >
                {val}
              </Button>
            ))}
          </div>
          
          {/* Student Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اختر الطلاب ({selectedStudents.size} من {students.length})</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  تحديد الكل
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  إلغاء الكل
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-1">
                {students.map(student => {
                  const isSelected = selectedStudents.has(student.id);
                  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <Avatar className="w-8 h-8">
                        {student.avatar_url ? (
                          <AvatarImage src={student.avatar_url} />
                        ) : null}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1">{student.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          
          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !bulkScore || selectedStudents.size === 0}
            className="w-full h-11"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                حفظ الدرجات لـ {selectedStudents.size} طالب
                {bulkScore && (
                  <Badge variant="secondary" className="mr-2">
                    {bulkScore} / {maxScore}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
