import { Link, useNavigate } from 'react-router-dom';
import { Users, Clock, ChevronLeft, Pencil } from 'lucide-react';
import { Classroom } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ClassroomCardProps {
  classroom: Classroom;
  basePath?: string;
  showEditButton?: boolean;
}

export function ClassroomCard({ classroom, basePath = '', showEditButton = false }: ClassroomCardProps) {
  const { data: students = [] } = useStudents(classroom.id);
  const navigate = useNavigate();
  const linkPath = basePath ? `${basePath}/classrooms/${classroom.id}` : `/classrooms/${classroom.id}`;
  const editPath = basePath ? `${basePath}/classrooms/${classroom.id}/edit` : `/classrooms/${classroom.id}/edit`;
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(editPath);
  };

  return (
    <Link to={linkPath}>
      <div className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 min-h-[140px]">
        {/* Color indicator */}
        <div 
          className="absolute top-0 right-0 w-2 h-full"
          style={{ backgroundColor: classroom.color || '#666' }}
        />
        
        <div className="pr-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                {classroom.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{classroom.subject}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {showEditButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleEditClick}
                  title="تعديل الصف"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{students.length} طالب</span>
            </div>
            {classroom.schedule && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{classroom.schedule}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
