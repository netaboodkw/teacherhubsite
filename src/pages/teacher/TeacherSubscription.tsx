import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  useSubscriptionPackages, 
  useMySubscription, 
  useSubscriptionSettings,
  getSubscriptionStatus,
} from '@/hooks/useSubscription';
import { useSubscriptionRealtime } from '@/hooks/useSubscriptionRealtime';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Check, 
  Clock, 
  AlertTriangle, 
  Loader2,
  Crown,
  Receipt,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  GraduationCap,
  FileText,
  MessageCircle,
  Globe,
  Headphones,
  ExternalLink
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  original_amount: number;
  discount_amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  invoice_id: string | null;
  created_at: string;
  paid_at: string | null;
  package: {
    name_ar: string;
    courses_count: number;
  } | null;
}

export default function TeacherSubscription() {
  const { data: packages, isLoading: packagesLoading } = useSubscriptionPackages();
  const { data: subscription, isLoading: subscriptionLoading } = useMySubscription();
  const { data: settings } = useSubscriptionSettings();

  // Enable realtime updates for subscription status
  useSubscriptionRealtime();
  
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          package:subscription_packages(name_ar, courses_count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const subscriptionStatus = getSubscriptionStatus(subscription, settings);
  const activePackages = packages?.filter(p => p.is_active) || [];
  
  // Check if user has active subscription
  const hasActiveSubscription = subscriptionStatus.status === 'active';

  const getStatusBadge = () => {
    switch (subscriptionStatus.status) {
      case 'trial':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 border-amber-300 text-xs px-2 py-0.5">
            <Clock className="h-3 w-3" />
            تجريبي - {subscriptionStatus.daysRemaining} يوم
          </Badge>
        );
      case 'trial_expired':
        return (
          <Badge variant="destructive" className="gap-1 text-xs px-2 py-0.5">
            <AlertTriangle className="h-3 w-3" />
            انتهت التجربة
          </Badge>
        );
      case 'active':
        return (
          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs px-2 py-0.5">
            <Crown className="h-3 w-3" />
            مشترك - {subscriptionStatus.daysRemaining} يوم
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1 text-xs px-2 py-0.5">
            <AlertTriangle className="h-3 w-3" />
            انتهى الاشتراك
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="gap-1 bg-emerald-600">
            <CheckCircle className="h-3 w-3" />
            مكتمل
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            قيد الانتظار
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            فشل
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (packagesLoading || subscriptionLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  // Format trial end date
  const getTrialEndDate = () => {
    if (subscription?.trial_ends_at) {
      return format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: ar });
    }
    return null;
  };

  return (
    <TeacherLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section - Only show if not active subscription */}
        {!hasActiveSubscription && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">الاشتراك السنوي</h1>
                    <p className="text-primary-foreground/80">استمتع بجميع مميزات النظام</p>
                  </div>
                </div>
                {subscriptionStatus.status === 'trial' && subscription?.trial_ends_at && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
                    <Clock className="h-5 w-5" />
                    <span>
                      الفترة التجريبية تنتهي في <strong>{getTrialEndDate()}</strong>
                    </span>
                    <Badge variant="secondary" className="bg-white/20 border-0">
                      {subscriptionStatus.daysRemaining} يوم
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Read-only warning */}
        {subscription?.is_read_only && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive">حسابك في وضع القراءة فقط</h3>
                <p className="text-sm text-muted-foreground">
                  يمكنك عرض بياناتك فقط. اشترك الآن للاستمرار في استخدام جميع المميزات.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active subscription banner */}
        {hasActiveSubscription && (
          <Card className="border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">أنت مشترك حالياً</h3>
                  <p className="text-emerald-600 dark:text-emerald-300">
                    لديك صلاحية كاملة للوصول لجميع مميزات النظام
                  </p>
                  {subscription?.subscription_ends_at && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        ينتهي الاشتراك في: {format(new Date(subscription.subscription_ends_at), 'dd MMMM yyyy', { locale: ar })}
                      </span>
                      <Badge variant="secondary" className="bg-emerald-200 text-emerald-700 border-0">
                        {subscriptionStatus.daysRemaining} يوم متبقي
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-white/50 dark:bg-white/10 rounded-xl">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">صلاحية كاملة</span>
                </div>
              </div>
              
              {/* Features list */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>صفوف غير محدودة</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>طلاب غير محدودين</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>تقارير شاملة</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>دعم فني</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={hasActiveSubscription ? "payments" : "packages"} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="packages" className="gap-2">
              <CreditCard className="h-4 w-4" />
              الباقات
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <Receipt className="h-4 w-4" />
              سجل المدفوعات
            </TabsTrigger>
          </TabsList>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-8 mt-8">
            {/* How to Subscribe Card */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">كيفية الاشتراك</CardTitle>
                <CardDescription className="text-base">
                  يمكنك تفعيل اشتراكك لمدة سنة كاملة بإحدى الطريقتين التاليتين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Option 1: Contact Support */}
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                        <Headphones className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg">تواصل مع الدعم الفني</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-sm text-muted-foreground">
                        تواصل معنا وسنقوم بتفعيل اشتراكك يدوياً
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="outline" className="gap-2">
                          <Link to="/teacher/support">
                            <MessageCircle className="h-4 w-4" />
                            فتح محادثة دعم
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Option 2: Website */}
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                        <Globe className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-lg">الاشتراك عبر الموقع</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-sm text-muted-foreground">
                        قم بزيارة موقعنا للاشتراك بسهولة
                      </p>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => window.open('https://teacherhub.site/subscribe', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        زيارة الموقع
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <Star className="h-4 w-4 inline ml-1" />
                    بعد الاشتراك، سيتم تفعيل حسابك تلقائياً وستتمتع بجميع المميزات لمدة سنة كاملة
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Packages Grid - Show as info only */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">الباقات المتاحة</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activePackages.map((pkg, index) => {
                  const isPopular = index === 1 || pkg.courses_count === 2;
                  
                  return (
                    <Card 
                      key={pkg.id}
                      className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="gap-1 bg-primary shadow-lg">
                            <Star className="h-3 w-3 fill-current" />
                            الأكثر شيوعاً
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pt-8 pb-4">
                        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                          isPopular ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                        }`}>
                          <GraduationCap className={`h-8 w-8 ${isPopular ? '' : 'text-primary'}`} />
                        </div>
                        <CardTitle className="text-xl">{pkg.name_ar}</CardTitle>
                        <CardDescription className="text-base">{pkg.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="text-center space-y-6">
                        {/* Price */}
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-primary">
                              {pkg.price.toFixed(0)}
                            </span>
                            <span className="text-lg text-muted-foreground">.{(pkg.price % 1).toFixed(2).slice(2)}</span>
                            <span className="text-base font-normal text-muted-foreground mr-1">
                              د.ك
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            لمدة {pkg.courses_count} {pkg.courses_count === 1 ? 'كورس' : 'كورسات'}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        {/* Features List */}
                        <ul className="space-y-3 text-sm text-right">
                          <li className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span>{pkg.courses_count} {pkg.courses_count === 1 ? 'كورس دراسي' : 'كورسات دراسية'}</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span>عدد غير محدود من الصفوف</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span>عدد غير محدود من الطلاب</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span>تسجيل الحضور والدرجات</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span>تقارير شاملة وتصدير البيانات</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span>دعم فني على مدار الساعة</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Empty State */}
            {activePackages.length === 0 && (
              <Card className="text-center py-16 border-dashed">
                <CardContent>
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد باقات متاحة</h3>
                  <p className="text-muted-foreground">لا توجد باقات متاحة حالياً، يرجى المحاولة لاحقاً</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-8">
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {payment.package?.name_ar || 'باقة اشتراك'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {payment.package?.courses_count} كورس
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mr-15">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(payment.created_at), 'dd MMMM yyyy', { locale: ar })}
                            </span>
                            {payment.invoice_id && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                رقم الفاتورة: {payment.invoice_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {getPaymentStatusBadge(payment.status)}
                          <div className="text-left">
                            {payment.discount_amount > 0 && (
                              <p className="text-sm text-muted-foreground line-through">
                                {payment.original_amount.toFixed(2)} د.ك
                              </p>
                            )}
                            <p className="text-2xl font-bold text-primary">
                              {payment.amount.toFixed(2)} د.ك
                            </p>
                          </div>
                        </div>
                      </div>

                      {(payment.payment_method || payment.paid_at) && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {payment.payment_method && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                طريقة الدفع: {payment.payment_method}
                              </span>
                            )}
                            {payment.paid_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                تاريخ الدفع: {format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                              </span>
                            )}
                            {payment.payment_reference && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                مرجع الدفع: {payment.payment_reference}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-dashed">
                <CardContent>
                  <Receipt className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد مدفوعات</h3>
                  <p className="text-muted-foreground">لم تقم بأي عمليات دفع بعد</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
