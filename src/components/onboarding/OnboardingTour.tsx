import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  Calendar,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Timer,
  FileSpreadsheet,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  tip?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "مرحباً بك في TeacherHub! 🎉",
    description: "دعنا نأخذك في جولة سريعة للتعرف على المنصة وكيفية استخدامها بشكل فعال.",
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    features: [
      "إدارة صفوفك الدراسية بسهولة",
      "تتبع حضور الطلاب",
      "تسجيل الدرجات والتقييمات",
      "تقارير تفصيلية وإحصائيات"
    ],
    tip: "يمكنك تخطي هذه الجولة والعودة إليها لاحقاً من الإعدادات"
  },
  {
    title: "إنشاء الصفوف الدراسية",
    description: "ابدأ بإنشاء صفوفك الدراسية لتنظيم طلابك حسب المادة والمرحلة.",
    icon: <GraduationCap className="w-12 h-12 text-purple-500" />,
    features: [
      "أضف اسم الصف والمادة",
      "حدد الصف الدراسي والمرحلة",
      "اختر لوناً مميزاً للصف",
      "أضف جدول الحصص الأسبوعي"
    ],
    tip: "يمكنك إنشاء صفوف متعددة لنفس المادة بمراحل مختلفة"
  },
  {
    title: "إضافة الطلاب",
    description: "أضف طلابك يدوياً أو استوردهم من ملف Excel بسرعة.",
    icon: <Users className="w-12 h-12 text-blue-500" />,
    features: [
      "إضافة طالب واحد أو استيراد جماعي",
      "تسجيل بيانات ولي الأمر",
      "إضافة ملاحظات خاصة بكل طالب",
      "رفع صور الطلاب"
    ],
    tip: "استخدم ميزة الاستيراد من Excel لإضافة جميع طلابك دفعة واحدة"
  },
  {
    title: "تسجيل الحضور والغياب",
    description: "سجل حضور طلابك بضغطة واحدة مع تتبع الحصص.",
    icon: <ClipboardCheck className="w-12 h-12 text-green-500" />,
    features: [
      "تسجيل سريع للحضور",
      "تحديد الحصة والتاريخ",
      "عرض سجل الحضور السابق",
      "إشعارات للغياب المتكرر"
    ],
    tip: "اضغط مرتين على الطالب للتبديل بين حاضر/غائب/متأخر"
  },
  {
    title: "قوالب الدرجات",
    description: "أنشئ قوالب تقييم مخصصة لتوحيد طريقة رصد الدرجات في جميع صفوفك.",
    icon: <FileSpreadsheet className="w-12 h-12 text-indigo-500" />,
    features: [
      "إنشاء هيكل تقييم مخصص",
      "تحديد الأوزان والنسب",
      "إضافة فترات تقييم متعددة",
      "مشاركة القوالب مع زملائك"
    ],
    tip: "أنشئ قالباً واحداً واستخدمه في جميع صفوفك لتوفير الوقت"
  },
  {
    title: "تسجيل الدرجات",
    description: "سجل درجات طلابك بسهولة مع دعم أنواع متعددة من التقييمات.",
    icon: <BookOpen className="w-12 h-12 text-orange-500" />,
    features: [
      "درجات الاختبارات والواجبات",
      "تقييم المشاركة والسلوك",
      "حساب تلقائي للمعدلات",
      "تصدير الدرجات لـ Excel"
    ],
    tip: "استخدم قوالب التقييم لتوحيد طريقة رصد الدرجات"
  },
  {
    title: "أدوات الفصل الذكية",
    description: "استخدم أدوات تفاعلية لإدارة فصلك بشكل أفضل.",
    icon: <Timer className="w-12 h-12 text-amber-500" />,
    features: [
      "مؤقت للأنشطة والاختبارات",
      "اختيار طالب عشوائي",
      "نظام النقاط والشارات",
      "لوحة المتصدرين الأسبوعية"
    ],
    tip: "استخدم الاختيار العشوائي لتشجيع المشاركة"
  },
  {
    title: "التقارير والإحصائيات",
    description: "احصل على رؤية شاملة لأداء طلابك وصفوفك.",
    icon: <BarChart3 className="w-12 h-12 text-cyan-500" />,
    features: [
      "تقارير الحضور الشهرية",
      "تحليل الدرجات والأداء",
      "مقارنة بين الصفوف",
      "تصدير التقارير PDF/Excel"
    ],
    tip: "راجع التقارير أسبوعياً لمتابعة تقدم الطلاب"
  },
  {
    title: "الفترة التجريبية المجانية 🎁",
    description: "أنت الآن تستخدم المنصة في الفترة التجريبية المجانية. استفد من جميع المميزات!",
    icon: <Crown className="w-12 h-12 text-amber-500" />,
    features: [
      "فترة تجريبية مجانية لمدة 10 أيام",
      "جميع المميزات متاحة بالكامل",
      "إنشاء صفوف وطلاب بلا حدود",
      "اشترك للاستمرار بعد انتهاء التجربة"
    ],
    tip: "اشترك الآن للحصول على خصم خاص للمشتركين الجدد!"
  },
  {
    title: "أنت جاهز للانطلاق! 🚀",
    description: "لقد أكملت الجولة التعريفية. ابدأ الآن بإنشاء صفك الأول!",
    icon: <CheckCircle2 className="w-12 h-12 text-success" />,
    features: [
      "أنشئ صفك الدراسي الأول",
      "أضف طلابك",
      "ابدأ بتسجيل الحضور",
      "استمتع بالتجربة!"
    ],
    tip: "لأي مساعدة، تواصل معنا عبر صفحة الدعم"
  }
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      setOpen(false);
      onComplete?.();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const currentTourStep = tourSteps[currentStep];

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-center space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>الخطوة {currentStep + 1} من {tourSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className={cn(
              "p-4 rounded-2xl",
              "bg-gradient-to-br from-primary/10 to-primary/5"
            )}>
              {currentTourStep.icon}
            </div>
          </div>

          <DialogTitle className="text-xl font-bold">
            {currentTourStep.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentTourStep.description}
          </DialogDescription>
        </DialogHeader>

        {/* Features List */}
        <div className="space-y-3 my-4">
          {currentTourStep.features.map((feature, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                "bg-muted/50 border border-border/50",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Tip */}
        {currentTourStep.tip && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-primary flex items-start gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>نصيحة:</strong> {currentTourStep.tip}</span>
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          {currentStep === 0 ? (
            <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
              تخطي الجولة
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePrevious} className="w-full sm:w-auto">
              <ArrowRight className="w-4 h-4 ml-2" />
              السابق
            </Button>
          )}
          
          <Button onClick={handleNext} className="w-full sm:w-auto">
            {currentStep === tourSteps.length - 1 ? (
              <>
                <CheckCircle2 className="w-4 h-4 ml-2" />
                ابدأ الآن
              </>
            ) : (
              <>
                التالي
                <ArrowLeft className="w-4 h-4 mr-2" />
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Step Indicators */}
        <div className="flex justify-center gap-1.5 mt-4">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentStep 
                  ? "w-6 bg-primary" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
