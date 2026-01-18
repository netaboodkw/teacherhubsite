import { Link, useNavigate } from 'react-router-dom';
import { Users, Clock, ChevronLeft, Pencil } from 'lucide-react';
import { Classroom } from '@/hooks/useClassrooms';
import { useStudents } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';

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
  const hexColor = getHexColor(classroom.color);
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(editPath);
  };

  return (
    <Link to={linkPath}>
      <div 
        className="group relative overflow-hidden rounded-2xl p-5 shadow-sm border hover:shadow-lg transition-all duration-300 min-h-[140px]"
        style={{ 
          backgroundColor: `${hexColor}15`,
          borderColor: `${hexColor}40`,
        }}
      >
        {/* Color indicator */}
        <div 
          className="absolute top-0 right-0 w-2 h-full"
          style={{ backgroundColor: hexColor }}
        />
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
          style={{ 
            background: `radial-gradient(ellipse at top right, ${hexColor}20, transparent 70%)` 
          }}
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
