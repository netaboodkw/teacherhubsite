import { useState, useEffect, useMemo } from 'react';
import { Fingerprint, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { useTodayFingerprintRecord } from '@/hooks/useFingerprintRecords';

// Keys for localStorage
const BANNER_HIDDEN_TODAY_KEY = 'teacherhub_welcome_banner_hidden_date';
const BANNER_DISABLED_KEY = 'teacherhub_welcome_banner_disabled';

// أوقات الحضور الشائعة
const commonTimes = ['06:30', '07:00', '07:30', '08:00'];

// Check if banner was manually hidden today
export const wasBannerHiddenToday = (): boolean => {
  const hiddenDate = localStorage.getItem(BANNER_HIDDEN_TODAY_KEY);
  const today = new Date().toDateString();
  return hiddenDate === today;
};

// Hide banner for today only
export const hideBannerForToday = () => {
  localStorage.setItem(BANNER_HIDDEN_TODAY_KEY, new Date().toDateString());
};

// Check if banner is permanently disabled
export const isBannerDisabled = (): boolean => {
  return localStorage.getItem(BANNER_DISABLED_KEY) === 'true';
};

// Enable/disable banner permanently
export const setBannerDisabled = (disabled: boolean) => {
  if (disabled) {
    localStorage.setItem(BANNER_DISABLED_KEY, 'true');
  } else {
    localStorage.removeItem(BANNER_DISABLED_KEY);
  }
};

interface WelcomeAttendanceBannerProps {
  onTimeSet: (time: string) => void;
  className?: string;
}

export function WelcomeAttendanceBanner({ onTimeSet, className }: WelcomeAttendanceBannerProps) {
  const { profile } = useProfile();
  const { data: todayRecord, isLoading: recordLoading } = useTodayFingerprintRecord();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [customTime, setCustomTime] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  
  const currentTime = new Date();
  const firstName = profile?.full_name?.split(' ')[0] || '';

  // Check visibility conditions
  useEffect(() => {
    // If permanently disabled
    if (isBannerDisabled()) {
      setIsVisible(false);
      return;
    }
    
    // If hidden for today
    if (wasBannerHiddenToday()) {
      setIsVisible(false);
      return;
    }
    
    // If attendance already recorded today
    if (todayRecord) {
      setIsVisible(false);
      return;
    }
    
    setIsVisible(true);
  }, [todayRecord]);

  // Don't render if not visible or still loading
  if (!isVisible || recordLoading) {
    return null;
  }

  const handleConfirm = () => {
    const timeToUse = customTime || selectedTime;
    onTimeSet(timeToUse);
    setIsVisible(false);
  };

  const handleHideForToday = () => {
    hideBannerForToday();
    setIsVisible(false);
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
        "rounded-2xl overflow-hidden transition-all duration-300",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-background",
        "border border-primary/20 shadow-lg",
        className
      )}
    >
      {/* Compact Header - Always Visible */}
      <div className="flex items-center gap-3 p-4">
        {/* Icon + Login Button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Fingerprint className="w-6 h-6 text-primary" />
        </Button>
        
        {/* Welcome Text + Teacher Name */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="font-bold text-foreground flex items-center gap-2">
            صباح الخير{firstName ? ` ${firstName}` : ''}! 👋
          </h3>
          <p className="text-sm text-muted-foreground">
            {isExpanded ? 'اضبط وقت حضورك' : 'اضغط لضبط وقت الحضور'}
          </p>
        </div>

        {/* Current Time + Expand/Collapse */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-mono bg-background/80 px-2 py-1 rounded-lg">
            {format(currentTime, 'HH:mm')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Hide Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
          onClick={handleHideForToday}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4 animate-in slide-in-from-top-2 duration-200">
          {/* Quick Time Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">متى حضرت اليوم؟</p>
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
            <Button onClick={handleConfirm} className="flex-1 h-12 text-base gap-2">
              <Fingerprint className="w-5 h-5" />
              تأكيد الوقت
            </Button>
            <Button 
              variant="outline" 
              onClick={handleHideForToday} 
              className="h-12 px-4"
            >
              لاحقاً
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
