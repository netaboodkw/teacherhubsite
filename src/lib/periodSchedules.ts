// Period schedules for each education level
export interface PeriodTime {
  period: number;
  name: string;
  nameAr: string;
  startTime: string;
  endTime: string;
  duration: number;
  isBreak: boolean;
}

export interface EducationSchedule {
  levelId: string;
  levelName: string;
  levelNameAr: string;
  periods: PeriodTime[];
}

// Elementary School Schedule (المرحلة الابتدائية)
const elementarySchedule: PeriodTime[] = [
  { period: 0, name: 'Morning Meeting', nameAr: 'لقاء الصباح', startTime: '7:15', endTime: '7:30', duration: 15, isBreak: true },
  { period: 1, name: 'Period 1', nameAr: 'الحصة الأولى', startTime: '7:30', endTime: '8:10', duration: 40, isBreak: false },
  { period: 2, name: 'Period 2', nameAr: 'الحصة الثانية', startTime: '8:15', endTime: '8:55', duration: 40, isBreak: false },
  { period: 0, name: 'First Break', nameAr: 'الفرصة الأولى', startTime: '8:55', endTime: '9:25', duration: 30, isBreak: true },
  { period: 3, name: 'Period 3', nameAr: 'الحصة الثالثة', startTime: '9:25', endTime: '10:05', duration: 40, isBreak: false },
  { period: 4, name: 'Period 4', nameAr: 'الحصة الرابعة', startTime: '10:10', endTime: '10:50', duration: 40, isBreak: false },
  { period: 5, name: 'Period 5', nameAr: 'الحصة الخامسة', startTime: '10:55', endTime: '11:35', duration: 40, isBreak: false },
  { period: 0, name: 'Prayer Break', nameAr: 'فرصة الصلاة', startTime: '11:35', endTime: '12:00', duration: 25, isBreak: true },
  { period: 6, name: 'Period 6', nameAr: 'الحصة السادسة', startTime: '12:00', endTime: '12:40', duration: 40, isBreak: false },
  { period: 7, name: 'Period 7', nameAr: 'الحصة السابعة', startTime: '12:45', endTime: '13:25', duration: 40, isBreak: false },
];

// Middle School Schedule (المرحلة المتوسطة)
const middleSchedule: PeriodTime[] = [
  { period: 0, name: 'Morning Meeting', nameAr: 'لقاء الصباح', startTime: '7:30', endTime: '7:40', duration: 10, isBreak: true },
  { period: 1, name: 'Period 1', nameAr: 'الحصة الأولى', startTime: '7:40', endTime: '8:25', duration: 45, isBreak: false },
  { period: 2, name: 'Period 2', nameAr: 'الحصة الثانية', startTime: '8:30', endTime: '9:15', duration: 45, isBreak: false },
  { period: 0, name: 'First Break', nameAr: 'الفرصة الأولى', startTime: '9:15', endTime: '9:30', duration: 15, isBreak: true },
  { period: 3, name: 'Period 3', nameAr: 'الحصة الثالثة', startTime: '9:30', endTime: '10:15', duration: 45, isBreak: false },
  { period: 4, name: 'Period 4', nameAr: 'الحصة الرابعة', startTime: '10:20', endTime: '11:05', duration: 45, isBreak: false },
  { period: 5, name: 'Period 5', nameAr: 'الحصة الخامسة', startTime: '11:10', endTime: '11:55', duration: 45, isBreak: false },
  { period: 0, name: 'Prayer Break', nameAr: 'فرصة الصلاة', startTime: '11:55', endTime: '12:05', duration: 10, isBreak: true },
  { period: 6, name: 'Period 6', nameAr: 'الحصة السادسة', startTime: '12:05', endTime: '12:50', duration: 45, isBreak: false },
  { period: 7, name: 'Period 7', nameAr: 'الحصة السابعة', startTime: '12:55', endTime: '13:40', duration: 45, isBreak: false },
];

// High School Schedule (المرحلة الثانوية)
const highSchedule: PeriodTime[] = [
  { period: 0, name: 'Morning Meeting', nameAr: 'لقاء الصباح', startTime: '7:45', endTime: '7:55', duration: 10, isBreak: true },
  { period: 1, name: 'Period 1', nameAr: 'الحصة الأولى', startTime: '7:55', endTime: '8:40', duration: 45, isBreak: false },
  { period: 2, name: 'Period 2', nameAr: 'الحصة الثانية', startTime: '8:45', endTime: '9:30', duration: 45, isBreak: false },
  { period: 3, name: 'Period 3', nameAr: 'الحصة الثالثة', startTime: '9:35', endTime: '10:20', duration: 45, isBreak: false },
  { period: 0, name: 'First Break', nameAr: 'الفرصة الأولى', startTime: '10:20', endTime: '10:35', duration: 15, isBreak: true },
  { period: 4, name: 'Period 4', nameAr: 'الحصة الرابعة', startTime: '10:35', endTime: '11:20', duration: 45, isBreak: false },
  { period: 5, name: 'Period 5', nameAr: 'الحصة الخامسة', startTime: '11:25', endTime: '12:10', duration: 45, isBreak: false },
  { period: 0, name: 'Prayer Break', nameAr: 'فرصة الصلاة', startTime: '12:10', endTime: '12:20', duration: 10, isBreak: true },
  { period: 6, name: 'Period 6', nameAr: 'الحصة السادسة', startTime: '12:20', endTime: '13:05', duration: 45, isBreak: false },
  { period: 7, name: 'Period 7', nameAr: 'الحصة السابعة', startTime: '13:10', endTime: '13:55', duration: 45, isBreak: false },
];

export const educationSchedules: EducationSchedule[] = [
  { levelId: 'elementary', levelName: 'Elementary', levelNameAr: 'المرحلة الابتدائية', periods: elementarySchedule },
  { levelId: 'middle', levelName: 'Middle School', levelNameAr: 'المرحلة المتوسطة', periods: middleSchedule },
  { levelId: 'high', levelName: 'High School', levelNameAr: 'المرحلة الثانوية', periods: highSchedule },
];

export function getScheduleByEducationLevel(educationLevelName?: string): EducationSchedule {
  if (!educationLevelName) return educationSchedules[0];
  
  const lowerName = educationLevelName.toLowerCase();
  
  if (lowerName.includes('ابتدائي') || lowerName.includes('elementary') || lowerName.includes('primary')) {
    return educationSchedules[0];
  }
  if (lowerName.includes('متوسط') || lowerName.includes('middle') || lowerName.includes('intermediate')) {
    return educationSchedules[1];
  }
  if (lowerName.includes('ثانوي') || lowerName.includes('high') || lowerName.includes('secondary')) {
    return educationSchedules[2];
  }
  
  return educationSchedules[0];
}

export const weekDays = [
  { key: 'sunday', name: 'الأحد' },
  { key: 'monday', name: 'الاثنين' },
  { key: 'tuesday', name: 'الثلاثاء' },
  { key: 'wednesday', name: 'الأربعاء' },
  { key: 'thursday', name: 'الخميس' },
];
