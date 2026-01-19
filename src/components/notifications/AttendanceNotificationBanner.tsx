import { useState, useEffect } from 'react';
import { X, Clock, Fingerprint, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AttendanceNotificationBannerProps {
  onTimeSet: (time: string) => void;
  onDismiss: () => void;
}

// أوقات الحضور الشائعة
const commonTimes = ['06:30', '07:00', '07:30', '08:00'];

// Key for storing attendance dialog preference
const ATTENDANCE_PREF_KEY = 'teacherhub_attendance_pref';
const ATTENDANCE_SHOWN_TODAY_KEY = 'teacherhub_attendance_shown_today';

export const getAttendancePref = (): 'daily' | 'never' => {
  const saved = localStorage.getItem(ATTENDANCE_PREF_KEY);
  return (saved as 'daily' | 'never') || 'daily';
};

export const setAttendancePref = (pref: 'daily' | 'never') => {
  localStorage.setItem(ATTENDANCE_PREF_KEY, pref);
};

export const wasShownToday = (): boolean => {
  const saved = localStorage.getItem(ATTENDANCE_SHOWN_TODAY_KEY);
  const today = new Date().toDateString();
  return saved === today;
};

export const markShownToday = () => {
  localStorage.setItem(ATTENDANCE_SHOWN_TODAY_KEY, new Date().toDateString());
};

export function AttendanceNotificationBanner({ onTimeSet, onDismiss }: AttendanceNotificationBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [customTime, setCustomTime] = useState('');
  const currentTime = new Date();

  const handleConfirm = () => {
    const timeToUse = customTime || selectedTime;
    onTimeSet(timeToUse);
    markShownToday();
  };

  const handleDismiss = () => {
    setAttendancePref('never');
    markShownToday();
    onDismiss();
  };

  const handleLater = () => {
    markShownToday();
    onDismiss();
  };

  // حساب بداية فترة البصمة
  const calculateWindowStart = (attendanceTime: string): string => {
    const [hours, minutes] = attendanceTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 121;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  // حساب نهاية فترة البصمة
  const calculateWindowEnd = (attendanceTime: string): string => {
    const [hours, minutes] = attendanceTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 180;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const activeTime = customTime || selectedTime;

  return (
    <div 
      className={cn(
        "mx-4 mb-4 rounded-2xl overflow-hidden transition-all duration-300",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-background",
        "border border-primary/20 shadow-lg"
      )}
    >
      {/* Compact View */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Fingerprint className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">صباح الخير! 👋</h3>
          <p className="text-sm text-muted-foreground truncate">
            اضغط لضبط وقت حضورك اليوم
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-mono bg-background/80 px-2 py-1 rounded-lg">
            {format(currentTime, 'HH:mm')}
          </span>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
          {/* Quick Time Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">متى حضرت؟</p>
            <div className="grid grid-cols-4 gap-2">
              {commonTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time && !customTime ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => {
                    setSelectedTime(time);
                    setCustomTime('');
                  }}
                  className="font-mono text-base h-12"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Time */}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="وقت مخصص"
              className="flex-1 h-12 font-mono text-lg"
            />
          </div>

          {/* Preview Window */}
          <div className="p-3 bg-primary/10 rounded-xl">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              فترة بصمة التواجد:
            </p>
            <div className="flex items-center justify-center gap-3 text-lg font-bold text-primary">
              <span>{calculateWindowStart(activeTime)}</span>
              <span className="text-muted-foreground">←</span>
              <span>{calculateWindowEnd(activeTime)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleConfirm} className="flex-1 h-12 text-base">
              تأكيد الوقت
            </Button>
            <Button variant="outline" onClick={handleLater} className="h-12 px-4">
              لاحقاً
            </Button>
          </div>

          {/* Dismiss Option */}
          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full text-muted-foreground text-sm"
          >
            <X className="w-4 h-4 ml-2" />
            عدم إظهار هذا الإشعار مجدداً
          </Button>
        </div>
      )}
    </div>
  );
}
