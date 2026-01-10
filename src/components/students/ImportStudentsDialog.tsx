import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useCreateStudent } from '@/hooks/useStudents';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, X, Check, Edit2, UserPlus } from 'lucide-react';

interface ExtractedStudent {
  name: string;
  editing: boolean;
}

export function ImportStudentsDialog({ 
  open, 
  onOpenChange,
  defaultClassroomId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  defaultClassroomId?: string;
}) {
  const navigate = useNavigate();
  const { data: classrooms = [] } = useClassrooms();
  const createStudent = useCreateStudent();
  
  const [step, setStep] = useState<'upload' | 'review' | 'importing'>('upload');
  const [selectedClassroom, setSelectedClassroom] = useState(defaultClassroomId || '');
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImage(file);
  };

  const processImage = async (file: File) => {
    setLoading(true);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call edge function to extract names
      const { data, error } = await supabase.functions.invoke('extract-students', {
        body: { image: base64 }
      });

      if (error) throw error;

      if (data.names && data.names.length > 0) {
        setExtractedStudents(data.names.map((name: string) => ({ name, editing: false })));
        setStep('review');
        toast.success(`تم استخراج ${data.names.length} اسم`);
      } else {
        toast.error('لم يتم العثور على أسماء في الصورة');
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast.error('حدث خطأ أثناء معالجة الصورة');
    } finally {
      setLoading(false);
    }
  };

  const updateStudentName = (index: number, name: string) => {
    setExtractedStudents(prev => 
      prev.map((s, i) => i === index ? { ...s, name } : s)
    );
  };

  const toggleEdit = (index: number) => {
    setExtractedStudents(prev => 
      prev.map((s, i) => i === index ? { ...s, editing: !s.editing } : s)
    );
  };

  const removeStudent = (index: number) => {
    setExtractedStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (!selectedClassroom) {
      toast.error('يرجى اختيار الصف');
      return;
    }

    const validStudents = extractedStudents.filter(s => s.name.trim());
    if (validStudents.length === 0) {
      toast.error('لا يوجد طلاب للاستيراد');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        await createStudent.mutateAsync({
          name: student.name.trim(),
          student_id: `STU-${Date.now()}-${i}`,
          classroom_id: selectedClassroom,
        });
        setImportProgress(((i + 1) / validStudents.length) * 100);
      }

      toast.success(`تم استيراد ${validStudents.length} طالب بنجاح`);
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      console.error('Error importing students:', error);
      toast.error('حدث خطأ أثناء الاستيراد');
      setStep('review');
    }
  };

  const resetState = () => {
    setStep('upload');
    setExtractedStudents([]);
    setImportProgress(0);
    setSelectedClassroom(defaultClassroomId || '');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            استيراد الطلاب
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'التقط صورة لقائمة الطلاب أو اختر صورة من جهازك'}
            {step === 'review' && 'راجع الأسماء المستخرجة وعدّلها إذا لزم الأمر'}
            {step === 'importing' && 'جاري استيراد الطلاب...'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اختر الصف</Label>
              <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name} - {classroom.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading || !selectedClassroom}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Camera className="h-8 w-8" />
                )}
                <span>التقاط صورة</span>
              </Button>

              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || !selectedClassroom}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8" />
                )}
                <span>اختيار صورة</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {loading && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">جاري استخراج الأسماء بالذكاء الاصطناعي...</p>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              تم استخراج {extractedStudents.length} اسم. اضغط على القلم للتعديل أو X للحذف.
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {extractedStudents.map((student, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <span className="w-6 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  {student.editing ? (
                    <Input
                      value={student.name}
                      onChange={(e) => updateStudentName(index, e.target.value)}
                      onBlur={() => toggleEdit(index)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleEdit(index)}
                      autoFocus
                      className="flex-1"
                    />
                  ) : (
                    <span className="flex-1">{student.name}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEdit(index)}
                  >
                    {student.editing ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Edit2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStudent(index)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                رجوع
              </Button>
              <Button onClick={handleImport} disabled={extractedStudents.length === 0}>
                استيراد {extractedStudents.length} طالب
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="font-medium">جاري الاستيراد...</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round(importProgress)}%
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
