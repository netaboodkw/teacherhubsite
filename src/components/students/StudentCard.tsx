import { Student } from '@/hooks/useStudents';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      <div className="relative">
        <Avatar className="w-12 h-12 border-2 border-primary/20">
          <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {student.special_needs && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                  <HeartPulse className="w-3 h-3 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>طالب احتياجات خاصة / يحتاج متابعة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {student.name}
        </h4>
        <p className="text-sm text-muted-foreground truncate">
          {student.student_id}
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
