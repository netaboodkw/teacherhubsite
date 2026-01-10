import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function Grades() {
  const { classrooms, getStudentsByClassroom, grades, addGrade } = useApp();
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0]?.id || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    type: 'exam' as 'exam' | 'assignment' | 'participation' | 'project',
    title: '',
    score: '',
    maxScore: '100',
  });

  const students = getStudentsByClassroom(selectedClassroom);

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.studentId === studentId && g.classroomId === selectedClassroom);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return null;
    const total = studentGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0);
    return Math.round(total / studentGrades.length);
  };

  const handleAddGrade = () => {
    if (!gradeForm.studentId || !gradeForm.title || !gradeForm.score) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    addGrade({
      studentId: gradeForm.studentId,
      classroomId: selectedClassroom,
      type: gradeForm.type,
      title: gradeForm.title,
      score: parseFloat(gradeForm.score),
      maxScore: parseFloat(gradeForm.maxScore),
      date: new Date().toISOString().split('T')[0],
    });
    
    toast.success('تمت إضافة الدرجة بنجاح');
    setIsDialogOpen(false);
    setGradeForm({
      studentId: '',
      type: 'exam',
      title: '',
      score: '',
      maxScore: '100',
    });
  };

  const gradeTypeLabels = {
    exam: 'اختبار',
    assignment: 'واجب',
    participation: 'مشاركة',
    project: 'مشروع',
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-primary';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">سجل الدرجات</h1>
            <p className="text-muted-foreground mt-1">تتبع درجات الطلاب وأدائهم</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-hero">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة درجة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة درجة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>الطالب</Label>
                    <Select 
                      value={gradeForm.studentId} 
                      onValueChange={(v) => setGradeForm({ ...gradeForm, studentId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الطالب" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>نوع التقييم</Label>
                    <Select 
                      value={gradeForm.type} 
                      onValueChange={(v) => setGradeForm({ ...gradeForm, type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam">اختبار</SelectItem>
                        <SelectItem value="assignment">واجب</SelectItem>
                        <SelectItem value="participation">مشاركة</SelectItem>
                        <SelectItem value="project">مشروع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان التقييم</Label>
                    <Input
                      id="title"
                      placeholder="مثال: اختبار الفصل الأول"
                      value={gradeForm.title}
                      onChange={(e) => setGradeForm({ ...gradeForm, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="score">الدرجة</Label>
                      <Input
                        id="score"
                        type="number"
                        placeholder="85"
                        value={gradeForm.score}
                        onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">من</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        placeholder="100"
                        value={gradeForm.maxScore}
                        onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <Button className="w-full gradient-hero mt-4" onClick={handleAddGrade}>
                    إضافة الدرجة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right p-4 font-medium text-muted-foreground">الطالب</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">الدرجات</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">المعدل</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const studentGrades = getStudentGrades(student.id);
                  const average = calculateAverage(student.id);
                  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                  
                  return (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-center gap-2">
                          {studentGrades.length > 0 ? (
                            studentGrades.map((grade) => (
                              <div 
                                key={grade.id}
                                className="px-3 py-1 rounded-full bg-muted text-sm"
                                title={`${grade.title} - ${gradeTypeLabels[grade.type]}`}
                              >
                                <span className={getGradeColor((grade.score / grade.maxScore) * 100)}>
                                  {grade.score}
                                </span>
                                <span className="text-muted-foreground">/{grade.maxScore}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">لا توجد درجات</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {average !== null ? (
                          <div className="inline-flex items-center gap-2">
                            {average >= 90 && <Trophy className="w-4 h-4 text-warning" />}
                            <span className={`text-lg font-bold ${getGradeColor(average)}`}>
                              {average}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
