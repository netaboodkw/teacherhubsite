import { useState, useEffect } from 'react';
import { GraduationCap, ChevronLeft, Sparkles, Users, ClipboardCheck, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import defaultLogo from '@/assets/logo.png';

interface IOSSplashScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    title: 'مرحباً بك في Teacher Hub',
    description: 'مساعدك الذكي لإدارة الصفوف والطلاب',
    icon: GraduationCap,
    color: 'from-sky-400 to-violet-400',
    isLogo: true,
  },
  {
    title: 'إدارة سهلة وسريعة',
    description: 'أضف صفوفك وطلابك بسهولة، واستورد البيانات من Excel أو بالكاميرا',
    icon: Users,
    color: 'from-emerald-400 to-teal-400',
  },
  {
    title: 'حضور بضغطة واحدة',
    description: 'سجل الحضور والغياب في ثوانٍ مع تذكيرات ذكية',
    icon: ClipboardCheck,
    color: 'from-violet-400 to-pink-400',
  },
  {
    title: 'درجات ذكية',
    description: 'قوالب جاهزة وحساب تلقائي للمعدلات مع طباعة الكشوفات',
    icon: BarChart3,
    color: 'from-pink-400 to-yellow-400',
  },
  {
    title: 'بياناتك آمنة',
    description: 'حفظ تلقائي على السحابة مع أعلى معايير الأمان',
    icon: Shield,
    color: 'from-teal-400 to-sky-400',
  },
];

export function IOSSplashScreen({ onComplete }: IOSSplashScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;

  const handleNext = () => {
    if (isAnimating) return;
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (currentSlide < slides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
    onComplete();
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col" dir="rtl">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-5 transition-all duration-500`} />
      
      {/* Skip Button */}
      {!isLastSlide && (
        <button
          onClick={handleSkip}
          className="absolute top-12 left-6 text-muted-foreground text-sm font-medium z-10 ios-pressable"
        >
          تخطي
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Icon/Logo */}
        <div 
          className={`mb-8 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
        >
          {slide.isLogo ? (
            <div className="w-32 h-32 rounded-[22%] bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.2),0_4px_10px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.7)] border border-white/30 overflow-hidden">
              <div className="w-full h-full rounded-[18%] overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                <img 
                  src={displayLogo} 
                  alt="Teacher Hub" 
                  className="w-[85%] h-[85%] object-contain"
                  onError={(e) => { e.currentTarget.src = defaultLogo; }}
                />
              </div>
            </div>
          ) : (
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-xl`}>
              <slide.icon className="w-14 h-14 text-white" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div 
          className={`text-center max-w-sm transition-all duration-500 ${isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
        >
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {slide.title}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-8 pb-12 safe-area-inset-bottom">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : index < currentSlide 
                    ? 'w-2 bg-primary/50' 
                    : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleNext}
          size="lg"
          className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg bg-gradient-to-r ${slide.color} text-white border-0 hover:opacity-90 transition-all duration-300 ios-pressable`}
        >
          {isLastSlide ? (
            <>
              <Sparkles className="ml-2 h-5 w-5" />
              ابدأ الآن
            </>
          ) : (
            <>
              التالي
              <ChevronLeft className="mr-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
