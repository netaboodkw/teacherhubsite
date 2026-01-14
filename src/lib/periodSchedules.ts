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

// Get current time in Kuwait timezone
export function getKuwaitTime(): Date {
  const now = new Date();
  // Kuwait is UTC+3
  const kuwaitOffset = 3 * 60; // minutes
  const localOffset = now.getTimezoneOffset(); // minutes (negative for east of UTC)
  const totalOffset = kuwaitOffset + localOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
}

// Get current day key in Kuwait timezone
export function getKuwaitDayKey(): string {
  const kuwaitTime = getKuwaitTime();
  const dayIndex = kuwaitTime.getDay();
  const dayMap: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return dayMap[dayIndex];
}

// Get current date string in Kuwait timezone (YYYY-MM-DD)
export function getKuwaitDateString(): string {
  const kuwaitTime = getKuwaitTime();
  const year = kuwaitTime.getFullYear();
  const month = String(kuwaitTime.getMonth() + 1).padStart(2, '0');
  const day = String(kuwaitTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse time string (HH:MM) to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get current period based on classroom schedule and Kuwait time
export function getCurrentPeriod(
  classSchedule: Record<string, number[]> | null | undefined,
  educationLevelName?: string
): { period: number; periodInfo: PeriodTime | null; isClassDay: boolean } {
  const kuwaitTime = getKuwaitTime();
  const currentDayKey = getKuwaitDayKey();
  
  // Check if today is a class day for this classroom
  const todayPeriods = classSchedule?.[currentDayKey] || [];
  const isClassDay = todayPeriods.length > 0;
  
  if (!isClassDay) {
    return { period: 0, periodInfo: null, isClassDay: false };
  }
  
  // Get the schedule for this education level
  const schedule = getScheduleByEducationLevel(educationLevelName);
  const currentMinutes = kuwaitTime.getHours() * 60 + kuwaitTime.getMinutes();
  
  // Find the current period based on time
  for (const periodTime of schedule.periods) {
    if (periodTime.isBreak) continue;
    
    const startMinutes = parseTimeToMinutes(periodTime.startTime);
    const endMinutes = parseTimeToMinutes(periodTime.endTime);
    
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      // Check if this period is scheduled for today in this classroom
      if (todayPeriods.includes(periodTime.period)) {
        return { period: periodTime.period, periodInfo: periodTime, isClassDay: true };
      }
    }
  }
  
  // If no current period matches, find the next upcoming period for today
  let closestPeriod: PeriodTime | null = null;
  let closestDiff = Infinity;
  
  for (const periodTime of schedule.periods) {
    if (periodTime.isBreak) continue;
    if (!todayPeriods.includes(periodTime.period)) continue;
    
    const startMinutes = parseTimeToMinutes(periodTime.startTime);
    if (startMinutes > currentMinutes) {
      const diff = startMinutes - currentMinutes;
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPeriod = periodTime;
      }
    }
  }
  
  // Return the first scheduled period if before school or between periods
  if (closestPeriod) {
    return { period: closestPeriod.period, periodInfo: closestPeriod, isClassDay: true };
  }
  
  // If after all periods, return the last scheduled period
  const lastPeriodNum = Math.max(...todayPeriods);
  const lastPeriodInfo = schedule.periods.find(p => p.period === lastPeriodNum && !p.isBreak);
  
  return { 
    period: lastPeriodNum, 
    periodInfo: lastPeriodInfo || null, 
    isClassDay: true 
  };
}
