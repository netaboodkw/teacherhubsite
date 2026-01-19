import { useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';
import { GlassClassroomCard } from '@/components/dashboard/GlassClassroomCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useIsMobile } from '@/hooks/use-mobile';
import { School, Plus, Search, Loader2, Users, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Input } from '@/components/ui/input';
import { GlassInput } from '@/components/ui/glass-input';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function Classrooms() {
  const { data: classrooms = [], isLoading } = useClassrooms();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { isLiquidGlass } = useTheme();
  const isMobile = useIsMobile();

  const filteredClassrooms = classrooms.filter(c => 
    c.name.includes(searchTerm) || c.subject.includes(searchTerm)
  );

  const SearchInput = isLiquidGlass ? GlassInput : Input;
  const ActionButton = isLiquidGlass ? GlassButton : Button;

  // Loading state
  const loadingContent = (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري تحميل الصفوف...</p>
      </div>
    </div>
  );

  // Render loading state or content
  if (isLoading) {
    return <TeacherLayout>{loadingContent}</TeacherLayout>;
  }

  // Mobile Layout Content
  const mobileContent = (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-4 py-4 space-y-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">الصفوف الدراسية</h1>
              <p className="text-sm text-muted-foreground">
                {classrooms.length} صف دراسي
              </p>
            </div>
            <Link to="/teacher/classrooms/new">
              <ActionButton size="icon" className="rounded-full h-11 w-11 shadow-lg">
                <Plus className="w-5 h-5" />
              </ActionButton>
            </Link>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <SearchInput
              placeholder="بحث عن صف أو مادة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-11 rounded-xl bg-muted/50 border-0"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-3">
        {filteredClassrooms.length > 0 ? (
          filteredClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
              className={cn(
                "p-4 rounded-2xl border bg-card active:scale-[0.98] transition-all cursor-pointer",
                "flex items-center gap-4"
              )}
            >
              {/* Color Indicator */}
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: classroom.color + '20' }}
              >
                <School className="w-7 h-7" style={{ color: classroom.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{classroom.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{classroom.subject}</p>
              </div>
              
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/teacher/classrooms/${classroom.id}/edit`);
                }}
              >
                تعديل
              </Button>
            </div>
          ))
        ) : searchTerm ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد نتائج</p>
            <p className="text-sm">جرب البحث بكلمات مختلفة</p>
          </div>
        ) : (
          <EmptyState
            icon={School}
            title="لا توجد صفوف"
            description="ابدأ بإنشاء صف دراسي جديد"
            actionLabel="إنشاء صف"
            onAction={() => navigate('/teacher/classrooms/new')}
          />
        )}
      </div>
    </div>
  );

  // Desktop Layout Content
  const desktopContent = (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border border-border/50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <School className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الصفوف الدراسية</h1>
              <p className="text-muted-foreground">إدارة جميع صفوفك وطلابك</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="text-center px-6 py-2 bg-background/50 rounded-xl border border-border/50">
            <p className="text-3xl font-bold text-primary">{classrooms.length}</p>
            <p className="text-sm text-muted-foreground">صف دراسي</p>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <SearchInput
            placeholder="بحث عن صف أو مادة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-12 h-12 text-base rounded-xl"
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Link to="/teacher/classrooms/new">
            <ActionButton size="lg" className="gap-2 h-12 px-6">
              <Plus className="w-5 h-5" />
              صف جديد
            </ActionButton>
          </Link>
        </div>
      </div>

      {/* Classrooms Grid/List */}
      {filteredClassrooms.length > 0 ? (
        viewMode === 'grid' ? (
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
          <div className="space-y-3">
            {filteredClassrooms.map((classroom) => (
              <div
                key={classroom.id}
                onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
                className={cn(
                  "p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer",
                  "flex items-center gap-4"
                )}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: classroom.color + '20' }}
                >
                  <School className="w-6 h-6" style={{ color: classroom.color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{classroom.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{classroom.subject}</p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/teacher/classrooms/${classroom.id}/edit`);
                  }}
                >
                  تعديل
                </Button>
              </div>
            ))}
          </div>
        )
      ) : searchTerm ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-xl font-medium">لا توجد نتائج للبحث</p>
          <p className="text-sm mt-1">جرب البحث بكلمات مختلفة</p>
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
  );

  return (
    <TeacherLayout>
      {isMobile ? mobileContent : desktopContent}
    </TeacherLayout>
  );
}
