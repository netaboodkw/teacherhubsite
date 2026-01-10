import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reports() {
  const { classrooms, students, attendance } = useApp();

  // Calculate attendance stats per classroom
  const attendanceByClass = classrooms.map(classroom => {
    const classStudents = students.filter(s => s.classroomId === classroom.id);
    const classAttendance = attendance.filter(a => a.classroomId === classroom.id);
    const presentCount = classAttendance.filter(a => a.status === 'present').length;
    const totalRecords = classAttendance.length;
    
    return {
      name: classroom.name.slice(0, 15),
      حضور: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      طلاب: classStudents.length,
    };
  });

  // Overall attendance distribution
  const attendanceDistribution = [
    { name: 'حاضر', value: attendance.filter(a => a.status === 'present').length, color: 'hsl(142, 71%, 45%)' },
    { name: 'غائب', value: attendance.filter(a => a.status === 'absent').length, color: 'hsl(0, 84%, 60%)' },
    { name: 'متأخر', value: attendance.filter(a => a.status === 'late').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'بعذر', value: attendance.filter(a => a.status === 'excused').length, color: 'hsl(215, 16%, 47%)' },
  ].filter(item => item.value > 0);

  const handleExport = (type: 'pdf' | 'csv') => {
    // Placeholder for export functionality
    console.log(`Exporting as ${type}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">التقارير والتحليلات</h1>
            <p className="text-muted-foreground mt-1">عرض وتحليل بيانات الصفوف والطلاب</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <FileText className="w-4 h-4 ml-2" />
              تصدير CSV
            </Button>
            <Button className="gradient-hero" onClick={() => handleExport('pdf')}>
              <FileDown className="w-4 h-4 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي الصفوف</CardDescription>
              <CardTitle className="text-3xl">{classrooms.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي الطلاب</CardDescription>
              <CardTitle className="text-3xl">{students.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>سجلات الحضور</CardDescription>
              <CardTitle className="text-3xl">{attendance.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance by Class Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                نسبة الحضور حسب الصف
              </CardTitle>
              <CardDescription>
                مقارنة نسب الحضور بين الصفوف المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceByClass} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                    <Bar 
                      dataKey="حضور" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع الحضور</CardTitle>
              <CardDescription>
                نظرة عامة على حالات الحضور
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {attendanceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات حضور بعد
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students per Class */}
        <Card>
          <CardHeader>
            <CardTitle>عدد الطلاب حسب الصف</CardTitle>
            <CardDescription>
              توزيع الطلاب على الصفوف الدراسية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceByClass}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar 
                    dataKey="طلاب" 
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
