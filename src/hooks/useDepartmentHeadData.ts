import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to get classrooms for a specific teacher (for department head view)
export function useTeacherClassrooms(teacherId: string | null) {
  return useQuery({
    queryKey: ['teacher_classrooms', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];

      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          education_levels (name, name_ar),
          grade_levels (name, name_ar, grade_number),
          subjects (name, name_ar)
        `)
        .eq('user_id', teacherId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherId,
  });
}

// Hook to get a specific classroom
export function useTeacherClassroom(classroomId: string | null) {
  return useQuery({
    queryKey: ['teacher_classroom', classroomId],
    queryFn: async () => {
      if (!classroomId) return null;

      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          education_levels (name, name_ar),
          grade_levels (name, name_ar, grade_number),
          subjects (name, name_ar),
          teacher_grading_templates (*)
        `)
        .eq('id', classroomId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!classroomId,
  });
}

// Hook to get students for a specific teacher
export function useTeacherStudents(teacherId: string | null, classroomId?: string) {
  return useQuery({
    queryKey: ['teacher_students', teacherId, classroomId],
    queryFn: async () => {
      if (!teacherId) return [];

      let query = supabase
        .from('students')
        .select(`
          *,
          classrooms (name, subject, color)
        `)
        .eq('user_id', teacherId)
        .order('name');

      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherId,
  });
}

// Hook to get grades for a specific teacher/classroom
export function useTeacherGrades(teacherId: string | null, classroomId?: string) {
  return useQuery({
    queryKey: ['teacher_grades', teacherId, classroomId],
    queryFn: async () => {
      if (!teacherId) return [];

      let query = supabase
        .from('grades')
        .select('*')
        .eq('user_id', teacherId);

      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherId,
  });
}

// Hook to get attendance for a specific teacher
export function useTeacherAttendance(teacherId: string | null, classroomId?: string, date?: string) {
  return useQuery({
    queryKey: ['teacher_attendance', teacherId, classroomId, date],
    queryFn: async () => {
      if (!teacherId) return [];

      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          students (name, avatar_url),
          classrooms (name)
        `)
        .eq('user_id', teacherId);

      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherId,
  });
}

// Hook to get behavior notes for a specific teacher
export function useTeacherBehaviorNotes(teacherId: string | null, classroomId?: string, studentId?: string) {
  return useQuery({
    queryKey: ['teacher_behavior_notes', teacherId, classroomId, studentId],
    queryFn: async () => {
      if (!teacherId) return [];

      let query = supabase
        .from('behavior_notes')
        .select(`
          *,
          students (name, avatar_url),
          classrooms (name)
        `)
        .eq('user_id', teacherId);

      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherId,
  });
}

// Hook to get student positions for a classroom
export function useTeacherStudentPositions(classroomId: string | null) {
  return useQuery({
    queryKey: ['teacher_student_positions', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from('student_positions')
        .select('*')
        .eq('classroom_id', classroomId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
  });
}
