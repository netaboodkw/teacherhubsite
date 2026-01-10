import { MainLayout } from '@/components/layout/MainLayout';
import { ClassroomCard } from '@/components/dashboard/ClassroomCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useApp } from '@/contexts/AppContext';
import { GraduationCap, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Classrooms() {
  const { classrooms } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClassrooms = classrooms.filter(c => 
    c.name.includes(searchTerm) || c.subject.includes(searchTerm)
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">الصفوف الدراسية</h1>
            <p className="text-muted-foreground mt-1">إدارة جميع صفوفك الدراسية</p>
          </div>
          <Link to="/classrooms/new">
            <Button className="gradient-hero shadow-md hover:shadow-lg transition-shadow">
              <Plus className="w-4 h-4 ml-2" />
              صف جديد
            </Button>
          </Link>
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
            {filteredClassrooms.map((classroom) => (
              <ClassroomCard key={classroom.id} classroom={classroom} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="لا توجد صفوف"
            description="ابدأ بإنشاء صف دراسي جديد لإدارة طلابك"
            actionLabel="إنشاء صف"
            onAction={() => {}}
          />
        )}
      </div>
    </MainLayout>
  );
}
