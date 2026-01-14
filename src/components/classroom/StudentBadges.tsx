import { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Medal, Star, TrendingUp, Award, Crown } from 'lucide-react';

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

interface StudentBadgesProps {
  studentId: string;
  classroomId: string;
}

interface StudentBadgeDisplayProps {
  students: Student[];
  behaviorNotes: BehaviorNote[];
  classroomId: string;
}

// Achievement types with their icons and colors
const achievementConfig = {
  gold_medal: {
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    label: 'الميدالية الذهبية',
    description: 'المركز الأول هذا الأسبوع',
  },
  silver_medal: {
    icon: Medal,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    label: 'الميدالية الفضية',
    description: 'المركز الثاني هذا الأسبوع',
  },
  bronze_medal: {
    icon: Medal,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    label: 'الميدالية البرونزية',
    description: 'المركز الثالث هذا الأسبوع',
  },
  star: {
    icon: Star,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    label: 'نجم الأسبوع',
    description: 'أداء متميز طوال الأسبوع',
  },
  rising_star: {
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    label: 'نجم صاعد',
    description: 'تحسن ملحوظ في الأداء',
  },
};

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

// Component to display badges for a single student
export function StudentBadges({ studentId, classroomId }: StudentBadgesProps) {
  const { weekStart } = getCurrentWeekBounds();
  
  const { data: achievements = [] } = useQuery({
    queryKey: ['student-achievements', studentId, classroomId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .eq('week_start', weekStart);
      
      if (error) throw error;
      return data || [];
    },
  });

  if (achievements.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      <TooltipProvider>
        {achievements.map((achievement) => {
          const config = achievementConfig[achievement.achievement_type as keyof typeof achievementConfig];
          if (!config) return null;
          
          const Icon = config.icon;
          
          return (
            <Tooltip key={achievement.id}>
              <TooltipTrigger asChild>
                <div className={`p-1 rounded-full ${config.bgColor} ${config.borderColor} border`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold">{config.label}</p>
                <p className="text-xs">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

// Component to calculate and award badges
export function WeeklyAchievementsManager({ students, behaviorNotes, classroomId }: StudentBadgeDisplayProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { weekStart, weekEnd } = getCurrentWeekBounds();

  // Calculate weekly points for each student
  const weeklyRanking = useMemo(() => {
    const studentPoints: { [studentId: string]: number } = {};
    
    // Filter notes for current week
    const weekNotes = behaviorNotes.filter(note => {
      return note.date >= weekStart && note.date <= weekEnd;
    });
    
    // Calculate total points per student
    weekNotes.forEach(note => {
      if (!studentPoints[note.student_id]) {
        studentPoints[note.student_id] = 0;
      }
      studentPoints[note.student_id] += note.points;
    });
    
    // Create ranking
    return students
      .map(student => ({
        ...student,
        points: studentPoints[student.id] || 0,
      }))
      .filter(s => s.points > 0)
      .sort((a, b) => b.points - a.points);
  }, [students, behaviorNotes, weekStart, weekEnd]);

  // Award achievements based on ranking
  const awardAchievements = useCallback(async () => {
    if (!user || !classroomId || weeklyRanking.length === 0) return;

    try {
      const achievementsToAward: {
        student_id: string;
        classroom_id: string;
        user_id: string;
        achievement_type: string;
        week_start: string;
        week_end: string;
        points: number;
        rank: number;
      }[] = [];

      // Award medals to top 3
      weeklyRanking.slice(0, 3).forEach((student, index) => {
        const achievementType = index === 0 ? 'gold_medal' : index === 1 ? 'silver_medal' : 'bronze_medal';
        achievementsToAward.push({
          student_id: student.id,
          classroom_id: classroomId,
          user_id: user.id,
          achievement_type: achievementType,
          week_start: weekStart,
          week_end: weekEnd,
          points: student.points,
          rank: index + 1,
        });
      });

      // Award star to students with 5+ positive points
      weeklyRanking.forEach((student, index) => {
        if (student.points >= 5) {
          achievementsToAward.push({
            student_id: student.id,
            classroom_id: classroomId,
            user_id: user.id,
            achievement_type: 'star',
            week_start: weekStart,
            week_end: weekEnd,
            points: student.points,
            rank: index + 1,
          });
        }
      });

      // Upsert achievements
      if (achievementsToAward.length > 0) {
        const { error } = await supabase
          .from('student_achievements')
          .upsert(achievementsToAward, {
            onConflict: 'student_id,classroom_id,week_start,achievement_type',
          });

        if (error) {
          console.error('Error awarding achievements:', error);
        } else {
          // Invalidate queries to refresh badges
          queryClient.invalidateQueries({ queryKey: ['student-achievements'] });
        }
      }
    } catch (err) {
      console.error('Error awarding achievements:', err);
    }
  }, [user, classroomId, weeklyRanking, weekStart, weekEnd, queryClient]);

  // Award achievements when ranking changes
  useEffect(() => {
    if (weeklyRanking.length > 0) {
      awardAchievements();
    }
  }, [weeklyRanking, awardAchievements]);

  return null; // This component doesn't render anything visible
}

// Leaderboard component showing top students
export function WeeklyLeaderboard({ students, behaviorNotes, classroomId }: StudentBadgeDisplayProps) {
  const { weekStart, weekEnd } = getCurrentWeekBounds();

  // Calculate weekly points for each student
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
    <div className="bg-gradient-to-l from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-yellow-600" />
        <h3 className="font-bold text-sm text-yellow-800 dark:text-yellow-200">🏆 أبطال الأسبوع</h3>
      </div>
      <div className="space-y-2">
        {weeklyRanking.map((student, index) => (
          <div 
            key={student.id}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              index === 1 ? 'bg-gray-100 dark:bg-gray-800/30' :
              index === 2 ? 'bg-amber-100 dark:bg-amber-900/30' :
              'bg-white/50 dark:bg-white/5'
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
    </div>
  );
}
