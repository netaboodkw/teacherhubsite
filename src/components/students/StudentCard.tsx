import { Student } from '@/hooks/useStudents';
import { useGrades } from '@/hooks/useGrades';
import { useBehaviorNotes } from '@/hooks/useBehaviorNotes';
import { useAttendance } from '@/hooks/useAttendance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, HeartPulse, Clock, UserX, ThumbsUp, ThumbsDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-[180px]"
    >
      {/* Header with avatar and name */}
      <div className="flex items-center gap-4">
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
      
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        {/* Grades */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <GraduationCap className="w-3 h-3" />
                {totalScore}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>مجموع الدرجات</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Absences */}
        {absentCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                  <UserX className="w-3 h-3" />
                  {absentCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>عدد الغياب</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Late */}
        {lateCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 text-xs bg-warning/10 text-warning border-warning/30">
                  <Clock className="w-3 h-3" />
                  {lateCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>عدد التأخير</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Positive behavior */}
        {positiveNotes > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 text-xs bg-success/10 text-success border-success/30">
                  <ThumbsUp className="w-3 h-3" />
                  {positiveNotes}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>سلوكيات إيجابية</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Negative behavior */}
        {negativeNotes > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive border-destructive/30">
                  <ThumbsDown className="w-3 h-3" />
                  {negativeNotes}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>سلوكيات سلبية</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Behavior points total */}
        {behaviorPoints !== 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={behaviorPoints >= 0 ? 'default' : 'destructive'} 
                  className="flex items-center gap-1 text-xs mr-auto"
                >
                  {behaviorPoints > 0 ? '+' : ''}{behaviorPoints} نقطة
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>مجموع نقاط السلوك</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
