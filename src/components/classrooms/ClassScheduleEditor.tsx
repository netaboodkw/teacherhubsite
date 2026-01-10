import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export interface ClassSchedule {
  [day: string]: number[];
}

interface ClassScheduleEditorProps {
  value: ClassSchedule;
  onChange: (schedule: ClassSchedule) => void;
}

const DAYS = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الإثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export function ClassScheduleEditor({ value, onChange }: ClassScheduleEditorProps) {
  const togglePeriod = (day: string, period: number) => {
    const currentPeriods = value[day] || [];
    const newPeriods = currentPeriods.includes(period)
      ? currentPeriods.filter(p => p !== period)
      : [...currentPeriods, period].sort((a, b) => a - b);
    
    onChange({
      ...value,
      [day]: newPeriods,
    });
  };

  const isPeriodSelected = (day: string, period: number) => {
    return (value[day] || []).includes(period);
  };

  return (
    <div className="space-y-4">
      <Label>جدول الحصص الأسبوعي</Label>
      <p className="text-sm text-muted-foreground">حدد الأيام والحصص التي يُدرَّس فيها هذا الصف</p>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 bg-muted/50 border-b">
          <div className="p-2 text-center text-sm font-medium border-l">اليوم</div>
          {PERIODS.map(period => (
            <div key={period} className="p-2 text-center text-sm font-medium border-l last:border-l-0">
              ح{period}
            </div>
          ))}
        </div>
        
        {/* Days */}
        {DAYS.map(day => (
          <div key={day.key} className="grid grid-cols-8 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
            <div className="p-2 text-sm font-medium border-l flex items-center justify-center">
              {day.label}
            </div>
            {PERIODS.map(period => (
              <div 
                key={period} 
                className="p-2 flex items-center justify-center border-l last:border-l-0"
              >
                <Checkbox
                  checked={isPeriodSelected(day.key, period)}
                  onCheckedChange={() => togglePeriod(day.key, period)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => {
          const periods = value[day.key] || [];
          if (periods.length === 0) return null;
          return (
            <Badge key={day.key} variant="secondary" className="text-xs">
              {day.label}: {periods.map(p => `ح${p}`).join('، ')}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export function getCurrentDayPeriods(schedule: ClassSchedule): number[] {
  const dayMap: { [key: number]: string } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  
  const today = new Date().getDay();
  const todayKey = dayMap[today];
  
  return schedule[todayKey] || [];
}

export function getDayName(dayKey: string): string {
  const dayNames: { [key: string]: string } = {
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  };
  return dayNames[dayKey] || dayKey;
}
