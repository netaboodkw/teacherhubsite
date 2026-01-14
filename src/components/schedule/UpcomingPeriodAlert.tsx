import { Bell, Clock, GraduationCap, VolumeX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UpcomingPeriod } from '@/hooks/usePeriodReminder';

interface UpcomingPeriodAlertProps {
  upcomingPeriod: UpcomingPeriod | null;
  isRepeating?: boolean;
  onStopRepeating?: () => void;
}

export function UpcomingPeriodAlert({ 
  upcomingPeriod, 
  isRepeating = false,
  onStopRepeating 
}: UpcomingPeriodAlertProps) {
  if (!upcomingPeriod && !isRepeating) return null;

  // عرض زر إيقاف التكرار فقط
  if (isRepeating && !upcomingPeriod) {
    return (
      <Alert className="animate-in slide-in-from-top-2 border-2 border-red-500 bg-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-600 animate-bounce" />
            <AlertTitle className="text-base mb-0 text-red-700 dark:text-red-400">
              🔔 التنبيه قيد التشغيل
            </AlertTitle>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onStopRepeating}
            className="gap-2"
          >
            <VolumeX className="w-4 h-4" />
            إيقاف التنبيه
          </Button>
        </div>
      </Alert>
    );
  }

  if (!upcomingPeriod) return null;

  const { period, classroom, minutesUntilStart, isStarting } = upcomingPeriod;

  return (
    <Alert
      className={cn(
        "animate-in slide-in-from-top-2 border-2",
        isRepeating
          ? "border-red-500 bg-red-500/10"
          : isStarting
            ? "border-green-500 bg-green-500/10"
            : "border-amber-500 bg-amber-500/10"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStarting ? (
            <Bell className={cn("h-5 w-5 text-green-600", isRepeating && "animate-bounce")} />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
          <AlertTitle className="text-base mb-0">
            {isStarting ? (
              <span className={isRepeating ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}>
                🔔 بدأت {period.nameAr}!
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400">
                ⏰ {period.nameAr} بعد {minutesUntilStart} دقيقة
              </span>
            )}
          </AlertTitle>
        </div>
        {isRepeating && onStopRepeating && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onStopRepeating}
            className="gap-2"
          >
            <VolumeX className="w-4 h-4" />
            إيقاف
          </Button>
        )}
      </div>
      <AlertDescription className="mt-2 mr-7">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {period.startTime} - {period.endTime}
          </Badge>
          {classroom && (
            <Badge variant="secondary" className="gap-1">
              <GraduationCap className="w-3 h-3" />
              {classroom.name}
            </Badge>
          )}
          {isRepeating && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              🔊 التنبيه مستمر
            </Badge>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
