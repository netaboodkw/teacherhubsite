import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassroomTimerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_TIMES = [
  { label: 'نصف دقيقة', seconds: 30 },
  { label: 'دقيقة', seconds: 60 },
  { label: 'دقيقتين', seconds: 120 },
  { label: '5 دقائق', seconds: 300 },
  { label: '10 دقائق', seconds: 600 },
];

export function ClassroomTimer({ open, onOpenChange }: ClassroomTimerProps) {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create audio context for alarm sound
  const playAlarmSound = async () => {
    if (!soundEnabled) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Resume audio context if suspended (required by browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const playBeep = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a series of beeps
      const now = audioContext.currentTime;
      for (let i = 0; i < 5; i++) {
        playBeep(880, now + i * 0.25, 0.15);
        playBeep(1100, now + i * 0.25 + 0.08, 0.12);
      }
      
      // Final longer beep after a short pause
      setTimeout(async () => {
        try {
          const finalContext = new AudioContextClass();
          if (finalContext.state === 'suspended') {
            await finalContext.resume();
          }
          
          const oscillator = finalContext.createOscillator();
          const gainNode = finalContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(finalContext.destination);
          
          oscillator.frequency.value = 1200;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.7, finalContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, finalContext.currentTime + 1);
          
          oscillator.start();
          oscillator.stop(finalContext.currentTime + 1);
        } catch (e) {
          console.error('Final beep error:', e);
        }
      }, 1500);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, soundEnabled]);

  const handleSelectTime = (seconds: number) => {
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleCustomTime = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const totalSeconds = mins * 60 + secs;
    
    if (totalSeconds > 0) {
      setSelectedTime(totalSeconds);
      setTimeLeft(totalSeconds);
      setIsRunning(false);
      setIsFinished(false);
    }
  };

  const toggleTimer = () => {
    if (timeLeft === 0 && selectedTime) {
      setTimeLeft(selectedTime);
      setIsFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    if (selectedTime) {
      setTimeLeft(selectedTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedTime || selectedTime === 0) return 0;
    return ((selectedTime - timeLeft) / selectedTime) * 100;
  };

  const handleClose = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setSelectedTime(null);
      setTimeLeft(0);
      setIsRunning(false);
      setIsFinished(false);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Timer className="h-5 w-5" />
            المؤقت
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-6">
          {/* Timer Display */}
          {selectedTime !== null && (
            <div className="relative w-48 h-48">
              {/* Progress Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - getProgress() / 100)}
                  className={cn(
                    "transition-all duration-1000",
                    isFinished ? "text-red-500" : "text-primary"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "text-4xl font-bold font-mono",
                  isFinished && "text-red-500 animate-pulse"
                )}>
                  {formatTime(timeLeft)}
                </span>
                {isFinished && (
                  <span className="text-red-500 text-sm font-medium mt-1">انتهى الوقت!</span>
                )}
              </div>
            </div>
          )}

          {/* Preset Time Buttons */}
          {selectedTime === null && (
            <div className="space-y-4 w-full">
              <Label className="text-center block text-muted-foreground">اختر المدة</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_TIMES.map((preset) => (
                  <Button
                    key={preset.seconds}
                    variant="outline"
                    className="h-12"
                    onClick={() => handleSelectTime(preset.seconds)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom Time */}
              <div className="space-y-2 pt-2">
                <Label className="text-center block text-muted-foreground">أو تخصيص</Label>
                <div className="flex items-center gap-2 justify-center">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="00"
                      className="w-16 text-center"
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">ثانية</span>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="00"
                      className="w-16 text-center"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">دقيقة</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={handleCustomTime}
                  disabled={!customMinutes && !customSeconds}
                >
                  بدء المؤقت
                </Button>
              </div>
            </div>
          )}

          {/* Timer Controls */}
          {selectedTime !== null && (
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                variant={isRunning ? "outline" : "default"}
                className="gap-2 min-w-[120px]"
                onClick={toggleTimer}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-5 w-5" />
                    إيقاف
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    {timeLeft === 0 ? 'إعادة' : 'تشغيل'}
                  </>
                )}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
          )}

          {/* Back to Selection */}
          {selectedTime !== null && !isRunning && (
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setSelectedTime(null);
                setTimeLeft(0);
                setIsFinished(false);
              }}
            >
              اختيار وقت آخر
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
