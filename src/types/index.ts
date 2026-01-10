export interface Classroom {
  id: string;
  name: string;
  subject: string;
  schedule: string;
  studentsCount: number;
  color: string;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  classroomId: string;
  avatar?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface Grade {
  id: string;
  studentId: string;
  classroomId: string;
  type: 'exam' | 'assignment' | 'participation' | 'project';
  title: string;
  score: number;
  maxScore: number;
  date: string;
}

export interface BehaviorNote {
  id: string;
  studentId: string;
  classroomId: string;
  type: 'positive' | 'negative';
  description: string;
  points: number;
  date: string;
}
