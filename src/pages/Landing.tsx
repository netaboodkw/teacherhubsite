import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, Sparkles, ArrowLeft, 
  FileSpreadsheet, Calendar, UserPlus, Shield, Bell, Printer, 
  Smartphone, Cloud, CheckCircle, Star, Gift, Building2, Camera, Eye,
  Zap, Award, TrendingUp, Heart
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSubscriptionSettings } from '@/hooks/useSubscription';
import featureDashboard from '@/assets/feature-dashboard.png';
import featureGrades from '@/assets/feature-grades.png';
import featureAttendance from '@/assets/feature-attendance.png';

const features = [
  {
    icon: Users,
    title: 'إدارة الطلاب',
    description: 'أضف طلابك بسهولة مع إمكانية الاستيراد الذكي من الصور والملفات',
    gradient: 'from-primary to-secondary',
  },
  {
    icon: Camera,
    title: 'صور الطلاب',
    description: 'أضف صوراً لكل طالب لسهولة التعرف عليهم ومتابعتهم',
    gradient: 'from-secondary to-success',
  },
  {
    icon: ClipboardCheck,
    title: 'تتبع الحضور',
    description: 'سجل الحضور والغياب بضغطة واحدة مع تقارير شاملة',
    gradient: 'from-success to-primary',
  },
  {
    icon: BarChart3,
    title: 'الدرجات والتقارير',
    description: 'تابع أداء طلابك وأنشئ تقارير مفصلة قابلة للطباعة',
    gradient: 'from-primary to-accent',
  },
  {
    icon: FileSpreadsheet,
    title: 'قوالب درجات مرنة',
    description: 'أنشئ قوالب تقييم مخصصة تناسب مادتك ومرحلتك الدراسية',
    gradient: 'from-warning to-destructive',
  },
  {
    icon: Sparkles,
    title: 'الفصل التفاعلي',
    description: 'رتّب مقاعد الطلاب وسجل الملاحظات السلوكية الإيجابية والسلبية',
    gradient: 'from-accent to-primary',
  },
  {
    icon: Eye,
    title: 'متابعة رئيس القسم',
    description: 'يمكن لرئيس القسم متابعة أداء المعلمين والطلاب بشكل مستمر',
    gradient: 'from-secondary to-primary',
  },
  {
    icon: Calendar,
    title: 'جدولة الحصص',
    description: 'نظم جدول حصصك الأسبوعي مع تنبيهات ذكية',
    gradient: 'from-primary to-secondary',
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
  const { logoUrl } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  
  const trialDays = subscriptionSettings?.trial_days ?? 10;
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background with gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 gradient-hero opacity-90" />
        
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-36 h-36 rounded-3xl bg-white/95 backdrop-blur-sm mb-8 shadow-2xl p-3 animate-logo-float ring-4 ring-white/30">
            <img src={logoUrl} alt="Teacher Hub" className="w-full h-full object-contain" />
          </div>
          
          {/* Title with gradient */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 drop-shadow-lg">
            Teacher Hub
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-white/95 mb-4 font-medium">
            منصة المعلم الذكي
          </p>
          
          <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto leading-relaxed">
            نظام متكامل لإدارة الفصول الدراسية، تتبع الحضور والدرجات، 
            وتقارير احترافية بضغطة زر
          </p>

          {/* Free Trial Badge */}
          <div className="mb-10">
            <Badge className="text-xl px-8 py-4 bg-white text-primary shadow-xl border-0 hover:scale-105 transition-transform">
              <Gift className="w-6 h-6 ml-3 animate-bounce" />
              تجربة مجانية لمدة {trialDays} يوم!
            </Badge>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {highlights.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-white bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/25 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Link to="/auth/teacher" className="flex-1">
              <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 h-16 text-lg font-bold shadow-xl hover:scale-105 transition-all">
                <GraduationCap className="ml-3 h-6 w-6" />
                ابدأ الآن مجاناً
                <ArrowLeft className="mr-auto h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/department-head" className="flex-1">
              <Button size="lg" variant="outline" className="w-full bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 h-16 text-lg">
                <Building2 className="ml-3 h-6 w-6" />
                رؤساء الأقسام
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
      <div className="py-16 px-4 gradient-hero">
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

      {/* Screenshots Section */}
      <div className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
              <Sparkles className="w-4 h-4 ml-2" />
              شاهد المنصة
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              واجهة احترافية سهلة الاستخدام
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              صُممت خصيصاً للمعلم العربي بتجربة استخدام سلسة وممتعة
            </p>
          </div>
          
          <div className="grid gap-8">
            {/* Main Dashboard Screenshot */}
            <div className="relative group">
              <div className="absolute inset-0 gradient-primary rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
                <img src={featureDashboard} alt="لوحة التحكم الرئيسية" className="w-full h-auto" />
              </div>
              <div className="text-center mt-6">
                <h3 className="text-xl font-bold text-foreground">لوحة تحكم شاملة</h3>
                <p className="text-muted-foreground">كل ما تحتاجه في مكان واحد</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Grades Screenshot */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-border">
                  <img src={featureGrades} alt="إدخال الدرجات" className="w-full h-auto" />
                  <div className="p-5 bg-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-lg">إدخال الدرجات</h3>
                    </div>
                    <p className="text-muted-foreground">أدخل درجات طلابك بسرعة وسهولة</p>
                  </div>
                </div>
              </div>
              
              {/* Attendance Screenshot */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-success/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-border">
                  <img src={featureAttendance} alt="تسجيل الحضور" className="w-full h-auto" />
                  <div className="p-5 bg-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-lg">تسجيل الحضور</h3>
                    </div>
                    <p className="text-muted-foreground">سجل حضور وغياب طلابك بضغطة واحدة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* For Department Heads Section */}
      <div className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-secondary text-secondary-foreground border-0 text-sm px-4 py-1.5">
                <Building2 className="w-4 h-4 ml-2" />
                لرؤساء الأقسام
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                تابع فريقك بكل سهولة
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                أدوات متقدمة لمتابعة أداء المعلمين وتقارير شاملة عن جميع الصفوف تحت إشرافك
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'عرض تقارير شاملة لجميع المعلمين',
                  'متابعة درجات الطلاب في جميع المواد',
                  'إحصائيات ورسوم بيانية تفصيلية',
                  'تصدير البيانات بسهولة',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full gradient-secondary flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/department-head">
                <Button size="lg" className="gradient-secondary text-white border-0 h-14 px-8 hover:opacity-90 transition-opacity">
                  <Building2 className="ml-2 h-5 w-5" />
                  سجل كرئيس قسم
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="hidden md:block">
              <Card className="p-8 bg-card shadow-2xl border-0">
                <div className="space-y-5">
                  {[
                    { icon: Users, title: '25 معلم', subtitle: 'تحت إشرافك', color: 'from-primary to-secondary' },
                    { icon: TrendingUp, title: 'تقارير تفصيلية', subtitle: 'لجميع الصفوف', color: 'from-secondary to-success' },
                    { icon: Star, title: 'تقييم الأداء', subtitle: 'متابعة مستمرة', color: 'from-warning to-destructive' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-foreground">{item.title}</div>
                        <div className="text-muted-foreground">{item.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 px-4 gradient-hero relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
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
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-16 px-12 text-lg font-bold shadow-xl hover:scale-105 transition-all">
                <UserPlus className="ml-3 h-6 w-6" />
                سجل مجاناً الآن
                <ArrowLeft className="mr-3 h-5 w-5" />
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
              <div className="w-14 h-14 rounded-xl bg-muted p-2">
                <img src={logoUrl} alt="Teacher Hub" className="w-full h-full object-contain" />
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
