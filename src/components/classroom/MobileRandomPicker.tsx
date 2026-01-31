import { useState, useEffect } from 'react';
import { MobileSheet, MobileSheetFooter } from '@/components/ui/mobile-sheet';
import { Button } from '@/components/ui/button';
import { User, Shuffle, Check, X, RotateCcw, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface MobileRandomPickerProps {
  students: Student[];
  classroomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileRandomPicker({ students, classroomId, open, onOpenChange }: MobileRandomPickerProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  
  // Track shown students to avoid repetition
  const [shownStudentIds, setShownStudentIds] = useState<Set<string>>(new Set());
  const availableStudents = students.filter(s => !shownStudentIds.has(s.id));

  const pickRandomStudent = () => {
    if (students.length === 0) return;
    
    // Reset if all students have been shown
    let currentAvailable = availableStudents;
    if (currentAvailable.length === 0) {
      setShownStudentIds(new Set());
      currentAvailable = students;
      toast.success('تم عرض جميع الطلاب، بدء جولة جديدة');
    }
    
    setShowResult(false);
    setAnswerResult(null);
    setIsSpinning(true);
    
    let count = 0;
    const maxCount = 15 + Math.floor(Math.random() * 10);
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudent(students[randomIndex]);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setIsSpinning(false);
        setShowResult(true);
        // Final random selection from available students only
        const finalIndex = Math.floor(Math.random() * currentAvailable.length);
        const finalStudent = currentAvailable[finalIndex];
        setSelectedStudent(finalStudent);
        setShownStudentIds(prev => new Set([...prev, finalStudent.id]));
      }
    }, 100);
  };

  const handleAnswer = async (result: 'correct' | 'wrong') => {
    if (!selectedStudent || !classroomId) return;
    
    setSavingAnswer(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { error } = await supabase
        .from('behavior_notes')
        .insert({
          student_id: selectedStudent.id,
          classroom_id: classroomId,
          user_id: user.id,
          type: result === 'correct' ? 'positive' : 'negative',
          description: result === 'correct' ? 'إجابة صحيحة' : 'إجابة خاطئة',
          points: result === 'correct' ? 1 : -1,
        });

      if (error) throw error;
      
      setAnswerResult(result);
      toast.success(result === 'correct' ? 'تم تسجيل الإجابة الصحيحة' : 'تم تسجيل الإجابة الخاطئة');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSavingAnswer(false);
    }
  };

  const reset = () => {
    setSelectedStudent(null);
    setShowResult(false);
    setAnswerResult(null);
  };

  const resetAll = () => {
    reset();
    setShownStudentIds(new Set());
  };

  // Only reset selection when dialog closes, keep shown students for the session
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  return (
    <MobileSheet 
      open={open} 
      onOpenChange={onOpenChange}
      title="اختيار عشوائي"
    >
      {/* Remaining Students Counter */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg py-2 px-4 mx-4 mb-4">
        <Users className="h-4 w-4" />
        <span>المتبقي: {availableStudents.length} من {students.length}</span>
        {shownStudentIds.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 ml-1" />
            بدء جديد
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center py-6 space-y-6">
        {/* Student Display */}
        <div 
          className={cn(
            "relative w-36 h-36 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300",
            isSpinning && "animate-pulse scale-110",
            showResult && answerResult === 'correct' && "ring-4 ring-green-500 ring-offset-4",
            showResult && answerResult === 'wrong' && "ring-4 ring-red-500 ring-offset-4",
            !selectedStudent && "bg-muted"
          )}
        >
          {selectedStudent ? (
            selectedStudent.avatar_url ? (
              <img
                src={selectedStudent.avatar_url}
                alt={selectedStudent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <User className="h-20 w-20 text-primary" />
              </div>
            )
          ) : (
            <Shuffle className="h-16 w-16 text-muted-foreground" />
          )}
          
          {/* Result Badge */}
          {answerResult && (
            <div 
              className={cn(
                "absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                answerResult === 'correct' ? "bg-green-500" : "bg-red-500"
              )}
            >
              {answerResult === 'correct' ? (
                <Check className="h-7 w-7 text-white" />
              ) : (
                <X className="h-7 w-7 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Student Name */}
        <div className="text-center">
          {selectedStudent ? (
            <h3 className={cn(
              "text-2xl font-bold transition-all",
              isSpinning && "blur-sm"
            )}>
              {selectedStudent.name}
            </h3>
          ) : (
            <p className="text-muted-foreground text-lg">اضغط للاختيار العشوائي</p>
          )}
        </div>

        {/* Action Buttons */}
        <MobileSheetFooter className="w-full space-y-4">
          {!showResult ? (
            <Button 
              size="lg" 
              onClick={pickRandomStudent}
              disabled={isSpinning || students.length === 0}
              className="gap-2 w-full h-14 text-lg"
            >
              <Shuffle className={cn("h-6 w-6", isSpinning && "animate-spin")} />
              {isSpinning ? 'جاري الاختيار...' : 'اختر طالب'}
            </Button>
          ) : (
            <div className="space-y-4">
              {!answerResult && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    className="gap-2 flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
                    onClick={() => handleAnswer('correct')}
                    disabled={savingAnswer}
                  >
                    {savingAnswer ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-6 w-6" />}
                    صحيح
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 flex-1 h-14 text-lg bg-red-600 hover:bg-red-700"
                    onClick={() => handleAnswer('wrong')}
                    disabled={savingAnswer}
                  >
                    {savingAnswer ? <Loader2 className="h-6 w-6 animate-spin" /> : <X className="h-6 w-6" />}
                    خطأ
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={pickRandomStudent}
                  className="gap-2 flex-1 h-12"
                >
                  <Shuffle className="h-5 w-5" />
                  اختيار آخر
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={reset}
                  className="gap-2 h-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </MobileSheetFooter>
      </div>
    </MobileSheet>
  );
}
