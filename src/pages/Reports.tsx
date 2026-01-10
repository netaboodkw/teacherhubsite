import { MainLayout } from '@/components/layout/MainLayout';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { useAttendance } from '@/hooks/useAttendance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, FileText, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reports() {
  const { data: classrooms = [], isLoading: lc } = useClassrooms();
  const { data: students = [], isLoading: ls } = useStudents();
  const { data: attendance = [], isLoading: la } = useAttendance();

  const isLoading = lc || ls || la;

  const attendanceByClass = classrooms.map(c => {
    const cs = students.filter(s => s.classroom_id === c.id);
    const ca = attendance.filter(a => a.classroom_id === c.id);
    const pc = ca.filter(a => a.status === 'present').length;
    return { name: c.name.slice(0, 15), حضور: ca.length > 0 ? Math.round((pc / ca.length) * 100) : 0, طلاب: cs.length };
  });

  const attendanceDistribution = [
    { name: 'حاضر', value: attendance.filter(a => a.status === 'present').length, color: 'hsl(142, 71%, 45%)' },
    { name: 'غائب', value: attendance.filter(a => a.status === 'absent').length, color: 'hsl(0, 84%, 60%)' },
    { name: 'متأخر', value: attendance.filter(a => a.status === 'late').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'بعذر', value: attendance.filter(a => a.status === 'excused').length, color: 'hsl(215, 16%, 47%)' },
  ].filter(i => i.value > 0);

  if (isLoading) return <MainLayout><div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div><h1 className="text-2xl lg:text-3xl font-bold text-foreground">التقارير والتحليلات</h1><p className="text-muted-foreground mt-1">عرض وتحليل بيانات الصفوف والطلاب</p></div>
          <div className="flex gap-3"><Button variant="outline"><FileText className="w-4 h-4 ml-2" />تصدير CSV</Button><Button className="gradient-hero"><FileDown className="w-4 h-4 ml-2" />تصدير PDF</Button></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardDescription>إجمالي الصفوف</CardDescription><CardTitle className="text-3xl">{classrooms.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>إجمالي الطلاب</CardDescription><CardTitle className="text-3xl">{students.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>سجلات الحضور</CardDescription><CardTitle className="text-3xl">{attendance.length}</CardTitle></CardHeader></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />نسبة الحضور حسب الصف</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={attendanceByClass} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="حضور" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
          <Card><CardHeader><CardTitle>توزيع الحضور</CardTitle></CardHeader><CardContent><div className="h-[300px]">{attendanceDistribution.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={attendanceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{attendanceDistribution.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات حضور بعد</div>}</div></CardContent></Card>
        </div>
      </div>
    </MainLayout>
  );
}
