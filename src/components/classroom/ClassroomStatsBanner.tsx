import { useMemo, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
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

interface ClassroomStatsBannerProps {
  students: Student[];
  behaviorNotes: BehaviorNote[];
  classroomId: string;
  classroomName: string;
}

// Motivational messages for students
const motivationalMessages = [
  "أنتم نجوم المستقبل! ✨",
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
  "أنتم فخر الوطن! 🇸🇦",
  "بالعلم نبني المستقبل! 🏗️",
];

export function ClassroomStatsBanner({ students, behaviorNotes, classroomId, classroomName }: ClassroomStatsBannerProps) {
  const { user } = useAuth();
  
  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Random motivational message (changes each render/visit)
  const motivationalMessage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    return motivationalMessages[randomIndex];
  }, []);

  // Calculate today's engagement (based on today's behavior notes)
  const todayStats = useMemo(() => {
    const todayNotes = behaviorNotes.filter(note => note.date === today);
    const positiveNotes = todayNotes.filter(note => note.type === 'positive').length;
    const negativeNotes = todayNotes.filter(note => note.type === 'negative').length;
    const totalNotes = todayNotes.length;
    
    // Engagement = percentage of students who received positive notes today
    const engagementRate = students.length > 0 
      ? Math.round((positiveNotes / students.length) * 100)
      : 0;

    return {
      positiveNotes,
      negativeNotes,
      totalNotes,
      engagementRate: Math.min(engagementRate, 100), // Cap at 100%
    };
  }, [behaviorNotes, students, today]);

  // Find best student today (most positive points)
  const bestStudentToday = useMemo(() => {
    const todayNotes = behaviorNotes.filter(note => note.date === today);
    
    if (todayNotes.length === 0) return null;

    // Calculate points per student for today
    const studentPoints: { [studentId: string]: number } = {};
    todayNotes.forEach(note => {
      if (!studentPoints[note.student_id]) {
        studentPoints[note.student_id] = 0;
      }
      studentPoints[note.student_id] += note.points;
    });

    // Find student with highest positive points
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

  // Save stats to database
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

      // Upsert the stats (insert or update if exists)
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

  // Save stats whenever they change
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
    <Card className="mb-4 overflow-hidden">
      <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Motivational Message */}
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-full bg-amber-500/10">
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
            <div className="p-2 rounded-full bg-green-500/10">
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
            <div className="p-2 rounded-full bg-yellow-500/10">
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
    </Card>
  );
}
