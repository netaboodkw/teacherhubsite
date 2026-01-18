import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Crown, Medal, Award } from 'lucide-react';

interface BehaviorNote {
  id: string;
  student_id: string;
  type: string;
  points: number;
  date: string;
}

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface GlassWeeklyLeaderboardProps {
  students: Student[];
  behaviorNotes: BehaviorNote[];
  classroomId: string;
}

// Get current week boundaries
function getCurrentWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToSunday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
}

export function GlassWeeklyLeaderboard({ students, behaviorNotes, classroomId }: GlassWeeklyLeaderboardProps) {
  const { weekStart, weekEnd } = getCurrentWeekBounds();

  const weeklyRanking = useMemo(() => {
    const studentPoints: { [studentId: string]: number } = {};
    
    const weekNotes = behaviorNotes.filter(note => {
      return note.date >= weekStart && note.date <= weekEnd;
    });
    
    weekNotes.forEach(note => {
      if (!studentPoints[note.student_id]) {
        studentPoints[note.student_id] = 0;
      }
      studentPoints[note.student_id] += note.points;
    });
    
    return students
      .map(student => ({
        ...student,
        points: studentPoints[student.id] || 0,
      }))
      .filter(s => s.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [students, behaviorNotes, weekStart, weekEnd]);

  if (weeklyRanking.length === 0) return null;

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-primary/50" />;
    }
  };

  const getShortName = (fullName: string) => {
    const parts = fullName.split(' ');
    return parts.slice(0, 2).join(' ');
  };

  return (
    <GlassCard variant="interactive" className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-yellow-600" />
        <h3 className="font-bold text-sm">🏆 أبطال الأسبوع</h3>
      </div>
      <div className="space-y-2">
        {weeklyRanking.map((student, index) => (
          <div 
            key={student.id}
            className={`flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm ${
              index === 0 ? 'bg-yellow-500/20' :
              index === 1 ? 'bg-gray-500/20' :
              index === 2 ? 'bg-amber-500/20' :
              'bg-muted/30'
            }`}
          >
            <span className="font-bold text-sm w-6 text-center">{index + 1}</span>
            {getMedalIcon(index + 1)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{getShortName(student.name)}</p>
            </div>
            <span className="font-bold text-sm text-green-600">+{student.points}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
