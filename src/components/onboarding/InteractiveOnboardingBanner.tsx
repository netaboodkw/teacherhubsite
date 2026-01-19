import { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Users, 
  FileSpreadsheet,
  CheckCircle2,
  GraduationCap,
  BarChart3,
  ClipboardCheck,
  Home,
  HelpCircle,
  Calendar,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const stepIcons: { [key: string]: React.ReactNode } = {
  'create-classroom': <GraduationCap className="w-5 h-5" />,
  'add-students': <Users className="w-5 h-5" />,
  'grade-templates': <FileSpreadsheet className="w-5 h-5" />,
  'grades': <BarChart3 className="w-5 h-5" />,
  'schedule': <Calendar className="w-5 h-5" />,
  'fingerprint': <Fingerprint className="w-5 h-5" />,
  'dashboard': <Home className="w-5 h-5" />,
  'attendance': <ClipboardCheck className="w-5 h-5" />,
};

export function InteractiveOnboardingBanner() {
  const [isExpanded, setIsExpanded] = useState(true);
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

  // Collapsed state - just a small floating button
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed bottom-24 left-4 z-50",
          "w-12 h-12 rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "animate-pulse hover:animate-none",
          "transition-all"
        )}
        dir="rtl"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center">
          {currentStep + 1}
        </span>
      </button>
    );
  }

  // Expanded state - compact card
  return (
    <div 
      className={cn(
        "fixed bottom-24 left-4 z-50",
        "w-72 max-w-[calc(100vw-2rem)]",
        "bg-card border border-border rounded-xl shadow-xl",
        "animate-in slide-in-from-left-4 duration-200"
      )}
      dir="rtl"
    >
      {/* Header with minimize */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            {stepIcons[step.id] || <HelpCircle className="w-5 h-5" />}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            الخطوة {currentStep + 1} من {steps.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded hover:bg-muted text-muted-foreground text-xs"
            title="تصغير"
          >
            —
          </button>
          <button
            onClick={skipOnboarding}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title="إغلاق الجولة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground">
          {step.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAction}
            className="h-8 flex-1 text-xs"
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

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 pb-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === currentStep 
                ? "w-4 bg-primary" 
                : index < currentStep 
                  ? "w-1.5 bg-primary/50" 
                  : "w-1.5 bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
