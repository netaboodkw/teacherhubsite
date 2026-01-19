import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
              <p className="text-muted-foreground">آخر تحديث: يناير 2025</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                مقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                نحن في Teacher Hub نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام تطبيقنا.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                البيانات التي نجمعها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">معلومات الحساب:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>الاسم الكامل</li>
                  <li>البريد الإلكتروني</li>
                  <li>رقم الهاتف (اختياري)</li>
                  <li>اسم المدرسة (اختياري)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">بيانات الاستخدام:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>معلومات الفصول الدراسية</li>
                  <li>بيانات الطلاب (الأسماء، الدرجات، الحضور)</li>
                  <li>سجلات النشاط داخل التطبيق</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                كيف نستخدم بياناتك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>تقديم خدمات التطبيق وتحسينها</li>
                <li>إدارة حسابك وتوفير الدعم الفني</li>
                <li>إرسال إشعارات مهمة عن التطبيق</li>
                <li>تحليل استخدام التطبيق لتحسين الأداء</li>
                <li>حماية أمان التطبيق ومنع الاحتيال</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                حماية البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>نستخدم تشفير SSL لحماية البيانات أثناء النقل</li>
                <li>يتم تخزين البيانات في خوادم آمنة</li>
                <li>الوصول للبيانات مقيد بصلاحيات محددة</li>
                <li>لا نبيع أو نشارك بياناتك مع أطراف ثالثة</li>
                <li>بيانات البصمة/Face ID تُخزّن محلياً على جهازك فقط</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                حقوقك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>الوصول إلى بياناتك الشخصية</li>
                <li>تصحيح أو تحديث معلوماتك</li>
                <li>حذف حسابك وبياناتك</li>
                <li>تصدير بياناتك</li>
                <li>إلغاء الاشتراك في الإشعارات</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                تواصل معنا
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية، يمكنك التواصل معنا عبر:
              </p>
              <p className="mt-2 font-medium">support@teacherhub.app</p>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/terms" className="text-primary hover:underline">
              الشروط والأحكام
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
