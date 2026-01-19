import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, 
  ArrowLeft, Gift, LogIn, Sparkles, CheckCircle2,
  Smartphone, Shield, Cloud, Zap, Star
} from 'lucide-react';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSubscriptionSettings } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import defaultLogo from '@/assets/logo.png';

const features = [
  {
    icon: Users,
    title: 'إدارة الطلاب',
    description: 'أضف طلابك بسهولة واستورد من Excel',
  },
  {
    icon: ClipboardCheck,
    title: 'تسجيل الحضور',
    description: 'سجل الحضور بضغطة واحدة',
  },
  {
    icon: BarChart3,
    title: 'رصد الدرجات',
    description: 'نظام درجات مرن وشامل',
  },
  {
    icon: Sparkles,
    title: 'تقارير ذكية',
    description: 'إحصائيات وتحليلات متقدمة',
  },
];

const highlights = [
  { icon: Zap, text: 'سريع وسهل' },
  { icon: Cloud, text: 'حفظ تلقائي' },
  { icon: Shield, text: 'آمن وموثوق' },
  { icon: Smartphone, text: 'يعمل على الجوال' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      const role = userRole?.role;
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'department_head') {
        navigate('/department-head', { replace: true });
      } else {
        navigate('/teacher', { replace: true });
      }
    }
  }, [user, userRole, authLoading, roleLoading, navigate]);
  
  const trialDays = subscriptionSettings?.trial_days ?? 10;
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;
  
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-20 flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-card/80 backdrop-blur-sm p-2 shadow-lg border border-border/50">
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground hidden sm:block">Teacher Hub</span>
          </div>
          
          <Link to="/auth/teacher?tab=login">
            <Button variant="outline" size="sm" className="glass-card border-border/50 hover:bg-card/80">
              <LogIn className="ml-2 h-4 w-4" />
              دخول
            </Button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-card/80 backdrop-blur-xl mb-8 shadow-2xl border border-border/50 p-4">
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              منصة المعلم الذكي
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto">
              إدارة الصفوف، الحضور، والدرجات بسهولة تامة
            </p>

            {/* Trial Badge */}
            <Badge className="mb-8 text-base px-6 py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Gift className="w-5 h-5 ml-2" />
              تجربة مجانية {trialDays} يوم
            </Badge>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/auth/teacher" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold shadow-lg">
                  <GraduationCap className="ml-2 h-5 w-5" />
                  ابدأ مجاناً
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center gap-3">
              {highlights.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-muted-foreground bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Scroll Indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
              <Star className="w-4 h-4 ml-2" />
              المميزات
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              أدوات متكاملة تساعدك على إدارة صفوفك بكفاءة عالية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            ابدأ رحلتك الآن
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            انضم لمئات المعلمين الذين يستخدمون Teacher Hub
          </p>
          
          <Link to="/auth/teacher">
            <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-lg">
              <Gift className="ml-2 h-5 w-5" />
              ابدأ تجربتك المجانية
            </Button>
          </Link>
          
          <p className="text-muted-foreground text-sm mt-4">
            بدون بطاقة ائتمان • إلغاء في أي وقت
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 p-1.5">
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Teacher Hub. جميع الحقوق محفوظة.
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>صُنع بـ</span>
            <span className="text-red-500">❤️</span>
            <span>في الكويت 🇰🇼</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
