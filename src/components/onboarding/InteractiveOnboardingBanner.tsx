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
  GraduationCap,
  BarChart3,
  ClipboardCheck,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const stepIcons: { [key: string]: React.ReactNode } = {
  'create-classroom': <GraduationCap className="w-4 h-4" />,
  'add-students': <Users className="w-4 h-4" />,
  'grade-templates': <FileSpreadsheet className="w-4 h-4" />,
  'grades': <BarChart3 className="w-4 h-4" />,
  'dashboard': <Home className="w-4 h-4" />,
  'attendance': <ClipboardCheck className="w-4 h-4" />,
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
  const location = useLocation();

  if (!isOnboarding) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Check if we're on the current step's page
  const isOnCurrentStepPage = location.pathname === step.route || 
    (step.route === '/teacher' && location.pathname === '/teacher');

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
        "fixed top-0 left-0 right-0 z-50",
        "bg-primary text-primary-foreground",
        "shadow-lg",
        "safe-area-inset-top"
      )}
      dir="rtl"
    >
      {/* Progress bar */}
      <div className="h-1 bg-primary-foreground/20">
        <div 
          className="h-full bg-primary-foreground/60 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content - compact horizontal layout */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Step indicator with icon */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="p-1.5 rounded-md bg-primary-foreground/20">
              {stepIcons[step.id] || <GraduationCap className="w-4 h-4" />}
            </div>
            <span className="text-xs font-medium opacity-80">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          {/* Text - compact */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {step.title}
            </p>
          </div>

          {/* Actions - horizontal */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="icon"
                onClick={previousStep}
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {!isOnCurrentStepPage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAction}
                className="h-7 px-2 text-xs"
              >
                {step.action}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-7 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                  إنهاء
                </>
              ) : (
                <>
                  التالي
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                </>
              )}
            </Button>

            {/* Close button */}
            <button
              onClick={skipOnboarding}
              className="p-1 rounded hover:bg-primary-foreground/20 transition-colors opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step dots - smaller */}
        <div className="flex justify-center gap-1 mt-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all",
                index === currentStep 
                  ? "w-3 bg-primary-foreground" 
                  : index < currentStep 
                    ? "w-1 bg-primary-foreground/50" 
                    : "w-1 bg-primary-foreground/20"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
