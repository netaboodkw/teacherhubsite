import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { useDepartmentHeadContext } from '@/contexts/DepartmentHeadContext';
import { useTeacherClassrooms } from '@/hooks/useDepartmentHeadData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GraduationCap, Search, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function ClassroomsContent() {
  const { selectedTeacherId } = useDepartmentHeadContext();
  const { data: classrooms = [], isLoading } = useTeacherClassrooms(selectedTeacherId);
  const [searchTerm, setSearchTerm] = useState('');

  // Get student counts per classroom
  const classroomIds = classrooms?.map((c: any) => c.id) || [];
  const { data: studentCounts = {} } = useQuery({
    queryKey: ['dh-classroom-student-counts', classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return {};
      
      const counts: Record<string, number> = {};
      for (const id of classroomIds) {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', id);
        counts[id] = count || 0;
      }
      return counts;
    },
    enabled: classroomIds.length > 0,
  });

  const filteredClassrooms = classrooms.filter((c: any) => 
    c.name.includes(searchTerm) || c.subject.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">الصفوف الدراسية</h1>
        <p className="text-muted-foreground mt-1">عرض جميع صفوف المعلم</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن صف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Classrooms Grid */}
      {filteredClassrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.map((classroom: any) => (
            <Link key={classroom.id} to={`/department-head/classrooms/${classroom.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full border-r-4" style={{ borderRightColor: classroom.color?.replace('bg-', '') || 'hsl(var(--primary))' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{classroom.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{classroom.subject}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{studentCounts[classroom.id] || 0} طالب</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">لا توجد صفوف</h3>
            <p className="text-muted-foreground">
              لا توجد صفوف لهذا المعلم
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DHClassrooms() {
  return (
    <DepartmentHeadViewLayout>
      <ClassroomsContent />
    </DepartmentHeadViewLayout>
  );
}
