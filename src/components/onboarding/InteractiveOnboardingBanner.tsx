import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  GraduationCap, 
  Users, 
  BookOpen, 
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const stepIcons: { [key: string]: React.ReactNode } = {
  'welcome': <Sparkles className="w-5 h-5" />,
  'create-classroom': <GraduationCap className="w-5 h-5" />,
  'add-students': <Users className="w-5 h-5" />,
  'explore-grades': <BookOpen className="w-5 h-5" />,
  'complete': <CheckCircle2 className="w-5 h-5" />,
};

export function InteractiveOnboardingBanner() {
  const { 
    isOnboarding, 
    currentStep, 
    steps, 
    nextStep, 
    previousStep, 
    skipOnboarding,
    completeOnboarding,
    progress 
  } = useOnboarding();
  const navigate = useNavigate();

  if (!isOnboarding) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleAction = () => {
    if (step.route) {
      navigate(step.route);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-96",
        "bg-card border border-border rounded-2xl shadow-xl",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
      dir="rtl"
    >
      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>الخطوة {currentStep + 1} من {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            {stepIcons[step.id] || <Sparkles className="w-5 h-5" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {step.description}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={skipOnboarding}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            title="تخطي الجولة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              className="flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              السابق
            </Button>
          )}

          <div className="flex-1" />

          {step.action && !isLastStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="flex-shrink-0"
            >
              {step.action}
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleNext}
            className="flex-shrink-0"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-4 h-4 ml-1" />
                ابدأ الآن
              </>
            ) : (
              <>
                التالي
                <ChevronLeft className="w-4 h-4 mr-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-1.5 pb-3">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentStep 
                ? "w-4 bg-primary" 
                : index < currentStep 
                  ? "w-1.5 bg-primary/50" 
                  : "w-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
