import { cn } from '@/lib/utils';
import { Check, X, Clock, FileText } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceButtonProps {
  status: AttendanceStatus;
  isActive: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

const statusConfig = {
  present: {
    icon: Check,
    label: 'حاضر',
    activeClass: 'bg-success text-success-foreground border-success',
    inactiveClass: 'border-success/30 text-success hover:bg-success/10',
  },
  absent: {
    icon: X,
    label: 'غائب',
    activeClass: 'bg-destructive text-destructive-foreground border-destructive',
    inactiveClass: 'border-destructive/30 text-destructive hover:bg-destructive/10',
  },
  late: {
    icon: Clock,
    label: 'متأخر',
    activeClass: 'bg-warning text-warning-foreground border-warning',
    inactiveClass: 'border-warning/30 text-warning hover:bg-warning/10',
  },
  excused: {
    icon: FileText,
    label: 'بعذر',
    activeClass: 'bg-muted text-muted-foreground border-muted',
    inactiveClass: 'border-muted text-muted-foreground hover:bg-muted/50',
  },
};

export function AttendanceButton({ status, isActive, onClick, size = 'md' }: AttendanceButtonProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border-2 font-medium transition-all duration-200",
        size === 'sm' ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
        isActive ? config.activeClass : config.inactiveClass
      )}
    >
      <Icon className={size === 'sm' ? "w-3 h-3" : "w-4 h-4"} />
      <span>{config.label}</span>
    </button>
  );
}
