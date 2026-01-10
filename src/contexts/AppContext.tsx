import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Classroom, Student, AttendanceRecord, Grade } from '@/types';

interface AppContextType {
  classrooms: Classroom[];
  students: Student[];
  attendance: AttendanceRecord[];
  grades: Grade[];
  addClassroom: (classroom: Omit<Classroom, 'id'>) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  markAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  getStudentsByClassroom: (classroomId: string) => Student[];
  getAttendanceByClassroom: (classroomId: string, date: string) => AttendanceRecord[];
  getGradesByStudent: (studentId: string) => Grade[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Sample data
const sampleClassrooms: Classroom[] = [
  { id: '1', name: 'الصف الأول - أ', subject: 'الرياضيات', schedule: 'الأحد، الثلاثاء، الخميس', studentsCount: 25, color: 'bg-primary' },
  { id: '2', name: 'الصف الثاني - ب', subject: 'العلوم', schedule: 'الإثنين، الأربعاء', studentsCount: 22, color: 'bg-secondary' },
  { id: '3', name: 'الصف الثالث - أ', subject: 'اللغة العربية', schedule: 'يوميًا', studentsCount: 28, color: 'bg-accent' },
];

const sampleStudents: Student[] = [
  { id: '1', name: 'أحمد محمد', studentId: 'STU001', classroomId: '1' },
  { id: '2', name: 'فاطمة علي', studentId: 'STU002', classroomId: '1' },
  { id: '3', name: 'خالد سعيد', studentId: 'STU003', classroomId: '1' },
  { id: '4', name: 'نورة أحمد', studentId: 'STU004', classroomId: '1' },
  { id: '5', name: 'محمد عبدالله', studentId: 'STU005', classroomId: '2' },
  { id: '6', name: 'سارة خالد', studentId: 'STU006', classroomId: '2' },
  { id: '7', name: 'عمر حسن', studentId: 'STU007', classroomId: '3' },
  { id: '8', name: 'لينا محمود', studentId: 'STU008', classroomId: '3' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [classrooms, setClassrooms] = useState<Classroom[]>(sampleClassrooms);
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const addClassroom = (classroom: Omit<Classroom, 'id'>) => {
    const newClassroom = { ...classroom, id: Date.now().toString() };
    setClassrooms([...classrooms, newClassroom]);
  };

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: Date.now().toString() };
    setStudents([...students, newStudent]);
    // Update classroom student count
    setClassrooms(classrooms.map(c => 
      c.id === student.classroomId 
        ? { ...c, studentsCount: c.studentsCount + 1 }
        : c
    ));
  };

  const markAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
    const existingIndex = attendance.findIndex(
      a => a.studentId === record.studentId && a.date === record.date
    );
    
    if (existingIndex >= 0) {
      const updated = [...attendance];
      updated[existingIndex] = { ...updated[existingIndex], status: record.status };
      setAttendance(updated);
    } else {
      setAttendance([...attendance, { ...record, id: Date.now().toString() }]);
    }
  };

  const addGrade = (grade: Omit<Grade, 'id'>) => {
    const newGrade = { ...grade, id: Date.now().toString() };
    setGrades([...grades, newGrade]);
  };

  const getStudentsByClassroom = (classroomId: string) => 
    students.filter(s => s.classroomId === classroomId);

  const getAttendanceByClassroom = (classroomId: string, date: string) =>
    attendance.filter(a => a.classroomId === classroomId && a.date === date);

  const getGradesByStudent = (studentId: string) =>
    grades.filter(g => g.studentId === studentId);

  return (
    <AppContext.Provider value={{
      classrooms,
      students,
      attendance,
      grades,
      addClassroom,
      addStudent,
      markAttendance,
      addGrade,
      getStudentsByClassroom,
      getAttendanceByClassroom,
      getGradesByStudent,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
