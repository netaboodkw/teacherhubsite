import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, Sparkles, ArrowLeft, 
  FileSpreadsheet, Calendar, UserPlus, Shield, Bell, Printer, 
  Smartphone, Cloud, CheckCircle, Star, Gift, Building2, Camera,
  Zap, Award, TrendingUp, Heart, LogIn
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSubscriptionSettings } from '@/hooks/useSubscription';
import defaultLogo from '@/assets/logo.png';

const features = [
  {
    icon: Users,
    title: 'إدارة الطلاب',
    description: 'أضف طلابك بسهولة مع إمكانية الاستيراد الذكي من الصور والملفات',
    gradient: 'from-[#7DD3E1] to-[#5BC0CE]',
  },
  {
    icon: Camera,
    title: 'صور الطلاب',
    description: 'أضف صوراً لكل طالب لسهولة التعرف عليهم ومتابعتهم',
    gradient: 'from-[#F5C78E] to-[#E8B77D]',
  },
  {
    icon: ClipboardCheck,
    title: 'تتبع الحضور',
    description: 'سجل الحضور والغياب بضغطة واحدة مع تقارير شاملة',
    gradient: 'from-[#C9A8D6] to-[#B897C5]',
  },
  {
    icon: BarChart3,
    title: 'الدرجات والتقارير',
    description: 'تابع أداء طلابك وأنشئ تقارير مفصلة قابلة للطباعة',
    gradient: 'from-[#7DD3E1] to-[#C9A8D6]',
  },
  {
    icon: FileSpreadsheet,
    title: 'قوالب درجات مرنة',
    description: 'أنشئ قوالب تقييم مخصصة تناسب مادتك ومرحلتك الدراسية',
    gradient: 'from-[#F5C78E] to-[#F5A8A8]',
  },
  {
    icon: Sparkles,
    title: 'الفصل التفاعلي',
    description: 'رتّب مقاعد الطلاب وسجل الملاحظات السلوكية الإيجابية والسلبية',
    gradient: 'from-[#5BC0CE] to-[#7DD3E1]',
  },
];

const highlights = [
  { icon: Zap, text: 'سريع وسهل' },
  { icon: Cloud, text: 'بياناتك آمنة' },
  { icon: Shield, text: 'خصوصية تامة' },
  { icon: Smartphone, text: 'يعمل على كل الأجهزة' },
];

const stats = [
  { value: '500+', label: 'معلم مسجل', icon: GraduationCap },
  { value: '2000+', label: 'صف دراسي', icon: Building2 },
  { value: '50,000+', label: 'طالب وطالبة', icon: Users },
  { value: '98%', label: 'رضا المستخدمين', icon: Heart },
];

export default function Landing() {
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  
  const trialDays = subscriptionSettings?.trial_days ?? 10;
  
  // Use the uploaded logo directly
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background with gradient overlay - matching logo colors */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#7DD3E1] via-[#5BC0CE] to-[#4AA8B8]"
        />
        
        {/* Animated background shapes with logo colors */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#F5C78E]/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#C9A8D6]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Login Button - Top Right */}
        <div className="absolute top-6 left-6 z-20">
          <Link to="/auth/teacher">
            <Button 
              size="lg" 
              className="bg-white/95 text-[#5BC0CE] hover:bg-white hover:text-[#4AA8B8] font-bold shadow-lg border-0 h-12 px-6 transition-all hover:scale-105"
            >
              <LogIn className="ml-2 h-5 w-5" />
              تسجيل الدخول
            </Button>
          </Link>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-16">
          {/* Logo - Large and prominent */}
          <div className="inline-flex items-center justify-center w-48 h-48 md:w-60 md:h-60 rounded-[2rem] bg-white backdrop-blur-sm mb-10 shadow-2xl p-6 ring-4 ring-white/40">
            <img 
              src={displayLogo} 
              alt="Teacher Hub" 
              className="w-full h-full object-contain drop-shadow-md"
              onError={(e) => {
                e.currentTarget.src = defaultLogo;
              }}
            />
          </div>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-white/95 mb-4 font-medium">
            منصة المعلم الذكي
          </p>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            نظام متكامل لإدارة الفصول الدراسية، تتبع الحضور والدرجات، 
            وتقارير احترافية بضغطة زر
          </p>

          {/* Free Trial Badge - Fixed hover colors */}
          <div className="mb-10">
            <Badge className="text-xl px-8 py-4 bg-white text-[#5BC0CE] shadow-xl border-0 hover:bg-white hover:text-[#4AA8B8] transition-all cursor-default">
              <Gift className="w-6 h-6 ml-3 animate-bounce" />
              تجربة مجانية لمدة {trialDays} يوم!
            </Badge>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {highlights.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-white bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/25 hover:bg-white/25 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          
          {/* CTA Button - Focus on Teachers */}
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <Link to="/auth/teacher" className="w-full">
              <Button size="lg" className="w-full bg-white text-[#5BC0CE] hover:bg-white/95 hover:text-[#4AA8B8] h-16 text-lg font-bold shadow-xl hover:scale-105 transition-all border-0">
                <GraduationCap className="ml-3 h-6 w-6" />
                ابدأ الآن مجاناً
                <ArrowLeft className="mr-auto h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 px-4 bg-gradient-to-br from-[#5BC0CE] to-[#4AA8B8]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-colors">
                <stat.icon className="w-10 h-10 text-white mx-auto mb-3 opacity-80" />
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5 bg-[#7DD3E1]/20 text-[#4AA8B8] border-0">
              <Award className="w-4 h-4 ml-2" />
              المميزات
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              كل ما يحتاجه المعلم
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              أدوات متكاملة تساعدك على إدارة صفك بكفاءة واحترافية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group bg-card overflow-hidden"
              >
                <CardContent className="p-6 text-center relative">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 px-4 bg-gradient-to-br from-[#7DD3E1] via-[#5BC0CE] to-[#4AA8B8] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-40 h-40 bg-[#F5C78E]/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 bg-[#C9A8D6]/15 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            ابدأ رحلتك الآن!
          </h2>
          <p className="text-xl text-white/90 mb-4">
            انضم لمئات المعلمين الذين يديرون صفوفهم بكفاءة
          </p>
          <p className="text-lg text-white/80 mb-10">
            تجربة مجانية لمدة <span className="font-bold text-white">{trialDays} يوم</span> - بدون بطاقة ائتمان
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/teacher">
              <Button size="lg" className="bg-white text-[#5BC0CE] hover:bg-white/95 hover:text-[#4AA8B8] h-16 px-12 text-lg font-bold shadow-xl hover:scale-105 transition-all border-0">
                <UserPlus className="ml-3 h-6 w-6" />
                سجل مجاناً الآن
                <ArrowLeft className="mr-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* For Department Heads Section - Moved to bottom */}
      <div className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-[#C9A8D6]/20 text-[#8B6B99] border-0 text-sm px-4 py-1.5">
              <Building2 className="w-4 h-4 ml-2" />
              لرؤساء الأقسام
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              تابع فريقك بكل سهولة
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              أدوات متقدمة لمتابعة أداء المعلمين وتقارير شاملة عن جميع الصفوف تحت إشرافك
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Users, title: 'متابعة المعلمين', description: 'عرض تقارير شاملة لجميع المعلمين' },
              { icon: TrendingUp, title: 'تقارير تفصيلية', description: 'إحصائيات ورسوم بيانية شاملة' },
              { icon: Star, title: 'تقييم الأداء', description: 'متابعة مستمرة لأداء الفريق' },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-card">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C9A8D6] to-[#B897C5] flex items-center justify-center mx-auto mb-4 shadow-md">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/auth/department-head">
              <Button size="lg" className="bg-gradient-to-r from-[#C9A8D6] to-[#B897C5] text-white border-0 h-14 px-8 hover:opacity-90 transition-opacity shadow-lg">
                <Building2 className="ml-2 h-5 w-5" />
                سجل كرئيس قسم
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted p-2">
                <img src={displayLogo} alt="Teacher Hub" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-xl text-foreground">Teacher Hub</span>
                <p className="text-sm text-muted-foreground">منصة المعلم الذكي</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Teacher Hub. جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
