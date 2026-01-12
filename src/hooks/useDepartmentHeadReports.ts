import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherStats {
  teacher_id: string;
  full_name: string;
  avatar_url: string | null;
  school_name: string | null;
  subject: string | null;
  classrooms_count: number;
  students_count: number;
  grades_count: number;
  attendance_count: number;
  behavior_notes_count: number;
  positive_notes_count: number;
  negative_notes_count: number;
  average_grade_percentage: number | null;
  attendance_rate: number | null;
}

export function useDepartmentHeadReports() {
  return useQuery({
    queryKey: ['department_head_reports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get the department head's email
      const { data: dhProfile } = await supabase
        .from('department_heads')
        .select('email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!dhProfile) return [];

      // Get accepted invitations
      const { data: invitations, error: invError } = await supabase
        .from('teacher_department_head_invitations')
        .select('teacher_id')
        .eq('department_head_email', dhProfile.email)
        .eq('status', 'accepted');

      if (invError) throw invError;
      if (!invitations || invitations.length === 0) return [];

      const teacherIds = invitations.map(inv => inv.teacher_id);

      // Get teacher profiles
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, school_name, subject')
        .in('user_id', teacherIds);

      if (teachersError) throw teachersError;
      if (!teachers) return [];

      // Fetch stats for each teacher
      const statsPromises = teachers.map(async (teacher) => {
        // Get classrooms count
        const { count: classroomsCount } = await supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', teacher.user_id)
          .eq('is_archived', false);

        // Get students count
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', teacher.user_id);

        // Get grades count and average
        const { data: gradesData, count: gradesCount } = await supabase
          .from('grades')
          .select('score, max_score', { count: 'exact' })
          .eq('user_id', teacher.user_id);

        let averageGradePercentage: number | null = null;
        if (gradesData && gradesData.length > 0) {
          const totalPercentage = gradesData.reduce((sum, g) => {
            return sum + (Number(g.score) / Number(g.max_score)) * 100;
          }, 0);
          averageGradePercentage = Math.round(totalPercentage / gradesData.length);
        }

        // Get attendance count
        const { data: attendanceData, count: attendanceCount } = await supabase
          .from('attendance_records')
          .select('status', { count: 'exact' })
          .eq('user_id', teacher.user_id);

        let attendanceRate: number | null = null;
        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter(a => a.status === 'present').length;
          attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
        }

        // Get behavior notes count
        const { data: behaviorData, count: behaviorCount } = await supabase
          .from('behavior_notes')
          .select('type', { count: 'exact' })
          .eq('user_id', teacher.user_id);

        let positiveNotesCount = 0;
        let negativeNotesCount = 0;
        if (behaviorData) {
          positiveNotesCount = behaviorData.filter(b => b.type === 'positive').length;
          negativeNotesCount = behaviorData.filter(b => b.type === 'negative').length;
        }

        return {
          teacher_id: teacher.user_id,
          full_name: teacher.full_name,
          avatar_url: teacher.avatar_url,
          school_name: teacher.school_name,
          subject: teacher.subject,
          classrooms_count: classroomsCount || 0,
          students_count: studentsCount || 0,
          grades_count: gradesCount || 0,
          attendance_count: attendanceCount || 0,
          behavior_notes_count: behaviorCount || 0,
          positive_notes_count: positiveNotesCount,
          negative_notes_count: negativeNotesCount,
          average_grade_percentage: averageGradePercentage,
          attendance_rate: attendanceRate,
        } as TeacherStats;
      });

      return Promise.all(statsPromises);
    },
  });
}

export function useTeacherDetailedStats(teacherId: string) {
  return useQuery({
    queryKey: ['teacher_detailed_stats', teacherId],
    queryFn: async () => {
      // Get classrooms with student counts
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select(`
          id,
          name,
          subject,
          color,
          is_archived
        `)
        .eq('user_id', teacherId)
        .eq('is_archived', false);

      if (!classrooms) return { classrooms: [], recentGrades: [], recentAttendance: [] };

      // Get student counts per classroom
      const classroomsWithCounts = await Promise.all(
        classrooms.map(async (classroom) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', classroom.id);

          return {
            ...classroom,
            students_count: count || 0,
          };
        })
      );

      // Get recent grades (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentGrades } = await supabase
        .from('grades')
        .select('id, title, score, max_score, date, type')
        .eq('user_id', teacherId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(20);

      // Get recent attendance (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentAttendance } = await supabase
        .from('attendance_records')
        .select('id, date, status')
        .eq('user_id', teacherId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      return {
        classrooms: classroomsWithCounts,
        recentGrades: recentGrades || [],
        recentAttendance: recentAttendance || [],
      };
    },
    enabled: !!teacherId,
  });
}
