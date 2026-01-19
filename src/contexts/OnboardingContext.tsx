import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route: string;
  action?: string;
  isCompleted: boolean;
}

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  markStepCompleted: (stepId: string) => void;
  progress: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'مرحباً بك! 🎉',
    description: 'دعنا نساعدك في إعداد حسابك خطوة بخطوة',
    route: '/teacher',
    isCompleted: false,
  },
  {
    id: 'create-classroom',
    title: 'إنشاء صفك الأول',
    description: 'أنشئ صفاً دراسياً لتبدأ بإضافة طلابك',
    route: '/teacher/classrooms/new',
    action: 'أنشئ صفاً جديداً',
    isCompleted: false,
  },
  {
    id: 'add-students',
    title: 'إضافة الطلاب',
    description: 'أضف طلابك يدوياً أو استوردهم من ملف Excel',
    route: '/teacher/students',
    action: 'أضف طلابك',
    isCompleted: false,
  },
  {
    id: 'explore-grades',
    title: 'استكشف الدرجات',
    description: 'تعرف على كيفية تسجيل الدرجات وإنشاء قوالب التقييم',
    route: '/teacher/grades',
    action: 'اكتشف الدرجات',
    isCompleted: false,
  },
  {
    id: 'complete',
    title: 'أنت جاهز! 🚀',
    description: 'لقد أكملت الإعداد الأولي. استمتع باستخدام المنصة!',
    route: '/teacher',
    isCompleted: false,
  },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(initialSteps);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user needs onboarding
  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        // Check if user has any classrooms
        const { count: classroomCount } = await supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // If no classrooms, start onboarding
        if (classroomCount === 0) {
          setIsOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep(0);
    navigate(steps[0].route);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      navigate(steps[nextStepIndex].route);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      navigate(steps[prevStepIndex].route);
    }
  };

  const skipOnboarding = async () => {
    await saveOnboardingComplete();
    setIsOnboarding(false);
  };

  const completeOnboarding = async () => {
    await saveOnboardingComplete();
    setIsOnboarding(false);
    navigate('/teacher');
  };

  const saveOnboardingComplete = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const markStepCompleted = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    );

    // Auto-advance to next step when current step is completed
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex === currentStep && currentStep < steps.length - 1) {
      // Small delay for better UX
      setTimeout(() => {
        nextStep();
      }, 500);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (loading) {
    return <>{children}</>;
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        steps,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        markStepCompleted,
        progress,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
