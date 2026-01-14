import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, Sparkles, ArrowLeft, 
  FileSpreadsheet, Calendar, UserPlus, Shield, Bell, Printer, 
  Smartphone, Cloud, CheckCircle, Star, Gift, Building2, Camera, Eye
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
    color: 'bg-blue-500',
  },
  {
    icon: Camera,
    title: 'صور الطلاب',
    description: 'أضف صوراً لكل طالب لسهولة التعرف عليهم ومتابعتهم',
    color: 'bg-teal-500',
  },
  {
    icon: ClipboardCheck,
    title: 'تتبع الحضور',
    description: 'سجل الحضور والغياب بضغطة واحدة مع تقارير شاملة',
    color: 'bg-green-500',
  },
  {
    icon: BarChart3,
    title: 'الدرجات والتقارير',
    description: 'تابع أداء طلابك وأنشئ تقارير مفصلة قابلة للطباعة',
    color: 'bg-purple-500',
  },
  {
    icon: FileSpreadsheet,
    title: 'قوالب درجات مرنة',
    description: 'أنشئ قوالب تقييم مخصصة تناسب مادتك ومرحلتك الدراسية',
    color: 'bg-orange-500',
  },
  {
    icon: Sparkles,
    title: 'الفصل التفاعلي',
    description: 'رتّب مقاعد الطلاب وسجل الملاحظات السلوكية الإيجابية والسلبية',
    color: 'bg-pink-500',
  },
  {
    icon: Eye,
    title: 'متابعة رئيس القسم',
    description: 'يمكن لرئيس القسم متابعة أداء المعلمين والطلاب بشكل مستمر',
    color: 'bg-amber-500',
  },
  {
    icon: Calendar,
    title: 'جدولة الحصص',
    description: 'نظم جدول حصصك الأسبوعي مع تنبيهات ذكية',
    color: 'bg-cyan-500',
  },
  {
    icon: Printer,
    title: 'طباعة التقارير',
    description: 'اطبع كشوفات الدرجات والحضور بتصميم احترافي',
    color: 'bg-indigo-500',
  },
  {
    icon: Smartphone,
    title: 'متوافق مع الجوال',
    description: 'استخدم التطبيق من أي جهاز - جوال أو تابلت أو حاسوب',
    color: 'bg-rose-500',
  },
];

const highlights = [
  { icon: CheckCircle, text: 'سهل الاستخدام' },
  { icon: Cloud, text: 'بياناتك محفوظة بأمان' },
  { icon: Shield, text: 'خصوصية تامة' },
  { icon: Bell, text: 'تنبيهات ذكية' },
];

export default function Landing() {
  const { logoUrl } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  
  // Get trial days from settings, default to 10 if not set
  const trialDays = subscriptionSettings?.trial_days ?? 10;
  
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <div 
        className="relative min-h-[90vh] flex items-center justify-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-background" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-12">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-background/90 backdrop-blur-sm mb-8 shadow-2xl p-2 animate-logo-float">
            <img src={logoUrl} alt="Teacher Hub" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6">
            Teacher Hub
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4 leading-relaxed">
            المنصة الأولى لإدارة الفصول الدراسية في الخليج
          </p>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            نظام متكامل لإدارة الطلاب، تتبع الحضور والدرجات، 
            وتسجيل الملاحظات السلوكية بكل سهولة واحترافية
          </p>

          {/* Free Trial Badge */}
          <div className="mb-8">
            <Badge className="text-lg px-6 py-3 bg-background text-foreground shadow-lg">
              <Gift className="w-5 h-5 ml-2" />
              اشتراك مجاني لمدة {trialDays} يوم!
            </Badge>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-primary-foreground/90 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          
          {/* Login Buttons */}
          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            <Link to="/auth/teacher" className="w-full">
              <Button size="lg" className="w-full bg-background text-foreground hover:bg-background/90 h-14 text-lg shadow-xl">
                <GraduationCap className="ml-3 h-6 w-6" />
                دخول المعلمين
                <ArrowLeft className="mr-auto h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/department-head" className="w-full">
              <Button size="lg" className="w-full bg-background/20 backdrop-blur-sm border-2 border-background text-primary-foreground hover:bg-background/30 h-14 text-lg">
                <Building2 className="ml-3 h-6 w-6" />
                دخول رؤساء الأقسام
                <ArrowLeft className="mr-auto h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">معلم مسجل</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">صف دراسي</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">طالب</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">{trialDays}</div>
              <div className="text-sm text-muted-foreground">يوم تجربة مجانية</div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshots Section */}
      <div className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">شاهد التطبيق</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              تجربة استخدام احترافية
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              واجهة سهلة وبسيطة مصممة خصيصاً للمعلم العربي
            </p>
          </div>
          
          <div className="grid gap-8">
            {/* Dashboard Screenshot */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border">
              <img src={featureDashboard} alt="لوحة التحكم الرئيسية" className="w-full h-auto" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Grades Screenshot */}
              <div className="rounded-xl overflow-hidden shadow-xl border">
                <img src={featureGrades} alt="إدخال الدرجات" className="w-full h-auto" />
                <div className="p-4 bg-card text-center">
                  <h3 className="font-bold">إدخال الدرجات</h3>
                  <p className="text-sm text-muted-foreground">تتبع درجات طلابك بسهولة</p>
                </div>
              </div>
              
              {/* Attendance Screenshot */}
              <div className="rounded-xl overflow-hidden shadow-xl border">
                <img src={featureAttendance} alt="تسجيل الحضور" className="w-full h-auto" />
                <div className="p-4 bg-card text-center">
                  <h3 className="font-bold">تسجيل الحضور</h3>
                  <p className="text-sm text-muted-foreground">سجل الحضور بضغطة واحدة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">المميزات</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              كل ما يحتاجه المعلم في مكان واحد
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              نوفر لك جميع الأدوات اللازمة لإدارة صفك الدراسي باحترافية وسهولة
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* For Department Heads Section */}
      <div className="py-20 px-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-500">لرؤساء الأقسام</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                تابع معلميك وطلابك بكل سهولة
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                كرئيس قسم، يمكنك الاطلاع على أداء المعلمين ومتابعة درجات الطلاب 
                وإنشاء تقارير شاملة لجميع الصفوف تحت إشرافك
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>عرض تقارير شاملة لجميع المعلمين</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>متابعة درجات الطلاب في جميع المواد</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>إحصائيات ورسوم بيانية تفصيلية</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>تصدير البيانات بسهولة</span>
                </li>
              </ul>
              <Link to="/auth/department-head" className="inline-block mt-8">
                <Button size="lg" variant="outline" className="h-12">
                  <Building2 className="ml-2 h-5 w-5" />
                  سجل كرئيس قسم
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="hidden md:block">
              <Card className="p-6 bg-card shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-bold">15 معلم</div>
                      <div className="text-sm text-muted-foreground">تحت إشرافك</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <BarChart3 className="w-8 h-8 text-green-500" />
                    <div>
                      <div className="font-bold">تقارير تفصيلية</div>
                      <div className="text-sm text-muted-foreground">لجميع الصفوف</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Star className="w-8 h-8 text-yellow-500" />
                    <div>
                      <div className="font-bold">تقييم الأداء</div>
                      <div className="text-sm text-muted-foreground">متابعة مستمرة</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <Gift className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ابدأ الآن مجاناً لمدة {trialDays} يوم!
          </h2>
          <p className="text-lg opacity-90 mb-8">
            انضم لآلاف المعلمين الذين يستخدمون Teacher Hub لإدارة صفوفهم بكفاءة.
            لا حاجة لبطاقة ائتمان، سجل الآن واستمتع بجميع المميزات.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/teacher">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 h-14 px-10 text-lg">
                <UserPlus className="ml-2 h-5 w-5" />
                سجل كمعلم مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Teacher Hub" className="w-12 h-12 object-contain" />
              <span className="font-bold text-xl">Teacher Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Teacher Hub. جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
