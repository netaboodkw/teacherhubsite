import { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Crown, Medal, Award } from 'lucide-react';
import { HeroCelebration } from './HeroCelebration';

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

interface StudentWithPoints extends Student {
  points: number;
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

// Get today's date
function getTodayBounds() {
  const today = new Date().toISOString().split('T')[0];
  return { today };
}

export function GlassWeeklyLeaderboard({ students, behaviorNotes, classroomId }: GlassWeeklyLeaderboardProps) {
  const { weekStart, weekEnd } = getCurrentWeekBounds();
  const { today } = getTodayBounds();
  
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'daily' | 'weekly'>('weekly');
  const [selectedHero, setSelectedHero] = useState<StudentWithPoints | null>(null);

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

  // Daily hero calculation
  const dailyHero = useMemo(() => {
    const studentPoints: { [studentId: string]: number } = {};
    
    const todayNotes = behaviorNotes.filter(note => note.date === today);
    
    todayNotes.forEach(note => {
      if (!studentPoints[note.student_id]) {
        studentPoints[note.student_id] = 0;
      }
      studentPoints[note.student_id] += note.points;
    });
    
    const ranked = students
      .map(student => ({
        ...student,
        points: studentPoints[student.id] || 0,
      }))
      .filter(s => s.points > 0)
      .sort((a, b) => b.points - a.points);
    
    return ranked[0] || null;
  }, [students, behaviorNotes, today]);

  const handleHeroClick = (student: StudentWithPoints, type: 'daily' | 'weekly') => {
    setSelectedHero(student);
    setCelebrationType(type);
    setCelebrationOpen(true);
  };

  if (weeklyRanking.length === 0 && !dailyHero) return null;

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
    <>
      <GlassCard variant="interactive" className="p-3">
        {/* Daily Hero Section */}
        {dailyHero && (
          <div 
            className="mb-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 cursor-pointer hover:from-blue-500/30 hover:to-cyan-500/30 transition-all active:scale-[0.98]"
            onClick={() => handleHeroClick(dailyHero, 'daily')}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden ring-2 ring-blue-500/50">
                {dailyHero.avatar_url ? (
                  <img
                    src={dailyHero.avatar_url}
                    alt={dailyHero.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Crown className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">⭐ بطل اليوم</p>
                <p className="font-bold text-sm">{getShortName(dailyHero.name)}</p>
              </div>
              <span className="font-bold text-sm text-blue-600">+{dailyHero.points}</span>
            </div>
          </div>
        )}

        {/* Weekly Leaderboard */}
        {weeklyRanking.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-yellow-600" />
              <h3 className="font-bold text-sm">🏆 أبطال الأسبوع</h3>
            </div>
            <div className="space-y-2">
              {weeklyRanking.map((student, index) => (
                <button 
                  key={student.id}
                  type="button"
                  className={`flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] w-full text-right ${
                    index === 0 ? 'bg-yellow-500/20 hover:bg-yellow-500/30' :
                    index === 1 ? 'bg-gray-500/20 hover:bg-gray-500/30' :
                    index === 2 ? 'bg-amber-500/20 hover:bg-amber-500/30' :
                    'bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleHeroClick(student, 'weekly');
                  }}
                >
                  <span className="font-bold text-sm w-6 text-center">{index + 1}</span>
                  {getMedalIcon(index + 1)}
                  {/* Avatar for iPad/larger screens */}
                  <div className="hidden md:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center overflow-hidden">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Crown className="h-5 w-5 text-primary/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getShortName(student.name)}</p>
                  </div>
                  <span className="font-bold text-sm text-green-600">+{student.points}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </GlassCard>

      {/* Hero Celebration Modal */}
      <HeroCelebration
        student={selectedHero}
        type={celebrationType}
        open={celebrationOpen}
        onOpenChange={setCelebrationOpen}
      />
    </>
  );
}
