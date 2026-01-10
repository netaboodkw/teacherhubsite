import { Link } from 'react-router-dom';
import { Users, Clock, ChevronLeft } from 'lucide-react';
import { Classroom } from '@/types';
import { cn } from '@/lib/utils';

interface ClassroomCardProps {
  classroom: Classroom;
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  return (
    <Link to={`/classrooms/${classroom.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300">
        {/* Color indicator */}
        <div className={cn(
          "absolute top-0 right-0 w-2 h-full",
          classroom.color
        )} />
        
        <div className="pr-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {classroom.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{classroom.subject}</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{classroom.studentsCount} طالب</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{classroom.schedule}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
