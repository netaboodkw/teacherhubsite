import { Bell, Clock, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UpcomingPeriod } from '@/hooks/usePeriodReminder';

interface UpcomingPeriodAlertProps {
  upcomingPeriod: UpcomingPeriod | null;
}

export function UpcomingPeriodAlert({ upcomingPeriod }: UpcomingPeriodAlertProps) {
  if (!upcomingPeriod) return null;

  const { period, classroom, minutesUntilStart, isStarting } = upcomingPeriod;

  return (
    <Alert
      className={cn(
        "animate-in slide-in-from-top-2 border-2",
        isStarting
          ? "border-green-500 bg-green-500/10"
          : "border-amber-500 bg-amber-500/10"
      )}
    >
      <div className="flex items-center gap-2">
        {isStarting ? (
          <Bell className="h-5 w-5 text-green-600 animate-bounce" />
        ) : (
          <Clock className="h-5 w-5 text-amber-600" />
        )}
        <AlertTitle className="text-base mb-0">
          {isStarting ? (
            <span className="text-green-700 dark:text-green-400">
              🔔 بدأت {period.nameAr}!
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400">
              ⏰ {period.nameAr} بعد {minutesUntilStart} دقيقة
            </span>
          )}
        </AlertTitle>
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
        </div>
      </AlertDescription>
    </Alert>
  );
}
