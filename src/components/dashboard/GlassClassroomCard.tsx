import { Link, useNavigate } from 'react-router-dom';
import { Users, Clock, ChevronLeft, Pencil } from 'lucide-react';
import { Classroom } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { GlassButton } from '@/components/ui/glass-button';
import { cn } from '@/lib/utils';

// Color mapping for Tailwind class names to hex colors
const colorClassToHex: { [key: string]: string } = {
  'bg-blue-200': '#bfdbfe',
  'bg-blue-500': '#3b82f6',
  'bg-yellow-200': '#fef08a',
  'bg-yellow-500': '#eab308',
  'bg-teal-200': '#99f6e4',
  'bg-teal-500': '#14b8a6',
  'bg-green-200': '#bbf7d0',
  'bg-green-500': '#22c55e',
  'bg-red-200': '#fecaca',
  'bg-red-500': '#ef4444',
  'bg-purple-200': '#e9d5ff',
  'bg-purple-500': '#a855f7',
  'bg-pink-200': '#fbcfe8',
  'bg-pink-500': '#ec4899',
  'bg-orange-200': '#fed7aa',
  'bg-orange-500': '#f97316',
  'bg-indigo-200': '#c7d2fe',
  'bg-indigo-500': '#6366f1',
  'bg-cyan-200': '#a5f3fc',
  'bg-cyan-500': '#06b6d4',
  'bg-primary': '#00b8d4',
};

const getHexColor = (color: string | null | undefined): string => {
  if (!color) return '#888888';
  if (color.startsWith('#')) return color;
  return colorClassToHex[color] || '#888888';
};

interface GlassClassroomCardProps {
  classroom: Classroom;
  basePath?: string;
  showEditButton?: boolean;
}

export function GlassClassroomCard({ classroom, basePath = '', showEditButton = false }: GlassClassroomCardProps) {
  const { data: students = [] } = useStudents(classroom.id);
  const navigate = useNavigate();
  const linkPath = basePath ? `${basePath}/classrooms/${classroom.id}` : `/classrooms/${classroom.id}`;
  const editPath = basePath ? `${basePath}/classrooms/${classroom.id}/edit` : `/classrooms/${classroom.id}/edit`;
  const hexColor = getHexColor(classroom.color);
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(editPath);
  };

  return (
    <Link to={linkPath}>
      <div 
        className={cn(
          "group relative overflow-hidden rounded-2xl p-5 min-h-[140px]",
          "glass-card-interactive",
          "hover:shadow-xl"
        )}
      >
        {/* Gradient color indicator */}
        <div 
          className="absolute top-0 right-0 w-1.5 h-full rounded-l-full"
          style={{ 
            background: `linear-gradient(180deg, ${hexColor} 0%, ${hexColor}99 100%)`,
            boxShadow: `0 0 12px ${hexColor}40`
          }}
        />
        
        {/* Subtle background glow */}
        <div 
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
          style={{ backgroundColor: hexColor }}
        />
        
        <div className="relative pr-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                {classroom.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{classroom.subject}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {showEditButton && (
                <GlassButton
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleEditClick}
                  title="تعديل الصف"
                >
                  <Pencil className="w-4 h-4" />
                </GlassButton>
              )}
              <div className="p-2 rounded-xl bg-muted/30 group-hover:bg-primary/10 transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{students.length} طالب</span>
            </div>
            {classroom.schedule && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30">
                <Clock className="w-3.5 h-3.5" />
                <span>{classroom.schedule}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
