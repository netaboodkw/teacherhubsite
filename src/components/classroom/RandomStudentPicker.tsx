import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Shuffle, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface RandomStudentPickerProps {
  students: Student[];
  classroomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RandomStudentPicker({ students, classroomId, open, onOpenChange }: RandomStudentPickerProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);

  const pickRandomStudent = () => {
    if (students.length === 0) return;
    
    setShowResult(false);
    setAnswerResult(null);
    setIsSpinning(true);
    
    // Animate through students
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
        // Final random selection
        const finalIndex = Math.floor(Math.random() * students.length);
        setSelectedStudent(students[finalIndex]);
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

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Shuffle className="h-5 w-5" />
            اختيار عشوائي
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Student Display */}
          <div 
            className={cn(
              "relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300",
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
                  <User className="h-16 w-16 text-primary" />
                </div>
              )
            ) : (
              <Shuffle className="h-12 w-12 text-muted-foreground" />
            )}
            
            {/* Result Badge */}
            {answerResult && (
              <div 
                className={cn(
                  "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                  answerResult === 'correct' ? "bg-green-500" : "bg-red-500"
                )}
              >
                {answerResult === 'correct' ? (
                  <Check className="h-6 w-6 text-white" />
                ) : (
                  <X className="h-6 w-6 text-white" />
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
              <p className="text-muted-foreground">اضغط للاختيار العشوائي</p>
            )}
          </div>

          {/* Action Buttons */}
          {!showResult ? (
            <Button 
              size="lg" 
              onClick={pickRandomStudent}
              disabled={isSpinning || students.length === 0}
              className="gap-2 min-w-[160px]"
            >
              <Shuffle className={cn("h-5 w-5", isSpinning && "animate-spin")} />
              {isSpinning ? 'جاري الاختيار...' : 'اختر طالب'}
            </Button>
          ) : (
            <div className="space-y-4 w-full">
              {!answerResult && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
                    onClick={() => handleAnswer('correct')}
                    disabled={savingAnswer}
                  >
                    {savingAnswer ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    صحيح
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                    onClick={() => handleAnswer('wrong')}
                    disabled={savingAnswer}
                  >
                    {savingAnswer ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                    خطأ
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={pickRandomStudent}
                  className="gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  اختيار آخر
                </Button>
                <Button
                  variant="ghost"
                  onClick={reset}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  إعادة تعيين
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
