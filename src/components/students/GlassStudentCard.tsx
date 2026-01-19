import { Student } from '@/hooks/useStudents';
import { useGrades } from '@/hooks/useGrades';
import { useBehaviorNotes } from '@/hooks/useBehaviorNotes';
import { useAttendance } from '@/hooks/useAttendance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartPulse, Clock, UserX, ThumbsUp, ThumbsDown, GraduationCap, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GlassIcon } from '@/components/ui/glass-icon';

interface GlassStudentCardProps {
  student: Student;
  onClick?: () => void;
  classroomName?: string;
}

export function GlassStudentCard({ student, onClick, classroomName }: GlassStudentCardProps) {
  const { data: grades = [] } = useGrades(student.classroom_id, student.id);
  const { data: behaviorNotes = [] } = useBehaviorNotes(student.id);
  const { data: attendance = [] } = useAttendance(student.classroom_id);
  
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  // Calculate total score
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);

  // Calculate behavior points
  const positiveNotes = behaviorNotes.filter(n => n.type === 'positive').length;
  const negativeNotes = behaviorNotes.filter(n => n.type === 'negative').length;
  const behaviorPoints = behaviorNotes.reduce((sum, n) => sum + n.points, 0);

  // Calculate attendance stats for this student
  const studentAttendance = attendance.filter(a => a.student_id === student.id);
  const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
  const lateCount = studentAttendance.filter(a => a.status === 'late').length;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-3 sm:p-4 rounded-2xl cursor-pointer",
        "glass-card-interactive",
        "hover:shadow-xl",
        "min-h-[140px] sm:min-h-[160px]"
      )}
    >
      {/* Header with avatar and info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-base sm:text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          {student.special_needs && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 shadow-md">
              <HeartPulse className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        {/* Name and Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-1">
            {student.name}
          </h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {student.student_id}
          </p>
          {classroomName && (
            <span className="inline-block mt-1.5 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {classroomName}
            </span>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-1 pt-1">
          <ChevronLeft className="w-4 h-4 text-primary" />
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-auto pt-3">
        {/* Grades */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
          <GraduationCap className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-primary">{totalScore}</span>
        </div>
        
        {/* Absences */}
        {absentCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 border border-destructive/20">
            <UserX className="w-3 h-3 text-destructive" />
            <span className="text-xs font-semibold text-destructive">{absentCount}</span>
          </div>
        )}
        
        {/* Late */}
        {lateCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 border border-warning/20">
            <Clock className="w-3 h-3 text-warning" />
            <span className="text-xs font-semibold text-warning">{lateCount}</span>
          </div>
        )}
        
        {/* Positive Behavior */}
        {positiveNotes > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 border border-success/20">
            <ThumbsUp className="w-3 h-3 text-success" />
            <span className="text-xs font-semibold text-success">{positiveNotes}</span>
          </div>
        )}
        
        {/* Negative Behavior */}
        {negativeNotes > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 border border-destructive/20">
            <ThumbsDown className="w-3 h-3 text-destructive" />
            <span className="text-xs font-semibold text-destructive">{negativeNotes}</span>
          </div>
        )}
        
        {/* Behavior points total */}
        {behaviorPoints !== 0 && (
          <div 
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg mr-auto",
              "backdrop-blur-sm",
              behaviorPoints >= 0 
                ? "bg-success/20 border border-success/30" 
                : "bg-destructive/20 border border-destructive/30"
            )}
          >
            <span className={cn(
              "text-xs font-bold",
              behaviorPoints >= 0 ? "text-success" : "text-destructive"
            )}>
              {behaviorPoints > 0 ? '+' : ''}{behaviorPoints}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
