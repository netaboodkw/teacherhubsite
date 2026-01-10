import { Student } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
    >
      <Avatar className="w-12 h-12 border-2 border-primary/20">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {student.name}
        </h4>
        <p className="text-sm text-muted-foreground truncate">
          {student.studentId}
        </p>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          // Handle more options
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  );
}
