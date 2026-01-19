import { useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  useSubscriptionPackages, 
  useMySubscription, 
  useSubscriptionSettings,
  useValidateDiscountCode,
  getSubscriptionStatus,
  type SubscriptionPackage,
  type DiscountCode
} from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Check, 
  Clock, 
  AlertTriangle, 
  Tag, 
  Loader2,
  Crown,
  BookOpen,
  Sparkles,
  Receipt,
  Calendar,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

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
  const validateDiscount = useValidateDiscountCode();
  
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch payments
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

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('الرجاء إدخال كود الخصم');
      return;
    }

    try {
      const discount = await validateDiscount.mutateAsync(discountCode);
      setAppliedDiscount(discount);
      toast.success('تم تطبيق كود الخصم بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'كود الخصم غير صالح');
      setAppliedDiscount(null);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const calculateFinalPrice = (pkg: SubscriptionPackage) => {
    if (!appliedDiscount) return pkg.price;
    
    if (appliedDiscount.discount_type === 'percentage') {
      return pkg.price - (pkg.price * appliedDiscount.discount_value / 100);
    }
    return Math.max(0, pkg.price - appliedDiscount.discount_value);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error('الرجاء اختيار باقة');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
        body: {
          action: 'initiate-payment',
          packageId: selectedPackage.id,
          discountCode: appliedDiscount?.code,
          callbackUrl: `${window.location.origin}/teacher/subscription/success`,
          errorUrl: `${window.location.origin}/teacher/subscription/error`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Redirect to payment page
      window.location.href = data.paymentUrl;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'حدث خطأ أثناء بدء عملية الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (subscriptionStatus.status) {
      case 'trial':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            فترة تجريبية - {subscriptionStatus.daysRemaining} يوم متبقي
          </Badge>
        );
      case 'trial_expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            انتهت الفترة التجريبية
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default" className="gap-1 bg-emerald-600">
            <Crown className="h-3 w-3" />
            مشترك - {subscriptionStatus.daysRemaining} يوم متبقي
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
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
          <Badge variant="default" className="gap-1 bg-emerald-600">
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Trial Period Banner - Show when user is in trial */}
        {subscriptionStatus.status === 'trial' && subscription?.trial_ends_at && (
          <Card className="border-amber-500 bg-amber-500/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-full bg-amber-500/20">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-700">أنت في الفترة التجريبية</h3>
                <p className="text-sm text-muted-foreground">
                  تنتهي الفترة التجريبية في{' '}
                  <span className="font-bold text-amber-700">{getTrialEndDate()}</span>
                  {' '}({subscriptionStatus.daysRemaining} يوم متبقي)
                </p>
              </div>
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 border-amber-300">
                <Calendar className="h-3 w-3" />
                {subscriptionStatus.daysRemaining} يوم
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <PageHeader
          icon={CreditCard}
          title="الاشتراك والمدفوعات"
          subtitle="اختر الباقة المناسبة لاحتياجاتك واستمتع بجميع مميزات النظام"
          iconVariant="success"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {getStatusBadge()}
              {subscriptionStatus.status === 'trial' && subscription?.trial_ends_at && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  تنتهي في: {getTrialEndDate()}
                </Badge>
              )}
            </div>
          }
        />

        {/* Tabs */}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
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
          <TabsContent value="packages" className="space-y-6 mt-6">
            {/* Read-only warning - only show when subscription is actually in read-only mode */}
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

            {/* Packages Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activePackages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const finalPrice = calculateFinalPrice(pkg);
                const hasDiscount = appliedDiscount && finalPrice < pkg.price;
                
                return (
                  <Card 
                    key={pkg.id}
                    className={`relative cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                    } ${pkg.courses_count === 2 ? 'md:scale-105 border-primary' : ''}`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.courses_count === 2 && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="gap-1 bg-primary">
                          <Sparkles className="h-3 w-3" />
                          الأكثر شيوعاً
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{pkg.name_ar}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="text-center space-y-4">
                      <div className="space-y-1">
                        {hasDiscount && (
                          <p className="text-lg text-muted-foreground line-through">
                            {pkg.price} د.ك
                          </p>
                        )}
                        <p className="text-3xl font-bold text-primary">
                          {finalPrice.toFixed(2)}
                          <span className="text-base font-normal text-muted-foreground mr-1">
                            د.ك
                          </span>
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>{pkg.courses_count} {pkg.courses_count === 1 ? 'كورس' : 'كورسات'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>جميع مميزات النظام</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>دعم فني متميز</span>
                        </li>
                      </ul>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={isSelected ? 'default' : 'outline'}
                      >
                        {isSelected ? 'تم الاختيار' : 'اختر هذه الباقة'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Discount Code & Checkout */}
            {selectedPackage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إتمام الشراء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Discount Code Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">كود الخصم (اختياري)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="أدخل كود الخصم"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          className="pr-10"
                          disabled={!!appliedDiscount}
                        />
                      </div>
                      {appliedDiscount ? (
                        <Button variant="outline" onClick={removeDiscount}>
                          إزالة
                        </Button>
                      ) : (
                        <Button 
                          variant="secondary" 
                          onClick={handleApplyDiscount}
                          disabled={validateDiscount.isPending}
                        >
                          {validateDiscount.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'تطبيق'
                          )}
                        </Button>
                      )}
                    </div>
                    {appliedDiscount && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        تم تطبيق خصم {appliedDiscount.discount_type === 'percentage' 
                          ? `${appliedDiscount.discount_value}%` 
                          : `${appliedDiscount.discount_value} د.ك`}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium">ملخص الطلب</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>الباقة</span>
                        <span className="font-medium">{selectedPackage.name_ar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>عدد الكورسات</span>
                        <span>{selectedPackage.courses_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>السعر الأصلي</span>
                        <span>{selectedPackage.price} د.ك</span>
                      </div>
                      {appliedDiscount && (
                        <div className="flex justify-between text-emerald-600">
                          <span>الخصم</span>
                          <span>- {(selectedPackage.price - calculateFinalPrice(selectedPackage)).toFixed(2)} د.ك</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>الإجمالي</span>
                        <span className="text-primary">{calculateFinalPrice(selectedPackage).toFixed(2)} د.ك</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        إتمام الدفع
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Empty State */}
            {activePackages.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">لا توجد باقات متاحة حالياً</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6">
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {payment.package?.name_ar || 'باقة اشتراك'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {payment.package?.courses_count} كورس
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                            <p className="text-xl font-bold text-primary">
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
                              <span>طريقة الدفع: {payment.payment_method}</span>
                            )}
                            {payment.paid_at && (
                              <span>تاريخ الدفع: {format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                            )}
                            {payment.payment_reference && (
                              <span>مرجع الدفع: {payment.payment_reference}</span>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد مدفوعات</h3>
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