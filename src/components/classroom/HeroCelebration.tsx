import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, Crown, Trophy, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
  points?: number;
}

interface HeroCelebrationProps {
  student: Student | null;
  type: 'daily' | 'weekly';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HeroCelebration({ student, type, open, onOpenChange }: HeroCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      setTimeout(() => setShowContent(true), 200);
    } else {
      setShowConfetti(false);
      setShowContent(false);
    }
  }, [open]);

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        dir="rtl" 
        className={cn(
          "max-w-sm sm:max-w-md border-0 bg-gradient-to-br overflow-hidden",
          type === 'weekly' 
            ? "from-yellow-500/20 via-amber-500/10 to-orange-500/20" 
            : "from-blue-500/20 via-cyan-500/10 to-teal-500/20"
        )}
      >
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-3 h-3 rounded-full animate-bounce",
                  i % 5 === 0 && "bg-yellow-400",
                  i % 5 === 1 && "bg-pink-400",
                  i % 5 === 2 && "bg-blue-400",
                  i % 5 === 3 && "bg-green-400",
                  i % 5 === 4 && "bg-purple-400",
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                  transform: `scale(${0.5 + Math.random() * 0.5})`,
                }}
              />
            ))}
            {/* Sparkles */}
            {[...Array(20)].map((_, i) => (
              <Sparkles
                key={`sparkle-${i}`}
                className={cn(
                  "absolute h-4 w-4 animate-pulse",
                  type === 'weekly' ? "text-yellow-400" : "text-blue-400"
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className={cn(
          "flex flex-col items-center py-8 relative z-10 transition-all duration-500",
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}>
          {/* Crown Icon */}
          <div className={cn(
            "absolute -top-2 animate-bounce",
            type === 'weekly' ? "text-yellow-500" : "text-blue-500"
          )}>
            <Crown className="h-12 w-12 drop-shadow-lg" />
          </div>

          {/* Student Avatar */}
          <div className={cn(
            "relative w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center overflow-hidden",
            "ring-4 ring-offset-4 ring-offset-background shadow-2xl",
            type === 'weekly' 
              ? "ring-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/50" 
              : "ring-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50",
            "animate-scale-in"
          )}>
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={cn(
                "h-24 w-24",
                type === 'weekly' ? "text-yellow-600" : "text-blue-600"
              )} />
            )}
          </div>

          {/* Trophy Badge */}
          <div className={cn(
            "absolute top-32 sm:top-36 -right-2 p-3 rounded-full shadow-lg animate-bounce",
            type === 'weekly' 
              ? "bg-gradient-to-br from-yellow-400 to-amber-500" 
              : "bg-gradient-to-br from-blue-400 to-cyan-500"
          )} style={{ animationDelay: '0.3s' }}>
            <Trophy className="h-6 w-6 text-white" />
          </div>

          {/* Star Badge */}
          <div className={cn(
            "absolute top-32 sm:top-36 -left-2 p-3 rounded-full shadow-lg animate-bounce",
            type === 'weekly' 
              ? "bg-gradient-to-br from-orange-400 to-red-500" 
              : "bg-gradient-to-br from-teal-400 to-green-500"
          )} style={{ animationDelay: '0.5s' }}>
            <Star className="h-6 w-6 text-white fill-white" />
          </div>

          {/* Title */}
          <h2 className={cn(
            "mt-8 text-2xl sm:text-3xl font-bold text-center",
            type === 'weekly' ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {type === 'weekly' ? '🏆 بطل الأسبوع 🏆' : '⭐ بطل اليوم ⭐'}
          </h2>

          {/* Student Name */}
          <h3 className="mt-4 text-xl sm:text-2xl font-bold text-foreground text-center px-4">
            {student.name}
          </h3>

          {/* Points */}
          {student.points !== undefined && student.points > 0 && (
            <div className={cn(
              "mt-4 px-6 py-2 rounded-full font-bold text-lg",
              type === 'weekly' 
                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" 
                : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
            )}>
              +{student.points} نقطة
            </div>
          )}

          {/* Congratulations Message */}
          <p className="mt-4 text-muted-foreground text-center text-base sm:text-lg">
            {type === 'weekly' 
              ? 'مبروك! أنت الأفضل هذا الأسبوع 🎉' 
              : 'أحسنت! أداء متميز اليوم 🌟'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
