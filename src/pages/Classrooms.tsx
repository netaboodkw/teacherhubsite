import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';
import { GlassClassroomCard } from '@/components/dashboard/GlassClassroomCard';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { useClassrooms } from '@/hooks/useClassrooms';
import { School, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Input } from '@/components/ui/input';
import { GlassInput } from '@/components/ui/glass-input';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Classrooms() {
  const { data: classrooms = [], isLoading } = useClassrooms();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isLiquidGlass } = useTheme();

  const filteredClassrooms = classrooms.filter(c => 
    c.name.includes(searchTerm) || c.subject.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  const SearchInput = isLiquidGlass ? GlassInput : Input;
  const ActionButton = isLiquidGlass ? GlassButton : Button;

  return (
    <TeacherLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={School}
          title="الصفوف الدراسية"
          subtitle="إدارة جميع صفوفك الدراسية"
          actions={
            <Link to="/teacher/classrooms/new">
              <ActionButton className={isLiquidGlass ? "" : "gradient-hero shadow-md hover:shadow-lg transition-shadow"}>
                <Plus className="w-4 h-4 ml-2" />
                صف جديد
              </ActionButton>
            </Link>
          }
        />

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <SearchInput
            placeholder="بحث عن صف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Classrooms Grid */}
        {filteredClassrooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClassrooms.map((classroom) => (
              isLiquidGlass ? (
                <GlassClassroomCard 
                  key={classroom.id} 
                  classroom={classroom} 
                  basePath="/teacher" 
                  showEditButton 
                />
              ) : (
                <ClassroomCard 
                  key={classroom.id} 
                  classroom={classroom} 
                  basePath="/teacher" 
                  showEditButton 
                />
              )
            ))}
          </div>
        ) : (
          <EmptyState
            icon={School}
            title="لا توجد صفوف"
            description="ابدأ بإنشاء صف دراسي جديد لإدارة طلابك"
            actionLabel="إنشاء صف"
            onAction={() => navigate('/teacher/classrooms/new')}
          />
        )}
      </div>
    </TeacherLayout>
  );
}
