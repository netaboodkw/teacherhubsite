import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, ClipboardCheck, BarChart3, Sparkles, ArrowLeft } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const features = [
  {
    icon: Users,
    title: 'إدارة الطلاب',
    description: 'أضف طلابك بسهولة مع إمكانية الاستيراد الذكي من الصور',
  },
  {
    icon: ClipboardCheck,
    title: 'تتبع الحضور',
    description: 'سجل الحضور والغياب بضغطة واحدة',
  },
  {
    icon: BarChart3,
    title: 'الدرجات والتقارير',
    description: 'تابع أداء طلابك وأنشئ تقارير مفصلة',
  },
  {
    icon: Sparkles,
    title: 'الفصل التفاعلي',
    description: 'رتّب مقاعد الطلاب وسجل الملاحظات السلوكية',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <div 
        className="relative min-h-[70vh] flex items-center justify-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-background" />
        
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-background/20 backdrop-blur-sm mb-6">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
            TeacherHub
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
            منصة متكاملة لإدارة الفصول الدراسية، تتبع الحضور والدرجات، 
            وتسجيل الملاحظات السلوكية بكل سهولة
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/teacher">
              <Button size="lg" className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90 h-12 px-8 text-base">
                دخول المعلمين
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/department-head">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-background/50 text-primary-foreground hover:bg-background/20 h-12 px-8 text-base">
                دخول رؤساء الأقسام
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            كل ما يحتاجه المعلم في مكان واحد
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ابدأ الآن مجاناً
          </h2>
          <p className="text-muted-foreground mb-8">
            انضم لآلاف المعلمين الذين يستخدمون TeacherHub لإدارة صفوفهم بكفاءة
          </p>
          <Link to="/auth/teacher">
            <Button size="lg" className="gradient-hero h-12 px-8 text-base">
              ابدأ كمعلم
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 TeacherHub. جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
