import { useMemo, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, TrendingUp, Trophy, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface GlassClassroomStatsBannerProps {
  students: Student[];
  behaviorNotes: BehaviorNote[];
  classroomId: string;
  classroomName: string;
}

// Motivational messages for students (Kuwait specific)
const motivationalMessages = [
  "أنتم نجوم الكويت! ✨",
  "كل يوم فرصة جديدة للتميز! 🌟",
  "النجاح يبدأ بخطوة واحدة! 🚀",
  "معاً نحقق الأحلام! 💪",
  "أنتم قادة الغد! 👑",
  "العلم نور والجهل ظلام! 📚",
  "الاجتهاد طريق النجاح! 🎯",
  "كونوا الأفضل دائماً! 🏆",
  "التميز عادة، فلنتعودها! ⭐",
  "العلم أساس كل تقدم! 🌈",
  "اليوم نتعلم، غداً نقود! 🎓",
  "كل سؤال يفتح باب معرفة! 💡",
  "المثابرة سر التفوق! 🔥",
  "أنتم فخر الكويت! 🇰🇼",
  "بالعلم نبني الكويت! 🏗️",
];

export function GlassClassroomStatsBanner({ students, behaviorNotes, classroomId, classroomName }: GlassClassroomStatsBannerProps) {
  const { user } = useAuth();
  
  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const motivationalMessage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    return motivationalMessages[randomIndex];
  }, []);

  const todayStats = useMemo(() => {
    const todayNotes = behaviorNotes.filter(note => note.date === today);
    const positiveNotes = todayNotes.filter(note => note.type === 'positive').length;
    const negativeNotes = todayNotes.filter(note => note.type === 'negative').length;
    const totalNotes = todayNotes.length;
    
    const engagementRate = students.length > 0 
      ? Math.round((positiveNotes / students.length) * 100)
      : 0;

    return {
      positiveNotes,
      negativeNotes,
      totalNotes,
      engagementRate: Math.min(engagementRate, 100),
    };
  }, [behaviorNotes, students, today]);

  const bestStudentToday = useMemo(() => {
    const todayNotes = behaviorNotes.filter(note => note.date === today);
    
    if (todayNotes.length === 0) return null;

    const studentPoints: { [studentId: string]: number } = {};
    todayNotes.forEach(note => {
      if (!studentPoints[note.student_id]) {
        studentPoints[note.student_id] = 0;
      }
      studentPoints[note.student_id] += note.points;
    });

    let bestStudentId: string | null = null;
    let maxPoints = 0;

    Object.entries(studentPoints).forEach(([studentId, points]) => {
      if (points > maxPoints) {
        maxPoints = points;
        bestStudentId = studentId;
      }
    });

    if (!bestStudentId || maxPoints <= 0) return null;

    const student = students.find(s => s.id === bestStudentId);
    if (!student) return null;

    return {
      ...student,
      points: maxPoints,
    };
  }, [behaviorNotes, students, today]);

  const saveStats = useCallback(async () => {
    if (!user || !classroomId || students.length === 0) return;

    try {
      const statsData = {
        classroom_id: classroomId,
        user_id: user.id,
        date: today,
        best_student_id: bestStudentToday?.id || null,
        best_student_points: bestStudentToday?.points || 0,
        positive_notes_count: todayStats.positiveNotes,
        negative_notes_count: todayStats.negativeNotes,
        total_students: students.length,
        engagement_rate: todayStats.engagementRate,
      };

      const { error } = await supabase
        .from('daily_classroom_stats')
        .upsert(statsData, {
          onConflict: 'classroom_id,date',
        });

      if (error) {
        console.error('Error saving classroom stats:', error);
      }
    } catch (err) {
      console.error('Error saving classroom stats:', err);
    }
  }, [user, classroomId, today, bestStudentToday, todayStats, students.length]);

  useEffect(() => {
    if (todayStats.totalNotes > 0 || bestStudentToday) {
      saveStats();
    }
  }, [todayStats, bestStudentToday, saveStats]);

  const getShortName = (fullName: string) => {
    const parts = fullName.split(' ');
    return parts.slice(0, 2).join(' ');
  };

  return (
    <GlassCard variant="elevated" className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Motivational Message */}
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-full bg-amber-500/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">رسالة اليوم</p>
              <p className="font-bold text-sm sm:text-base bg-gradient-to-l from-amber-600 to-orange-500 bg-clip-text text-transparent">
                {motivationalMessage}
              </p>
            </div>
          </div>

          {/* Today's Engagement Rate */}
          <div className="flex items-center gap-3 justify-center">
            <div className="p-2 rounded-full bg-green-500/20 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-muted-foreground">نسبة التفاعل اليوم</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-bold text-xl text-green-600">{todayStats.engagementRate}%</span>
                <span className="text-xs text-muted-foreground">
                  ({todayStats.positiveNotes} إيجابي)
                </span>
              </div>
            </div>
          </div>

          {/* Best Student Today */}
          <div className="flex items-center gap-3 justify-center sm:justify-end">
            <div className="p-2 rounded-full bg-yellow-500/20 backdrop-blur-sm">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-muted-foreground">الطالب المتميز اليوم</p>
              {bestStudentToday ? (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={bestStudentToday.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-sm">{getShortName(bestStudentToday.name)}</span>
                  <span className="text-xs text-yellow-600 font-medium">+{bestStudentToday.points}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لم يتم التحديد بعد</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
