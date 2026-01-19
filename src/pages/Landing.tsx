import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, 
  ArrowLeft, Gift, LogIn, Sparkles, CheckCircle2,
  Smartphone, Shield, Cloud, Zap, Star, Camera,
  Brain, FileSpreadsheet, Bell, TrendingUp, Award,
  ChevronDown, Play, Fingerprint, Quote, MessageCircle
} from 'lucide-react';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSubscriptionSettings } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import defaultLogo from '@/assets/logo.png';

const features = [
  {
    icon: Camera,
    title: 'استيراد ذكي بالكاميرا',
    description: 'صوّر كشف الأسماء بالجوال والذكاء الاصطناعي يضيف الطلاب تلقائياً',
    highlight: true,
    badge: 'جديد',
  },
  {
    icon: Fingerprint,
    title: 'تذكير بصمة التواجد',
    description: 'تنبيهات يومية لتسجيل بصمة الحضور والانصراف حتى لا تنسى أبداً',
    highlight: true,
    badge: 'مميز',
  },
  {
    icon: FileSpreadsheet,
    title: 'استيراد من Excel',
    description: 'أضف عشرات الطلاب دفعة واحدة من ملفات Excel',
    highlight: false,
  },
  {
    icon: ClipboardCheck,
    title: 'حضور بضغطة واحدة',
    description: 'سجل حضور جميع الطلاب بضغطة زر واحدة فقط',
    highlight: false,
  },
  {
    icon: BarChart3,
    title: 'درجات مرنة وشاملة',
    description: 'نظام درجات قابل للتخصيص حسب احتياجاتك',
    highlight: false,
  },
  {
    icon: Bell,
    title: 'تنبيهات الحصص',
    description: 'تذكيرات قبل بداية كل حصة حتى لا تنسى أبداً',
    highlight: false,
  },
];

const stats = [
  { number: '500+', label: 'معلم نشط' },
  { number: '10K+', label: 'طالب مسجل' },
  { number: '99%', label: 'رضا المستخدمين' },
];

const highlights = [
  { icon: Zap, text: 'سريع وسهل' },
  { icon: Cloud, text: 'حفظ تلقائي' },
  { icon: Shield, text: 'آمن وموثوق' },
  { icon: Smartphone, text: 'يعمل على الجوال' },
];

const steps = [
  { number: '1', title: 'سجّل حسابك', description: 'في أقل من دقيقة' },
  { number: '2', title: 'أضف صفوفك', description: 'وطلابك بسهولة' },
  { number: '3', title: 'ابدأ العمل', description: 'حضور ودرجات فوراً' },
];

const testimonials = [
  {
    name: 'أ. محمد العنزي',
    role: 'معلم رياضيات - الكويت',
    content: 'التطبيق سهّل عليّ كثير! قبل كنت أضيع وقت كبير في تسجيل الدرجات، الحين بضغطة زر أرصد وأطبع.',
    rating: 5,
  },
  {
    name: 'أ. فاطمة الشمري',
    role: 'معلمة علوم - السعودية',
    content: 'ميزة تصوير كشف الأسماء وفرت عليّ ساعات! صورت الكشف والطلاب انضافوا تلقائياً، شيء خرافي!',
    rating: 5,
  },
  {
    name: 'أ. عبدالله المطيري',
    role: 'معلم لغة عربية - الكويت',
    content: 'تذكير البصمة ينقذني كل يوم! ما أنسى أسجل حضوري أبداً الحين. شكراً Teacher Hub!',
    rating: 5,
  },
  {
    name: 'أ. نورة القحطاني',
    role: 'معلمة إنجليزي - البحرين',
    content: 'أفضل تطبيق لإدارة الصفوف استخدمته. سهل وبسيط وكل شي واضح. أنصح كل معلم يجربه!',
    rating: 5,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div 
            className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${-scrollY * 0.15}px)`, animationDelay: '1s' }}
          />
          <div 
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.05}px)` }}
          />
          
          {/* Decorative Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
          
          {/* Floating Icons */}
          <div className="absolute top-1/4 right-1/4 opacity-20">
            <GraduationCap className="w-16 h-16 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute bottom-1/3 left-1/3 opacity-20">
            <BarChart3 className="w-12 h-12 text-secondary animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          </div>
          <div className="absolute top-1/2 right-1/3 opacity-20">
            <Users className="w-10 h-10 text-accent animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
          </div>
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
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-28 h-28 md:w-40 md:h-40 rounded-3xl bg-card/80 backdrop-blur-xl mb-8 shadow-2xl border border-border/50 p-4 relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain drop-shadow-lg relative z-10"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>
            
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/30 mb-6">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">مدعوم بالذكاء الاصطناعي</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              <span className="block">منصة المعلم</span>
              <span className="bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">الذكي</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-muted-foreground mb-4 leading-relaxed max-w-xl mx-auto">
              إدارة الصفوف، الحضور، والدرجات
            </p>
            
            <p className="text-base md:text-lg text-primary font-medium mb-8">
              صوّر كشف الأسماء والذكاء الاصطناعي يضيف طلابك تلقائياً! 📸
            </p>

            {/* Trial Badge */}
            <Badge className="mb-8 text-base px-6 py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 animate-pulse">
              <Gift className="w-5 h-5 ml-2" />
              تجربة مجانية {trialDays} يوم
            </Badge>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link to="/auth/teacher" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <GraduationCap className="ml-2 h-6 w-6" />
                  ابدأ مجاناً
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/auth/teacher?tab=login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2">
                  <Play className="ml-2 h-5 w-5" />
                  لدي حساب
                </Button>
              </Link>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center gap-3">
              {highlights.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-muted-foreground bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Scroll Indicator */}
        <div className="relative z-10 pb-8 flex flex-col items-center gap-2">
          <span className="text-sm text-muted-foreground">اكتشف المزيد</span>
          <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-primary/5 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
              <Star className="w-4 h-4 ml-2" />
              المميزات
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              أدوات متكاملة تساعدك على إدارة صفوفك بكفاءة عالية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className={`group p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                  feature.highlight 
                    ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30 hover:border-primary/50 shadow-lg' 
                    : 'bg-card/80 border-border/50 hover:border-primary/50 hover:shadow-lg'
                }`}
              >
                {feature.badge && (
                  <Badge className="mb-4 bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3 ml-1" />
                    {feature.badge}
                  </Badge>
                )}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  feature.highlight 
                    ? 'bg-primary/20 group-hover:bg-primary/30' 
                    : 'bg-primary/10 group-hover:bg-primary/20'
                }`}>
                  <feature.icon className={`w-8 h-8 ${feature.highlight ? 'text-primary' : 'text-primary'}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent-foreground border-accent/20">
              <TrendingUp className="w-4 h-4 ml-2" />
              كيف يعمل؟
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              ثلاث خطوات بسيطة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -left-4 w-8 h-0.5 bg-gradient-to-l from-primary/50 to-transparent" />
                )}
                
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold mb-4 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-border/50 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl">
                  <Camera className="w-16 h-16 text-primary-foreground" />
                </div>
              </div>
              
              <div className="text-center md:text-right flex-1">
                <Badge className="mb-4 bg-primary text-primary-foreground">
                  <Brain className="w-3 h-3 ml-1" />
                  تقنية ذكاء اصطناعي
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  أضف طلابك بتصوير كشف الأسماء
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  فقط صوّر كشف أسماء الطلاب بجوالك، والذكاء الاصطناعي يقرأ الأسماء ويضيفها تلقائياً لصفك. وفّر وقتك وجهدك!
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>يدعم العربية والإنجليزية</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>دقة عالية</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>ثواني معدودة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fingerprint Feature Section */}
      <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-border/50 shadow-2xl">
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-xl relative">
                  <Fingerprint className="w-16 h-16 text-primary-foreground" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-right flex-1">
                <Badge className="mb-4 bg-secondary text-secondary-foreground">
                  <Bell className="w-3 h-3 ml-1" />
                  تذكير يومي
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  لا تنسَ بصمة التواجد أبداً
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  فعّل تذكير البصمة وسيصلك تنبيه يومي في الوقت المحدد لتسجيل حضورك وانصرافك. وداعاً للنسيان والخصومات!
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تذكير الحضور الصباحي</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تذكير الانصراف</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تخصيص الأوقات</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <MessageCircle className="w-4 h-4 ml-2" />
              آراء المعلمين
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              ماذا يقول المعلمون عنا؟
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              آراء حقيقية من معلمين يستخدمون Teacher Hub يومياً
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {testimonial.name.charAt(3)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{testimonial.role}</p>
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="relative">
                      <Quote className="absolute -top-2 -right-2 w-8 h-8 text-primary/20" />
                      <p className="text-muted-foreground leading-relaxed pr-6">
                        {testimonial.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary mb-8 shadow-xl">
            <Award className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            ابدأ رحلتك الآن
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            انضم لمئات المعلمين الذين يستخدمون Teacher Hub لإدارة صفوفهم بذكاء
          </p>
          
          <Link to="/auth/teacher">
            <Button size="lg" className="h-16 px-12 text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <Gift className="ml-3 h-6 w-6" />
              ابدأ تجربتك المجانية
              <ArrowLeft className="mr-3 h-6 w-6" />
            </Button>
          </Link>
          
          <p className="text-muted-foreground text-sm mt-6">
            ✓ بدون بطاقة ائتمان &nbsp;&nbsp; ✓ إلغاء في أي وقت &nbsp;&nbsp; ✓ {trialDays} يوم مجاناً
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