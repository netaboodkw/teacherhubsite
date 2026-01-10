import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { useGrades, useCreateGrade, GradeType } from '@/hooks/useGrades';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, Plus, Trophy, Loader2 } from 'lucide-react';

export default function Grades() {
  const { data: classrooms = [] } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0]?.id || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({ studentId: '', type: 'exam' as GradeType, title: '', score: '', maxScore: '100' });

  const { data: students = [] } = useStudents(selectedClassroom || undefined);
  const { data: grades = [] } = useGrades(selectedClassroom || undefined);
  const createGrade = useCreateGrade();

  const getStudentGrades = (studentId: string) => grades.filter(g => g.student_id === studentId);
  const calculateAverage = (studentId: string) => {
    const sg = getStudentGrades(studentId);
    if (sg.length === 0) return null;
    return Math.round(sg.reduce((acc, g) => acc + (g.score / g.max_score) * 100, 0) / sg.length);
  };

  const handleAddGrade = async () => {
    if (!gradeForm.studentId || !gradeForm.title || !gradeForm.score) return;
    await createGrade.mutateAsync({
      student_id: gradeForm.studentId, classroom_id: selectedClassroom, type: gradeForm.type,
      title: gradeForm.title, score: parseFloat(gradeForm.score), max_score: parseFloat(gradeForm.maxScore),
    });
    setIsDialogOpen(false);
    setGradeForm({ studentId: '', type: 'exam', title: '', score: '', maxScore: '100' });
  };

  const gradeTypeLabels = { exam: 'اختبار', assignment: 'واجب', participation: 'مشاركة', project: 'مشروع' };
  const getGradeColor = (p: number) => p >= 90 ? 'text-success' : p >= 70 ? 'text-primary' : p >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div><h1 className="text-2xl lg:text-3xl font-bold text-foreground">سجل الدرجات</h1><p className="text-muted-foreground mt-1">تتبع درجات الطلاب وأدائهم</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}><SelectTrigger className="w-48"><SelectValue placeholder="اختر الصف" /></SelectTrigger><SelectContent>{classrooms.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button className="gradient-hero"><Plus className="w-4 h-4 ml-2" />إضافة درجة</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl"><DialogHeader><DialogTitle>إضافة درجة جديدة</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>الطالب</Label><Select value={gradeForm.studentId} onValueChange={(v) => setGradeForm({ ...gradeForm, studentId: v })}><SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger><SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>نوع التقييم</Label><Select value={gradeForm.type} onValueChange={(v) => setGradeForm({ ...gradeForm, type: v as GradeType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="exam">اختبار</SelectItem><SelectItem value="assignment">واجب</SelectItem><SelectItem value="participation">مشاركة</SelectItem><SelectItem value="project">مشروع</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>عنوان التقييم</Label><Input placeholder="مثال: اختبار الفصل الأول" value={gradeForm.title} onChange={(e) => setGradeForm({ ...gradeForm, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>الدرجة</Label><Input type="number" value={gradeForm.score} onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })} /></div><div className="space-y-2"><Label>من</Label><Input type="number" value={gradeForm.maxScore} onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })} /></div></div>
                  <Button className="w-full gradient-hero mt-4" onClick={handleAddGrade} disabled={createGrade.isPending}>{createGrade.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة الدرجة'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-border bg-muted/30"><th className="text-right p-4 font-medium text-muted-foreground">الطالب</th><th className="text-center p-4 font-medium text-muted-foreground">الدرجات</th><th className="text-center p-4 font-medium text-muted-foreground">المعدل</th></tr></thead>
            <tbody>{students.map((student) => { const sg = getStudentGrades(student.id); const avg = calculateAverage(student.id); const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              return (<tr key={student.id} className="border-b border-border hover:bg-muted/30"><td className="p-4"><div className="flex items-center gap-3"><Avatar className="w-10 h-10"><AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar><div><p className="font-medium">{student.name}</p><p className="text-sm text-muted-foreground">{student.student_id}</p></div></div></td><td className="p-4"><div className="flex flex-wrap justify-center gap-2">{sg.length > 0 ? sg.map((g) => (<div key={g.id} className="px-3 py-1 rounded-full bg-muted text-sm"><span className={getGradeColor((g.score / g.max_score) * 100)}>{g.score}</span>/{g.max_score}</div>)) : <span className="text-muted-foreground text-sm">لا توجد درجات</span>}</div></td><td className="p-4 text-center">{avg !== null ? <div className="inline-flex items-center gap-2">{avg >= 90 && <Trophy className="w-4 h-4 text-warning" />}<span className={`text-lg font-bold ${getGradeColor(avg)}`}>{avg}%</span></div> : <span className="text-muted-foreground">-</span>}</td></tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
