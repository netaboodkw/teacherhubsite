import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronLeft, Sparkles, Users, ClipboardCheck, BarChart3, Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import defaultLogo from '@/assets/logo.png';

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
    title: 'متابعة رئيس القسم',
    description: 'دعوة رئيس القسم للاطلاع على بيانات الصفوف والطلاب',
    icon: UserPlus,
    color: 'from-teal-400 to-emerald-400',
  },
  {
    title: 'بياناتك آمنة',
    description: 'حفظ تلقائي على السحابة مع أعلى معايير الأمان',
    icon: Shield,
    color: 'from-sky-400 to-violet-400',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;

  const minSwipeDistance = 50;

  const handleComplete = () => {
    localStorage.setItem('teacherhub_welcome_seen', 'true');
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    navigate('/', { replace: true });
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    if (index < 0 || index >= slides.length) return;
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
    handleComplete();
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Swipe left = next (RTL: swipe left goes forward)
      handlePrev();
    } else if (isRightSwipe) {
      // Swipe right = prev (RTL: swipe right goes back)
      handleNext();
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-background flex flex-col select-none" 
      dir="rtl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-10 transition-all duration-500`} />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${slide.color} opacity-20 rounded-full blur-3xl transition-all duration-700`}
          style={{ transform: `scale(${1 + currentSlide * 0.1})` }}
        />
        <div 
          className={`absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br ${slide.color} opacity-15 rounded-full blur-3xl transition-all duration-700`}
          style={{ transform: `scale(${1 + currentSlide * 0.1})` }}
        />
      </div>
      
      {/* Skip Button */}
      {!isLastSlide && (
        <button
          onClick={handleSkip}
          className="absolute top-14 left-6 text-muted-foreground text-sm font-medium z-10 ios-pressable px-3 py-2 rounded-full bg-muted/30 backdrop-blur-sm"
        >
          تخطي
        </button>
      )}

      {/* Slide Counter */}
      <div className="absolute top-14 right-6 text-muted-foreground text-sm font-medium z-10">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Icon/Logo */}
        <div 
          className={`mb-10 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
        >
          {slide.isLogo ? (
            <div className="w-36 h-36 rounded-[22%] bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.2),0_4px_10px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.7)] border border-white/30 overflow-hidden animate-pulse-slow">
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
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-2xl`}>
              <slide.icon className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div 
          className={`text-center max-w-sm transition-all duration-500 ${isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
        >
          <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
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
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ios-pressable ${
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : index < currentSlide 
                    ? 'w-2 bg-primary/50' 
                    : 'w-2 bg-muted-foreground/30'
              }`}
              aria-label={`انتقل للشريحة ${index + 1}`}
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

        {/* Login Link */}
        <button
          onClick={() => navigate('/auth/teacher?tab=login')}
          className="w-full mt-4 text-center text-muted-foreground text-sm ios-pressable py-2"
        >
          لديك حساب؟ <span className="text-primary font-medium">سجل دخول</span>
        </button>
      </div>
    </div>
  );
}
