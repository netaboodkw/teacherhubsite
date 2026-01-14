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
import { useSubscriptionSettings, useSubscriptionPackages } from '@/hooks/useSubscription';
import defaultLogo from '@/assets/logo.png';

const highlights = [
  { icon: Zap, text: 'سريع وسهل' },
  { icon: Cloud, text: 'بياناتك آمنة' },
  { icon: Shield, text: 'خصوصية تامة' },
  { icon: Smartphone, text: 'يعمل على كل الأجهزة' },
  { icon: Heart, text: 'صُنع في الكويت 🇰🇼' },
];

const stats = [
  { value: '500+', label: 'معلم كويتي', icon: GraduationCap },
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
    description: 'أضف طلابك بسهولة تامة مع إمكانية استيراد البيانات من ملفات Excel أو من صور قوائم الطلاب باستخدام الذكاء الاصطناعي. بالإضافة لترتيب الطلاب حسب مواقعهم الفعلية في الفصل الدراسي.',
    gradient: 'from-[#7DD3E1] to-[#5BC0CE]',
    benefits: [
      { icon: Upload, text: 'استيراد من Excel بضغطة واحدة' },
      { icon: FileImage, text: 'استخراج الأسماء من الصور بالذكاء الاصطناعي' },
      { icon: Layout, text: 'ترتيب الطلاب حسب مواقعهم في الصف' },
      { icon: Camera, text: 'إضافة صور الطلاب للتعرف عليهم' },
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
    description: 'أدخل درجات طلابك بسهولة مع دعم لجميع أنواع التقييمات. صمم نماذج الدرجات حسب المادة والمرحلة بطريقة سهلة وسريعة، مع إمكانية استيراد أي كشف درجات من خلال الذكاء الاصطناعي.',
    gradient: 'from-[#F5C78E] to-[#E8B77D]',
    benefits: [
      { icon: Settings, text: 'تصميم نماذج درجات حسب المادة والمرحلة' },
      { icon: Upload, text: 'استيراد كشف الدرجات بالذكاء الاصطناعي' },
      { icon: Target, text: 'حساب المعدلات التلقائي' },
      { icon: Download, text: 'تصدير الدرجات للطباعة' },
    ],
    color: '#E8B77D',
  },
  {
    id: 'templates',
    icon: FileSpreadsheet,
    title: 'قوالب التقييم المخصصة',
    subtitle: 'صمم نظام تقييمك الخاص',
    description: 'أنشئ قوالب تقييم مخصصة تناسب مادتك ومرحلتك الدراسية بسرعة فائقة. حدد الأوزان والدرجات حسب متطلبات وزارة التربية أو حسب رغبتك الشخصية.',
    gradient: 'from-[#7DD3E1] to-[#C9A8D6]',
    benefits: [
      { icon: Zap, text: 'إنشاء قوالب بسرعة وسهولة' },
      { icon: Layers, text: 'فترات متعددة (أسابيع، شهور، فصول)' },
      { icon: Target, text: 'أوزان مخصصة لكل نوع تقييم' },
      { icon: BookOpen, text: 'قوالب جاهزة حسب المرحلة' },
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
    icon: PieChart,
    title: 'الإحصائيات والتقارير الذكية',
    subtitle: 'تحليل شامل لأداء طلابك',
    description: 'احصل على إحصائيات وتقارير ذكية شاملة: أفضل الطلاب من ناحية الدرجات والسلوك، أفضل الفصول أداءً، نسبة التفاعل والحضور، وتحليلات متقدمة تساعدك على اتخاذ القرارات الصحيحة.',
    gradient: 'from-[#C9A8D6] to-[#F5C78E]',
    benefits: [
      { icon: Award, text: 'ترتيب أفضل الطلاب درجاتًا وسلوكًا' },
      { icon: TrendingUp, text: 'أفضل الفصول ونسبة التفاعل' },
      { icon: BarChart3, text: 'إحصائيات الحضور والغياب' },
      { icon: Printer, text: 'تقارير جاهزة للطباعة والمشاركة' },
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
  const { data: packages = [] } = useSubscriptionPackages();
  
  const trialDays = subscriptionSettings?.trial_days ?? 10;
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;
  const activePackages = packages.filter(p => p.is_active).sort((a, b) => a.display_order - b.display_order);
  
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

      {/* Testimonials Section - Kuwait Users */}
      <div className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#7DD3E1]/20 text-[#4AA8B8] border-0 text-sm px-4 py-1.5">
              <Star className="w-4 h-4 ml-2" />
              آراء المستخدمين
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              ماذا يقول مستخدمونا في الكويت؟ 🇰🇼
            </h2>
            <p className="text-muted-foreground text-lg">
              تجارب حقيقية من معلمين ورؤساء أقسام يستخدمون المنصة يومياً
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "المنصة غيّرت طريقة عملي بالكامل! الآن أنجز كل شيء في دقائق معدودة."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7DD3E1] to-[#5BC0CE] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. فاطمة الكندري</p>
                    <p className="text-xs text-muted-foreground">معلمة رياضيات</p>
                    <p className="text-xs text-[#5BC0CE]">منذ شهر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "ميزة استيراد الطلاب من الصور وفرت علي وقتاً كثيراً. أنصح كل معلم بتجربتها!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A8D6] to-[#B897C5] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. محمد العنزي</p>
                    <p className="text-xs text-muted-foreground">معلم علوم</p>
                    <p className="text-xs text-[#5BC0CE]">منذ أسبوعين</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "التقارير الجاهزة للطباعة ممتازة جداً. واجهة تفهم احتياجات المعلم الكويتي."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5C78E] to-[#E8B77D] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. نورة الشمري</p>
                    <p className="text-xs text-muted-foreground">معلمة لغة عربية</p>
                    <p className="text-xs text-[#5BC0CE]">منذ 10 أيام</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 4 - Department Head */}
            <Card className="border-0 shadow-lg bg-card ring-2 ring-[#C9A8D6]/30">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "كرئيس قسم، أستطيع متابعة جميع معلمي القسم وأداء طلابهم بسهولة تامة!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A8D6] to-[#8B6B99] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. عبدالله المطيري</p>
                    <p className="text-xs text-[#8B6B99] font-medium">رئيس قسم العلوم</p>
                    <p className="text-xs text-[#5BC0CE]">منذ 3 أسابيع</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 5 */}
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "تسجيل الحضور أصبح أسهل بكثير! أنهي الحصة وأنا مرتاحة من الأعمال الورقية."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5BC0CE] to-[#7DD3E1] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. مريم الفضلي</p>
                    <p className="text-xs text-muted-foreground">معلمة إنجليزي</p>
                    <p className="text-xs text-[#5BC0CE]">منذ شهرين</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 6 */}
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "قوالب الدرجات المخصصة ممتازة! أنشأت قالباً يناسب مادتي تماماً."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8B77D] to-[#F5C78E] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. أحمد الرشيدي</p>
                    <p className="text-xs text-muted-foreground">معلم تربية إسلامية</p>
                    <p className="text-xs text-[#5BC0CE]">منذ 5 أيام</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 7 - Department Head */}
            <Card className="border-0 shadow-lg bg-card ring-2 ring-[#C9A8D6]/30">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "التقارير الشاملة تساعدني في تقييم أداء الفريق بشكل موضوعي ودقيق."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B6B99] to-[#C9A8D6] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. سارة العجمي</p>
                    <p className="text-xs text-[#8B6B99] font-medium">رئيسة قسم الرياضيات</p>
                    <p className="text-xs text-[#5BC0CE]">منذ شهر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial 8 */}
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#F5C78E] fill-[#F5C78E]" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">
                  "الفصل الافتراضي رائع! أستطيع ترتيب المقاعد وتسجيل ملاحظات السلوك بسهولة."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7DD3E1] to-[#5BC0CE] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">أ. خالد الهاجري</p>
                    <p className="text-xs text-muted-foreground">معلم اجتماعيات</p>
                    <p className="text-xs text-[#5BC0CE]">منذ أسبوع</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      {activePackages.length > 0 && (
        <div className="py-20 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-[#F5C78E]/20 text-[#D4A574] border-0 text-sm px-4 py-1.5">
                <Award className="w-4 h-4 ml-2" />
                خطط الأسعار
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                اختر الباقة المناسبة لك
              </h2>
              <p className="text-muted-foreground text-lg">
                جميع الباقات تشمل تجربة مجانية لمدة {trialDays} يوم
              </p>
            </div>
            
            <div className={`grid gap-6 ${activePackages.length === 1 ? 'max-w-md mx-auto' : activePackages.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
              {activePackages.map((pkg, index) => (
                <Card 
                  key={pkg.id} 
                  className={`border-0 shadow-lg hover:shadow-xl transition-all ${index === 1 && activePackages.length === 3 ? 'ring-2 ring-[#5BC0CE] scale-105' : ''}`}
                >
                  {index === 1 && activePackages.length === 3 && (
                    <div className="bg-gradient-to-r from-[#5BC0CE] to-[#7DD3E1] text-white text-center py-2 text-sm font-bold rounded-t-lg">
                      الأكثر شيوعاً
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2 text-foreground">{pkg.name_ar}</h3>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                      )}
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-[#5BC0CE]">{pkg.price}</span>
                        <span className="text-muted-foreground">{pkg.currency}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {pkg.courses_count} {pkg.courses_count === 1 ? 'فصل دراسي' : 'فصول دراسية'}
                      </p>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {[
                        'إدارة كاملة للطلاب',
                        'تسجيل الحضور والغياب',
                        'نظام الدرجات المتكامل',
                        'تقارير وإحصائيات',
                        'دعم فني متواصل',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle className="w-4 h-4 text-[#5BC0CE]" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Link to="/auth/teacher">
                      <Button 
                        className={`w-full h-12 font-bold ${index === 1 && activePackages.length === 3 
                          ? 'bg-gradient-to-r from-[#5BC0CE] to-[#7DD3E1] text-white hover:opacity-90' 
                          : 'bg-muted text-foreground hover:bg-muted/80'}`}
                      >
                        ابدأ التجربة المجانية
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <p className="text-center text-muted-foreground text-sm mt-8">
              * جميع الأسعار بالدينار الكويتي - بدون رسوم خفية
            </p>
          </div>
        </div>
      )}

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
                <p className="text-sm text-muted-foreground">منصة المعلم الذكي 🇰🇼</p>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                منصة كويتية صُممت للمعلم في الكويت
              </p>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Teacher Hub. جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
