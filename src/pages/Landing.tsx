import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, 
  ArrowLeft, Gift, LogIn, Sparkles, CheckCircle2,
  Smartphone, Shield, Cloud, Zap, Star, Camera,
  Brain, FileSpreadsheet, Bell, TrendingUp, Award,
  ChevronDown, Play, Fingerprint, Quote, MessageCircle,
  Clock, HelpCircle, ChevronUp
} from 'lucide-react';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSubscriptionSettings } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import defaultLogo from '@/assets/logo.png';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: Camera,
    title: 'استيراد ذكي بالكاميرا',
    description: 'صوّر كشف الأسماء بهاتفك والذكاء الاصطناعي يضيف الطلاب تلقائياً',
    highlight: true,
    badge: 'جديد',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Fingerprint,
    title: 'تذكير بصمة التواجد',
    description: 'تنبيهات يومية لتسجيل بصمة الحضور والانصراف حتى لا تنسى أبداً',
    highlight: true,
    badge: 'مميز',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Clock,
    title: 'تذكير وقت الحصة',
    description: 'تنبيه قبل بداية كل حصة حتى تكون مستعداً دائماً',
    highlight: true,
    badge: 'مميز',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FileSpreadsheet,
    title: 'استيراد من Excel',
    description: 'أضف عشرات الطلاب دفعة واحدة من ملفات Excel',
    highlight: false,
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: ClipboardCheck,
    title: 'حضور بضغطة واحدة',
    description: 'سجل حضور جميع الطلاب بضغطة زر واحدة فقط',
    highlight: false,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: BarChart3,
    title: 'درجات مرنة وشاملة',
    description: 'نظام درجات قابل للتخصيص حسب احتياجاتك',
    highlight: false,
    color: 'from-teal-500 to-cyan-500',
  },
];

const stats = [
  { number: '500+', label: 'معلم نشط', color: 'text-blue-500' },
  { number: '10K+', label: 'طالب مسجل', color: 'text-purple-500' },
  { number: '99%', label: 'رضا المستخدمين', color: 'text-green-500' },
];

const highlights = [
  { icon: Zap, text: 'سريع وسهل', color: 'text-yellow-500' },
  { icon: Cloud, text: 'حفظ تلقائي', color: 'text-blue-500' },
  { icon: Shield, text: 'آمن وموثوق', color: 'text-green-500' },
  { icon: Smartphone, text: 'يعمل على الهواتف', color: 'text-purple-500' },
];

const steps = [
  { number: '1', title: 'سجّل حسابك', description: 'في أقل من دقيقة', color: 'from-blue-500 to-cyan-500' },
  { number: '2', title: 'أضف صفوفك', description: 'وطلابك بسهولة', color: 'from-purple-500 to-pink-500' },
  { number: '3', title: 'ابدأ العمل', description: 'حضور ودرجات فوراً', color: 'from-orange-500 to-red-500' },
];

const testimonials = [
  {
    name: 'أ. محمد العنزي',
    role: 'معلم رياضيات - الكويت',
    content: 'التطبيق سهّل عليّ كثير! قبل كنت أضيع وقت كبير في تسجيل الدرجات، الحين بضغطة زر أرصد وأطبع.',
    rating: 5,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'أ. فاطمة الشمري',
    role: 'معلمة علوم - السعودية',
    content: 'ميزة تصوير كشف الأسماء وفرت عليّ ساعات! صورت الكشف والطلاب انضافوا تلقائياً، شيء خرافي!',
    rating: 5,
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'أ. عبدالله المطيري',
    role: 'معلم لغة عربية - الكويت',
    content: 'تذكير البصمة ينقذني كل يوم! ما أنسى أسجل حضوري أبداً الحين. شكراً Teacher Hub!',
    rating: 5,
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'أ. نورة القحطاني',
    role: 'معلمة إنجليزي - البحرين',
    content: 'أفضل تطبيق لإدارة الصفوف استخدمته. سهل وبسيط وكل شي واضح. أنصح كل معلم يجربه!',
    rating: 5,
    color: 'from-orange-500 to-red-500',
  },
];

const faqs = [
  {
    question: 'هل التطبيق مجاني؟',
    answer: 'نعم! يمكنك تجربة التطبيق مجاناً لمدة 10 أيام بكامل المميزات. بعد انتهاء الفترة التجريبية يمكنك الاشتراك بأسعار رمزية.',
  },
  {
    question: 'هل يعمل على جميع الهواتف؟',
    answer: 'نعم، التطبيق يعمل على جميع الهواتف (iPhone و Android) وكذلك على الكمبيوتر والتابلت من خلال المتصفح.',
  },
  {
    question: 'كيف أضيف طلابي للتطبيق؟',
    answer: 'لديك 3 طرق: 1) إضافة يدوية لكل طالب، 2) استيراد من ملف Excel، 3) تصوير كشف الأسماء بالكاميرا والذكاء الاصطناعي يضيفهم تلقائياً.',
  },
  {
    question: 'هل بياناتي آمنة؟',
    answer: 'نعم، نستخدم أحدث تقنيات التشفير وحماية البيانات. بياناتك محفوظة بأمان تام ولا يمكن لأحد غيرك الوصول إليها.',
  },
  {
    question: 'ما هي ميزة تذكير البصمة؟',
    answer: 'هي ميزة تُرسل لك تنبيهاً في الوقت الذي تحدده لتذكيرك بتسجيل بصمة الحضور والانصراف في نظام المدرسة. وداعاً للنسيان والخصومات!',
  },
  {
    question: 'هل يمكنني طباعة التقارير؟',
    answer: 'نعم، يمكنك طباعة كشوف الحضور والدرجات وتصديرها لملفات Excel بضغطة زر واحدة.',
  },
];

// Animation hook for scroll reveal
function useScrollAnimation() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return visibleSections;
}

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  const [scrollY, setScrollY] = useState(0);
  const visibleSections = useScrollAnimation();
  
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
  
  const isVisible = (id: string) => visibleSections.has(id);
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/10 via-transparent to-cyan-500/10" />
        
        {/* Floating Colorful Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div 
            className="absolute bottom-40 left-10 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${-scrollY * 0.15}px)`, animationDelay: '1s' }}
          />
          <div 
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.05}px)`, animationDelay: '2s' }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />
          
          {/* Decorative Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
          
          {/* Floating Colorful Icons */}
          <div className="absolute top-1/4 right-1/4 opacity-30">
            <GraduationCap className="w-16 h-16 text-blue-500 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute bottom-1/3 left-1/3 opacity-30">
            <BarChart3 className="w-12 h-12 text-purple-500 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          </div>
          <div className="absolute top-1/2 right-1/3 opacity-30">
            <Users className="w-10 h-10 text-pink-500 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
          </div>
          <div className="absolute top-2/3 left-1/4 opacity-30">
            <Bell className="w-8 h-8 text-orange-500 animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.8s' }} />
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
            <div className="inline-flex items-center justify-center w-28 h-28 md:w-40 md:h-40 rounded-3xl bg-card/80 backdrop-blur-xl mb-8 shadow-2xl border border-border/50 p-4 relative animate-fade-in">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain drop-shadow-lg relative z-10"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>
            
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/30 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">مدعوم بالذكاء الاصطناعي</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <span className="block">منصة المعلم</span>
              <span className="bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">الذكي</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
              إدارة الصفوف، الحضور، والدرجات بسهولة وذكاء
            </p>

            {/* Trial Badge */}
            <Badge className="mb-8 text-base px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-primary border-primary/20 hover:from-blue-500/20 hover:to-purple-500/20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Gift className="w-5 h-5 ml-2 text-purple-500" />
              تجربة مجانية {trialDays} يوم
            </Badge>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Link to="/auth/teacher" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <GraduationCap className="ml-2 h-6 w-6" />
                  ابدأ مجاناً
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/auth/teacher?tab=login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2 hover:bg-card/80">
                  <Play className="ml-2 h-5 w-5" />
                  لدي حساب
                </Button>
              </Link>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              {highlights.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-muted-foreground bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 hover:border-primary/50 hover:scale-105 transition-all duration-300"
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
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
      <section 
        id="stats-section"
        data-animate
        className={`py-16 px-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 border-y border-border/50 transition-all duration-700 ${
          isVisible('stats-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="text-center transition-all duration-500"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`text-3xl md:text-5xl font-bold mb-2 ${stat.color}`}>{stat.number}</div>
                <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features-section"
        data-animate
        className={`py-20 px-4 bg-muted/30 relative overflow-hidden transition-all duration-700 ${
          isVisible('features-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              <Star className="w-4 h-4 ml-2" />
              المميزات
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              كل ما تحتاجه في <span className="bg-gradient-to-l from-blue-500 to-purple-500 bg-clip-text text-transparent">مكان واحد</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              أدوات متكاملة تساعدك على إدارة صفوفك بكفاءة عالية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className={`group p-6 rounded-2xl backdrop-blur-sm border transition-all duration-500 hover:scale-105 ${
                  feature.highlight 
                    ? 'bg-gradient-to-br from-card/90 to-card/70 border-primary/30 hover:border-primary/50 shadow-lg' 
                    : 'bg-card/80 border-border/50 hover:border-primary/50 hover:shadow-lg'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {feature.badge && (
                  <Badge className={`mb-4 bg-gradient-to-r ${feature.color} text-white border-0`}>
                    <Sparkles className="w-3 h-3 ml-1" />
                    {feature.badge}
                  </Badge>
                )}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section 
        id="steps-section"
        data-animate
        className={`py-20 px-4 bg-background transition-all duration-700 ${
          isVisible('steps-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
              <TrendingUp className="w-4 h-4 ml-2" />
              كيف يعمل؟
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              ثلاث خطوات <span className="bg-gradient-to-l from-orange-500 to-red-500 bg-clip-text text-transparent">بسيطة</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div 
                key={i} 
                className="text-center relative transition-all duration-500"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -left-4 w-8 h-0.5 bg-gradient-to-l from-primary/50 to-transparent" />
                )}
                
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${step.color} text-white text-2xl font-bold mb-4 shadow-lg hover:scale-110 transition-transform duration-300`}>
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Class Reminder Feature Section */}
      <section 
        id="reminder-section"
        data-animate
        className={`py-20 px-4 bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 relative overflow-hidden transition-all duration-700 ${
          isVisible('reminder-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-border/50 shadow-2xl hover:shadow-3xl transition-shadow duration-500">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-xl relative hover:scale-105 transition-transform duration-300">
                  <Clock className="w-16 h-16 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-right flex-1">
                <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <Bell className="w-3 h-3 ml-1" />
                  تذكير ذكي
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  لا تنسَ وقت الحصة أبداً
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  فعّل تذكير الحصص وسيصلك تنبيه قبل بداية كل حصة بالوقت الذي تحدده. كُن مستعداً دائماً!
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تنبيه قبل 5 دقائق</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تخصيص وقت التنبيه</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>عرض تفاصيل الحصة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fingerprint Feature Section */}
      <section 
        id="fingerprint-section"
        data-animate
        className={`py-20 px-4 bg-muted/30 relative overflow-hidden transition-all duration-700 ${
          isVisible('fingerprint-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-border/50 shadow-2xl hover:shadow-3xl transition-shadow duration-500">
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl relative hover:scale-105 transition-transform duration-300">
                  <Fingerprint className="w-16 h-16 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-right flex-1">
                <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Fingerprint className="w-3 h-3 ml-1" />
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
      <section 
        id="testimonials-section"
        data-animate
        className={`py-20 px-4 bg-background relative overflow-hidden transition-all duration-700 ${
          isVisible('testimonials-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              <MessageCircle className="w-4 h-4 ml-2" />
              آراء المعلمين
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              ماذا يقول <span className="bg-gradient-to-l from-green-500 to-emerald-500 bg-clip-text text-transparent">المعلمون</span> عنا؟
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              آراء حقيقية من معلمين يستخدمون Teacher Hub يومياً
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
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

      {/* FAQ Section */}
      <section 
        id="faq-section"
        data-animate
        className={`py-20 px-4 bg-muted/30 relative overflow-hidden transition-all duration-700 ${
          isVisible('faq-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              <HelpCircle className="w-4 h-4 ml-2" />
              الأسئلة الشائعة
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              هل لديك <span className="bg-gradient-to-l from-blue-500 to-cyan-500 bg-clip-text text-transparent">سؤال؟</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              إجابات على الأسئلة الأكثر شيوعاً
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`item-${i}`}
                className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 px-6 overflow-hidden hover:border-primary/30 transition-colors duration-300"
              >
                <AccordionTrigger className="text-right text-lg font-bold hover:no-underline py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                      {i + 1}
                    </div>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 pr-11">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        id="cta-section"
        data-animate
        className={`py-20 px-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 transition-all duration-700 ${
          isVisible('cta-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-8 shadow-xl hover:scale-110 transition-transform duration-300">
            <Award className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            ابدأ رحلتك <span className="bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">الآن</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            انضم لمئات المعلمين الذين يستخدمون Teacher Hub لإدارة صفوفهم بذكاء
          </p>
          
          <Link to="/auth/teacher">
            <Button size="lg" className="h-16 px-12 text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600">
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-1.5">
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
