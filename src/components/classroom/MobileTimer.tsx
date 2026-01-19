import { useState, useEffect, useRef } from 'react';
import { MobileSheet, MobileSheetFooter } from '@/components/ui/mobile-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTimerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_TIMES = [
  { label: '30 ث', seconds: 30 },
  { label: '1 د', seconds: 60 },
  { label: '2 د', seconds: 120 },
  { label: '5 د', seconds: 300 },
  { label: '10 د', seconds: 600 },
  { label: '15 د', seconds: 900 },
];

export function MobileTimer({ open, onOpenChange }: MobileTimerProps) {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  };

  const initAudioContext = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (e) {
      console.log('Audio context init:', e);
    }
  };

  const playAlarmSound = async () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const playBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.5) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      
      for (let i = 0; i < 3; i++) {
        playBeep(880, now + i * 0.2, 0.15, 0.6);
      }
      
      for (let i = 0; i < 3; i++) {
        playBeep(1100, now + 0.8 + i * 0.2, 0.15, 0.6);
      }
      
      playBeep(1320, now + 1.6, 0.8, 0.7);
      
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  useEffect(() => {
    if (isFinished && soundEnabled) {
      playAlarmSound();
    }
  }, [isFinished, soundEnabled]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
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
  }, [isRunning]);

  const handleSelectTime = (seconds: number) => {
    initAudioContext();
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleCustomTime = () => {
    initAudioContext();
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
    initAudioContext();
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
    <MobileSheet 
      open={open} 
      onOpenChange={handleClose}
      title="المؤقت"
    >
      <div className="flex flex-col items-center py-4 space-y-6">
        {/* Timer Display */}
        {selectedTime !== null && (
          <div className="relative w-56 h-56">
            {/* Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - getProgress() / 100)}
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
                "text-5xl font-bold font-mono",
                isFinished && "text-red-500 animate-pulse"
              )}>
                {formatTime(timeLeft)}
              </span>
              {isFinished && (
                <span className="text-red-500 text-lg font-medium mt-2">انتهى الوقت!</span>
              )}
            </div>
          </div>
        )}

        {/* Preset Time Buttons */}
        {selectedTime === null && (
          <div className="space-y-4 w-full">
            <Label className="text-center block text-muted-foreground text-lg">اختر المدة</Label>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_TIMES.map((preset) => (
                <Button
                  key={preset.seconds}
                  variant="outline"
                  className="h-16 text-lg font-bold"
                  onClick={() => handleSelectTime(preset.seconds)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Time */}
            <div className="space-y-3 pt-4">
              <Label className="text-center block text-muted-foreground">أو تخصيص</Label>
              <div className="flex items-center gap-3 justify-center">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    className="w-20 text-center text-xl h-14"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(e.target.value)}
                  />
                  <span className="text-muted-foreground">ث</span>
                </div>
                <span className="text-2xl font-bold">:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="00"
                    className="w-20 text-center text-xl h-14"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                  />
                  <span className="text-muted-foreground">د</span>
                </div>
              </div>
              <Button 
                className="w-full h-14 text-lg" 
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
          <MobileSheetFooter className="w-full">
            <div className="flex items-center gap-3 justify-center">
              <Button
                size="lg"
                variant={isRunning ? "outline" : "default"}
                className="gap-2 flex-1 h-14 text-lg"
                onClick={toggleTimer}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-6 w-6" />
                    إيقاف
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6" />
                    {timeLeft === 0 ? 'إعادة' : 'تشغيل'}
                  </>
                )}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
                className="h-14 w-14"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-14 w-14"
              >
                {soundEnabled ? (
                  <Volume2 className="h-6 w-6" />
                ) : (
                  <VolumeX className="h-6 w-6 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Back to Selection */}
            {!isRunning && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground mt-4"
                onClick={() => {
                  setSelectedTime(null);
                  setTimeLeft(0);
                  setIsFinished(false);
                }}
              >
                اختيار وقت آخر
              </Button>
            )}
          </MobileSheetFooter>
        )}
      </div>
    </MobileSheet>
  );
}
