import { Student } from '@/hooks/useStudents';
import { useGrades } from '@/hooks/useGrades';
import { useBehaviorNotes } from '@/hooks/useBehaviorNotes';
import { useAttendance } from '@/hooks/useAttendance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartPulse, Clock, UserX, ThumbsUp, ThumbsDown, GraduationCap, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
        "group relative flex flex-col p-4 rounded-2xl cursor-pointer h-[180px]",
        "glass-card-interactive",
        "hover:shadow-xl"
      )}
    >
      {/* Classroom label */}
      {classroomName && (
        <div className="absolute top-3 left-3">
          <span className="text-[10px] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
            {classroomName}
          </span>
        </div>
      )}

      {/* Arrow indicator */}
      <div className="absolute top-4 left-3 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-1">
        <ChevronLeft className="w-4 h-4 text-primary" />
      </div>

      {/* Header with avatar and name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          {student.special_needs && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1.5 shadow-md">
              <HeartPulse className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
            {student.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {student.student_id}
          </p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        {/* Grades */}
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 text-xs bg-primary/10 text-primary border-0 px-2.5 py-1"
        >
          <GraduationCap className="w-3 h-3" />
          <span className="font-medium">{totalScore}</span>
        </Badge>
        
        {/* Absences */}
        {absentCount > 0 && (
          <Badge 
            variant="destructive" 
            className="flex items-center gap-1 text-xs px-2.5 py-1"
          >
            <UserX className="w-3 h-3" />
            {absentCount}
          </Badge>
        )}
        
        {/* Late */}
        {lateCount > 0 && (
          <Badge 
            variant="outline" 
            className="flex items-center gap-1 text-xs bg-warning/10 text-warning border-warning/30 px-2.5 py-1"
          >
            <Clock className="w-3 h-3" />
            {lateCount}
          </Badge>
        )}
        
        {/* Behavior */}
        {positiveNotes > 0 && (
          <Badge 
            variant="outline" 
            className="flex items-center gap-1 text-xs bg-success/10 text-success border-success/30 px-2.5 py-1"
          >
            <ThumbsUp className="w-3 h-3" />
            {positiveNotes}
          </Badge>
        )}
        
        {negativeNotes > 0 && (
          <Badge 
            variant="outline" 
            className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive border-destructive/30 px-2.5 py-1"
          >
            <ThumbsDown className="w-3 h-3" />
            {negativeNotes}
          </Badge>
        )}
        
        {/* Behavior points total */}
        {behaviorPoints !== 0 && (
          <Badge 
            className={cn(
              "flex items-center gap-1 text-xs mr-auto px-2.5 py-1",
              behaviorPoints >= 0 
                ? "bg-success text-success-foreground" 
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {behaviorPoints > 0 ? '+' : ''}{behaviorPoints}
          </Badge>
        )}
      </div>
    </div>
  );
}
