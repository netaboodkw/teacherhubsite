import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Users, ClipboardCheck, BarChart3, Sparkles, ArrowLeft, 
  FileSpreadsheet, Calendar, UserPlus, Shield, Printer, 
  Smartphone, Cloud, CheckCircle, Star, Gift, Building2, Camera,
  Zap, Award, TrendingUp, Heart, LogIn, Upload, FileImage, 
  PieChart, Download, Bell, Clock, Layers, Target, Palette,
  BookOpen, MessageSquare, ThumbsUp, ThumbsDown, Layout, Settings
} from 'lucide-react';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSubscriptionSettings } from '@/hooks/useSubscription';
import defaultLogo from '@/assets/logo.png';

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

// Detailed features with full descriptions
const detailedFeatures = [
  {
    id: 'students',
    icon: Users,
    title: 'إدارة الطلاب الذكية',
    subtitle: 'كل بيانات طلابك في مكان واحد',
    description: 'أضف طلابك بسهولة تامة مع إمكانية استيراد البيانات من ملفات Excel أو حتى من صور قوائم الطلاب باستخدام الذكاء الاصطناعي.',
    gradient: 'from-[#7DD3E1] to-[#5BC0CE]',
    benefits: [
      { icon: Upload, text: 'استيراد من Excel بضغطة واحدة' },
      { icon: FileImage, text: 'استخراج الأسماء من الصور بالذكاء الاصطناعي' },
      { icon: Camera, text: 'إضافة صور الطلاب للتعرف عليهم' },
      { icon: MessageSquare, text: 'ملاحظات خاصة لكل طالب' },
    ],
    color: '#5BC0CE',
  },
  {
    id: 'attendance',
    icon: ClipboardCheck,
    title: 'تسجيل الحضور السريع',
    subtitle: 'وداعاً للدفاتر الورقية',
    description: 'سجل حضور وغياب طلابك بضغطة واحدة فقط. نظام ذكي يحفظ السجلات ويولد تقارير شاملة تلقائياً.',
    gradient: 'from-[#C9A8D6] to-[#B897C5]',
    benefits: [
      { icon: Zap, text: 'تسجيل فوري بضغطة واحدة' },
      { icon: Calendar, text: 'سجل كامل لكل يوم ومادة' },
      { icon: PieChart, text: 'إحصائيات الحضور التفصيلية' },
      { icon: Bell, text: 'تنبيهات للغياب المتكرر' },
    ],
    color: '#B897C5',
  },
  {
    id: 'grades',
    icon: BarChart3,
    title: 'نظام الدرجات المتكامل',
    subtitle: 'تقييم شامل ودقيق',
    description: 'أدخل درجات طلابك بسهولة مع دعم لجميع أنواع التقييمات: اختبارات، واجبات، مشاركة، سلوك، وأكثر.',
    gradient: 'from-[#F5C78E] to-[#E8B77D]',
    benefits: [
      { icon: Layers, text: 'أنواع تقييم متعددة ومرنة' },
      { icon: Target, text: 'حساب المعدلات التلقائي' },
      { icon: TrendingUp, text: 'متابعة تطور الطالب' },
      { icon: Download, text: 'تصدير الدرجات للطباعة' },
    ],
    color: '#E8B77D',
  },
  {
    id: 'templates',
    icon: FileSpreadsheet,
    title: 'قوالب التقييم المخصصة',
    subtitle: 'صمم نظام تقييمك الخاص',
    description: 'أنشئ قوالب تقييم مخصصة تناسب مادتك ومرحلتك الدراسية. حدد الأوزان والدرجات حسب متطلباتك.',
    gradient: 'from-[#7DD3E1] to-[#C9A8D6]',
    benefits: [
      { icon: Settings, text: 'تخصيص كامل للقوالب' },
      { icon: Layers, text: 'فترات متعددة (أسابيع، شهور)' },
      { icon: Target, text: 'أوزان مخصصة لكل نوع' },
      { icon: BookOpen, text: 'قوالب جاهزة للاستخدام' },
    ],
    color: '#7DD3E1',
  },
  {
    id: 'classroom',
    icon: Layout,
    title: 'الفصل الافتراضي التفاعلي',
    subtitle: 'نظم فصلك كما تريد',
    description: 'رتّب مقاعد الطلاب في الفصل الافتراضي بالسحب والإفلات. سجل ملاحظات سلوكية إيجابية وسلبية لكل طالب.',
    gradient: 'from-[#5BC0CE] to-[#7DD3E1]',
    benefits: [
      { icon: Palette, text: 'ترتيب المقاعد بالسحب والإفلات' },
      { icon: ThumbsUp, text: 'ملاحظات سلوكية إيجابية' },
      { icon: ThumbsDown, text: 'ملاحظات سلوكية سلبية' },
      { icon: Star, text: 'نظام النقاط والمكافآت' },
    ],
    color: '#5BC0CE',
  },
  {
    id: 'reports',
    icon: Printer,
    title: 'تقارير احترافية جاهزة للطباعة',
    subtitle: 'تقارير بضغطة زر',
    description: 'أنشئ تقارير شاملة واحترافية جاهزة للطباعة أو المشاركة. تقارير فردية لكل طالب أو تقارير شاملة للفصل.',
    gradient: 'from-[#C9A8D6] to-[#F5C78E]',
    benefits: [
      { icon: FileSpreadsheet, text: 'تقارير فردية لكل طالب' },
      { icon: Users, text: 'تقارير شاملة للفصل' },
      { icon: Download, text: 'تصدير PDF و Excel' },
      { icon: Printer, text: 'جاهزة للطباعة المباشرة' },
    ],
    color: '#C9A8D6',
  },
];

const additionalFeatures = [
  { icon: Calendar, title: 'جدولة الحصص', description: 'نظم جدول حصصك الأسبوعي' },
  { icon: Bell, title: 'تنبيهات ذكية', description: 'تذكيرات للمهام المهمة' },
  { icon: Cloud, title: 'حفظ تلقائي', description: 'بياناتك محفوظة دائماً' },
  { icon: Smartphone, title: 'يعمل على الجوال', description: 'استخدمه من أي جهاز' },
  { icon: Shield, title: 'أمان وخصوصية', description: 'بياناتك في أمان تام' },
  { icon: Clock, title: 'توفير الوقت', description: 'أنجز عملك بسرعة' },
];

export default function Landing() {
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const { data: subscriptionSettings } = useSubscriptionSettings();
  
  const trialDays = subscriptionSettings?.trial_days ?? 10;
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7DD3E1] via-[#5BC0CE] to-[#4AA8B8]" />
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#F5C78E]/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#C9A8D6]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Login Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link to="/auth/teacher">
            <Button size="lg" className="bg-white/95 text-[#5BC0CE] hover:bg-white hover:text-[#4AA8B8] font-bold shadow-lg border-0 h-12 px-6 transition-all hover:scale-105">
              <LogIn className="ml-2 h-5 w-5" />
              تسجيل الدخول
            </Button>
          </Link>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-16">
          <div className="inline-flex items-center justify-center w-48 h-48 md:w-60 md:h-60 rounded-[2rem] bg-white backdrop-blur-sm mb-10 shadow-2xl p-6 ring-4 ring-white/40">
            <img src={displayLogo} alt="Teacher Hub" className="w-full h-full object-contain drop-shadow-md" onError={(e) => { e.currentTarget.src = defaultLogo; }} />
          </div>
          
          <p className="text-2xl md:text-3xl text-white/95 mb-4 font-medium">منصة المعلم الذكي</p>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            نظام متكامل لإدارة الفصول الدراسية، تتبع الحضور والدرجات، وتقارير احترافية بضغطة زر
          </p>

          <div className="mb-10">
            <Badge className="text-xl px-8 py-4 bg-white text-[#5BC0CE] shadow-xl border-0 hover:bg-white hover:text-[#4AA8B8] transition-all cursor-default">
              <Gift className="w-6 h-6 ml-3 animate-bounce" />
              تجربة مجانية لمدة {trialDays} يوم!
            </Badge>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/25 hover:bg-white/25 transition-colors">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <Link to="/auth/teacher" className="w-full">
              <Button size="lg" className="w-full bg-white text-[#5BC0CE] hover:bg-white/95 hover:text-[#4AA8B8] h-16 text-lg font-bold shadow-xl hover:scale-105 transition-all border-0">
                <GraduationCap className="ml-3 h-6 w-6" />
                ابدأ تجربتك المجانية الآن
                <ArrowLeft className="mr-auto h-5 w-5" />
              </Button>
            </Link>
            <p className="text-white/80 text-sm">بدون بطاقة ائتمان • إلغاء في أي وقت</p>
          </div>
        </div>
        
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

      {/* Why Choose Us */}
      <div className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-[#7DD3E1]/20 text-[#4AA8B8] border-0 text-sm px-4 py-1.5">
            <Sparkles className="w-4 h-4 ml-2" />
            لماذا Teacher Hub؟
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            وفّر وقتك وجهدك وركّز على التعليم
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            صُممت المنصة خصيصاً للمعلم العربي لتساعدك على إدارة صفوفك بكفاءة عالية. 
            بدلاً من قضاء ساعات في الأعمال الإدارية، استخدم وقتك في ما تحبه: التعليم!
          </p>
          <Link to="/auth/teacher">
            <Button size="lg" className="bg-[#5BC0CE] hover:bg-[#4AA8B8] text-white h-14 px-8 text-lg font-bold shadow-lg">
              <Gift className="ml-2 h-5 w-5" />
              جرّب مجاناً لمدة {trialDays} يوم
            </Button>
          </Link>
        </div>
      </div>

      {/* Detailed Features Sections */}
      {detailedFeatures.map((feature, index) => (
        <div 
          key={feature.id} 
          className={`py-20 px-4 ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}
        >
          <div className="max-w-6xl mx-auto">
            <div className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              {/* Content */}
              <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                <div 
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                  {feature.title}
                </h2>
                <p className="text-xl text-muted-foreground mb-4">{feature.subtitle}</p>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {feature.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <benefit.icon className="w-5 h-5" style={{ color: feature.color }} />
                      </div>
                      <span className="text-foreground font-medium">{benefit.text}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/auth/teacher">
                  <Button 
                    size="lg" 
                    className="h-12 px-6 text-white border-0 shadow-md hover:opacity-90"
                    style={{ backgroundColor: feature.color }}
                  >
                    جرّب هذه الميزة مجاناً
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Visual Card */}
              <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <div 
                    className={`h-3 bg-gradient-to-r ${feature.gradient}`}
                  />
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {/* Simulated UI Elements */}
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                        <div 
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
                        >
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted/70 rounded w-1/2" />
                        </div>
                      </div>
                      
                      {feature.benefits.slice(0, 3).map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <CheckCircle className="w-5 h-5" style={{ color: feature.color }} />
                          <span className="text-sm text-muted-foreground">{benefit.text}</span>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">جاهز للاستخدام</span>
                          <Badge style={{ backgroundColor: `${feature.color}20`, color: feature.color }} className="border-0">
                            مفعّل
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Mini CTA */}
      <div className="py-16 px-4 bg-gradient-to-r from-[#7DD3E1] to-[#5BC0CE]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            هل أنت جاهز لتجربة كل هذه المميزات؟
          </h3>
          <p className="text-white/90 text-lg mb-6">
            ابدأ تجربتك المجانية الآن واكتشف كيف يمكن لـ Teacher Hub تسهيل عملك
          </p>
          <Link to="/auth/teacher">
            <Button size="lg" className="bg-white text-[#5BC0CE] hover:bg-white/95 hover:text-[#4AA8B8] h-14 px-10 text-lg font-bold shadow-xl hover:scale-105 transition-all border-0">
              <Gift className="ml-2 h-5 w-5" />
              ابدأ مجاناً - {trialDays} يوم تجربة
            </Button>
          </Link>
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#F5C78E]/20 text-[#D4A574] border-0 text-sm px-4 py-1.5">
              <Award className="w-4 h-4 ml-2" />
              مميزات إضافية
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              وأكثر من ذلك بكثير!
            </h2>
            <p className="text-muted-foreground text-lg">
              مميزات متنوعة لتجربة استخدام متكاملة
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {additionalFeatures.map((feature, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-card text-center">
                <CardContent className="p-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7DD3E1]/20 to-[#5BC0CE]/20 flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-[#5BC0CE]" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial/Trust Section */}
      <div className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-8 h-8 text-[#F5C78E] fill-[#F5C78E]" />
            ))}
          </div>
          <h3 className="text-2xl font-bold mb-4 text-foreground">
            "المنصة غيّرت طريقة عملي بالكامل!"
          </h3>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            "كنت أقضي ساعات في تنظيم الدرجات وتسجيل الحضور. الآن أنجز كل شيء في دقائق معدودة. 
            شكراً Teacher Hub على هذه المنصة الرائعة!"
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7DD3E1] to-[#5BC0CE] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">معلم من السعودية</p>
              <p className="text-sm text-muted-foreground">مستخدم منذ 6 أشهر</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 px-4 bg-gradient-to-br from-[#7DD3E1] via-[#5BC0CE] to-[#4AA8B8] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-40 h-40 bg-[#F5C78E]/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 bg-[#C9A8D6]/15 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            ابدأ رحلتك الآن!
          </h2>
          <p className="text-xl text-white/90 mb-4">
            انضم لمئات المعلمين الذين يديرون صفوفهم بكفاءة
          </p>
          <p className="text-lg text-white/80 mb-8">
            ✓ تجربة مجانية {trialDays} يوم &nbsp;&nbsp; ✓ بدون بطاقة ائتمان &nbsp;&nbsp; ✓ إلغاء في أي وقت
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

      {/* For Department Heads Section */}
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
