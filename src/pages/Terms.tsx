import { Link } from 'react-router-dom';
import { ArrowRight, FileText, CheckCircle, XCircle, AlertTriangle, Scale, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" dir="rtl">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">الشروط والأحكام</h1>
              <p className="text-muted-foreground">آخر تحديث: يناير 2025</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                مقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                مرحباً بك في Teacher Hub. باستخدامك لهذا التطبيق، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل الاستخدام.
              </p>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                الاستخدام المقبول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>استخدام التطبيق للأغراض التعليمية المشروعة</li>
                <li>إدخال بيانات صحيحة ودقيقة</li>
                <li>الحفاظ على سرية معلومات تسجيل الدخول</li>
                <li>احترام خصوصية بيانات الطلاب</li>
                <li>الالتزام بقوانين حماية البيانات المحلية</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prohibited Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                الاستخدام المحظور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>مشاركة حسابك مع آخرين</li>
                <li>استخدام التطبيق لأغراض غير قانونية</li>
                <li>محاولة اختراق أو تعطيل التطبيق</li>
                <li>نسخ أو توزيع محتوى التطبيق دون إذن</li>
                <li>إدخال بيانات مضللة أو كاذبة</li>
              </ul>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                الاشتراك والدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>يتوفر التطبيق بفترة تجريبية مجانية</li>
                <li>بعد انتهاء الفترة التجريبية، يلزم الاشتراك للاستمرار</li>
                <li>أسعار الاشتراك قابلة للتغيير مع إشعار مسبق</li>
                <li>لا يتم استرداد المبالغ المدفوعة إلا في حالات خاصة</li>
                <li>يمكن إلغاء الاشتراك في أي وقت</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                إخلاء المسؤولية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>التطبيق مقدم "كما هو" دون ضمانات</li>
                <li>لا نتحمل مسؤولية فقدان البيانات الناتج عن سوء الاستخدام</li>
                <li>لا نضمن توفر الخدمة بشكل متواصل 100%</li>
                <li>المستخدم مسؤول عن صحة البيانات المدخلة</li>
                <li>ننصح بالاحتفاظ بنسخ احتياطية من البيانات المهمة</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                التعديلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد التعديلات يعني موافقتك عليها.
              </p>
            </CardContent>
          </Card>

          {/* Agreement */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-center">
                باستخدامك لتطبيق Teacher Hub، فإنك توافق على هذه الشروط والأحكام و
                <Link to="/privacy" className="text-primary hover:underline mx-1">
                  سياسة الخصوصية
                </Link>
                الخاصة بنا.
              </p>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/privacy" className="text-primary hover:underline">
              سياسة الخصوصية
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/" className="text-primary hover:underline">
              الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
