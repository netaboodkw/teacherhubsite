import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Users, 
  Layout,
  FileSpreadsheet,
  CheckCircle2,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const stepIcons: { [key: string]: React.ReactNode } = {
  'add-students': <Users className="w-5 h-5" />,
  'classroom-view': <Layout className="w-5 h-5" />,
  'grade-templates': <FileSpreadsheet className="w-5 h-5" />,
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
        "fixed bottom-20 left-3 right-3 z-50",
        "md:left-auto md:right-6 md:bottom-6 md:max-w-sm",
        "bg-card border border-border rounded-xl shadow-lg",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
      dir="rtl"
    >
      {/* Simple progress dots */}
      <div className="flex justify-center gap-2 pt-3">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              index === currentStep 
                ? "bg-primary scale-110" 
                : index < currentStep 
                  ? "bg-primary/40" 
                  : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            {stepIcons[step.id] || <Users className="w-5 h-5" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {step.description}
            </p>
            
            {/* Computer tip for templates */}
            {step.id === 'grade-templates' && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                <Monitor className="w-3.5 h-3.5" />
                <span>يُفضل استخدام الكمبيوتر</span>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={skipOnboarding}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions - simplified */}
        <div className="flex items-center gap-2 mt-3">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              className="h-8 px-2 text-xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAction}
            className="h-8 px-3 text-xs flex-1"
          >
            {step.action}
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="h-8 px-3 text-xs"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                تم
              </>
            ) : (
              <>
                التالي
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
