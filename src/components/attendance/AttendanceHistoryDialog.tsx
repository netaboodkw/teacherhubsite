import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, XCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  period: number;
}

interface AttendanceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  attendanceRecords: AttendanceRecord[];
  type: 'absent' | 'late';
}

export function AttendanceHistoryDialog({
  open,
  onOpenChange,
  studentName,
  attendanceRecords,
  type,
}: AttendanceHistoryDialogProps) {
  const filteredRecords = useMemo(() => {
    return attendanceRecords
      .filter(r => r.status === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, type]);

  const Icon = type === 'absent' ? XCircle : Clock;
  const colorClass = type === 'absent' ? 'text-destructive' : 'text-warning';
  const bgClass = type === 'absent' ? 'bg-destructive/10 border-destructive/20' : 'bg-warning/10 border-warning/20';
  const title = type === 'absent' ? 'تواريخ الغياب' : 'تواريخ التأخير';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${colorClass}`}>
            <Icon className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <User className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{studentName}</p>
            <p className="text-sm text-muted-foreground">
              {filteredRecords.length} {type === 'absent' ? 'يوم غياب' : 'يوم تأخير'}
            </p>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا يوجد سجل {type === 'absent' ? 'غياب' : 'تأخير'}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {filteredRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'absent' ? 'bg-destructive/20' : 'bg-warning/20'}`}>
                      <span className={`text-sm font-bold ${colorClass}`}>{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(record.date), 'EEEE', { locale: ar })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), 'dd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    الحصة {record.period}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
