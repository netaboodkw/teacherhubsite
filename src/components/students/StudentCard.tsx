import { Student } from '@/hooks/useStudents';
import { useGrades } from '@/hooks/useGrades';
import { useBehaviorNotes } from '@/hooks/useBehaviorNotes';
import { useAttendance } from '@/hooks/useAttendance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartPulse, Clock, UserX, ThumbsUp, ThumbsDown, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
}

export function StudentCard({ student, onClick }: StudentCardProps) {
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
      className="flex flex-col p-4 rounded-xl bg-card border border-border hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-[160px]"
    >
      {/* Header with avatar and name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {student.special_needs && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
              <HeartPulse className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {student.name}
          </h4>
          <p className="text-sm text-muted-foreground truncate">
            {student.student_id}
          </p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-auto"  >
        {/* Grades */}
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <GraduationCap className="w-3 h-3" />
          {totalScore}
        </Badge>
        
        {/* Absences */}
        {absentCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
            <UserX className="w-3 h-3" />
            {absentCount}
          </Badge>
        )}
        
        {/* Late */}
        {lateCount > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs bg-warning/10 text-warning border-warning/30">
            <Clock className="w-3 h-3" />
            {lateCount}
          </Badge>
        )}
        
        {/* Behavior */}
        {positiveNotes > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs bg-success/10 text-success border-success/30">
            <ThumbsUp className="w-3 h-3" />
            {positiveNotes}
          </Badge>
        )}
        
        {negativeNotes > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive border-destructive/30">
            <ThumbsDown className="w-3 h-3" />
            {negativeNotes}
          </Badge>
        )}
        
        {/* Behavior points total */}
        {behaviorPoints !== 0 && (
          <Badge 
            variant={behaviorPoints >= 0 ? 'default' : 'destructive'} 
            className="flex items-center gap-1 text-xs mr-auto"
          >
            {behaviorPoints > 0 ? '+' : ''}{behaviorPoints}
          </Badge>
        )}
      </div>
    </div>
  );
}
