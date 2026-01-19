import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Fingerprint } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTimeSet: (time: string) => void;
  currentTime: Date;
}

// أوقات الحضور الشائعة
const commonTimes = ['06:30', '07:00', '07:30', '08:00'];

export const AttendanceTimeDialog = ({
  open,
  onOpenChange,
  onTimeSet,
  currentTime,
}: AttendanceTimeDialogProps) => {
  const [selectedTime, setSelectedTime] = useState('07:00');

  // تعيين الوقت الافتراضي بناءً على الوقت الحالي
  useEffect(() => {
    if (open) {
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      // تقريب للأقرب نصف ساعة
      const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
      const roundedHours = minutes >= 45 ? hours + 1 : hours;
      
      // إذا كان الوقت الحالي بين 6-8 صباحاً، اقترح الوقت الحالي
      if (hours >= 6 && hours <= 8) {
        setSelectedTime(`${roundedHours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`);
      }
    }
  }, [open, currentTime]);

  const handleConfirm = () => {
    onTimeSet(selectedTime);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Fingerprint className="w-6 h-6 text-primary" />
            صباح الخير! 👋
          </DialogTitle>
          <DialogDescription className="text-base">
            متى حضرت اليوم لتفعيل تذكير بصمة التواجد؟
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* الوقت الحالي */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">التوقيت الحالي</p>
            <p className="text-2xl font-mono font-bold">
              {format(currentTime, 'HH:mm')}
            </p>
          </div>

          {/* أزرار الأوقات الشائعة */}
          <div className="space-y-2">
            <Label>اختر وقت الحضور:</Label>
            <div className="grid grid-cols-4 gap-2">
              {commonTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="font-mono"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* إدخال وقت مخصص */}
          <div className="space-y-2">
            <Label htmlFor="customTime" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              أو أدخل وقتاً مخصصاً:
            </Label>
            <Input
              id="customTime"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="max-w-[150px] font-mono text-lg"
            />
          </div>

          {/* معاينة فترة البصمة */}
          {selectedTime && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">فترة بصمة التواجد ستكون:</p>
              <div className="flex items-center justify-center gap-3 text-lg font-bold">
                <span>{calculateWindowStart(selectedTime)}</span>
                <span className="text-muted-foreground">←</span>
                <span>{calculateWindowEnd(selectedTime)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleConfirm} className="flex-1">
            تأكيد الوقت
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            لاحقاً
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// حساب بداية فترة البصمة
function calculateWindowStart(attendanceTime: string): string {
  const [hours, minutes] = attendanceTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 121; // +2 ساعات + 1 دقيقة
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// حساب نهاية فترة البصمة
function calculateWindowEnd(attendanceTime: string): string {
  const [hours, minutes] = attendanceTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 180; // +3 ساعات
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}
