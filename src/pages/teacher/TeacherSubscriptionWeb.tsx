import { useState, useRef, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  useSubscriptionPackages, 
  useMySubscription, 
  useSubscriptionSettings,
  useValidateDiscountCode,
  getSubscriptionStatus,
} from '@/hooks/useSubscription';
import { useSubscriptionRealtime } from '@/hooks/useSubscriptionRealtime';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
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
  Tag,
  Percent,
} from 'lucide-react';
import knetLogo from '@/assets/knet-logo.png';

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

/**
 * Web version of subscription page - With full MyFatoorah payment integration
 */
export default function TeacherSubscriptionWeb() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  const { data: packages, isLoading: packagesLoading } = useSubscriptionPackages();
  const { data: subscription, isLoading: subscriptionLoading } = useMySubscription();
  const { data: settings } = useSubscriptionSettings();
  const validateDiscount = useValidateDiscountCode();

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
  const hasActiveSubscription = subscriptionStatus.status === 'active';
  
  // Check if renewal is allowed (within 30 days of expiry)
  const canRenew = hasActiveSubscription && subscriptionStatus.daysRemaining !== undefined && subscriptionStatus.daysRemaining <= 30;

  // Scroll to payment section when package is selected
  useEffect(() => {
    if (selectedPackage && paymentSectionRef.current) {
      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedPackage]);

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

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const result = await validateDiscount.mutateAsync(discountCode);
      if (result && result.is_active) {
        setAppliedDiscount({
          code: discountCode,
          type: result.discount_type as 'percentage' | 'fixed',
          value: result.discount_value,
        });
        toast.success('تم تطبيق كود الخصم بنجاح');
      } else {
        toast.error('كود الخصم غير صالح');
      }
    } catch (error) {
      toast.error('فشل في التحقق من كود الخصم');
    }
  };

  const calculateFinalPrice = (price: number) => {
    if (!appliedDiscount) return price;
    
    if (appliedDiscount.type === 'percentage') {
      return price * (1 - appliedDiscount.value / 100);
    } else {
      return Math.max(0, price - appliedDiscount.value);
    }
  };

  const handlePayNow = async () => {
    if (!selectedPackage) {
      toast.error('يرجى اختيار باقة');
      return;
    }

    setIsProcessing(true);
    
    try {
      const baseUrl = 'https://teacherhub.site';
      const callbackUrl = `${baseUrl}/teacher/subscription/success`;
      const errorUrl = `${baseUrl}/teacher/subscription/error`;

      const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
        body: {
          action: 'initiate-payment',
          packageId: selectedPackage,
          discountCode: appliedDiscount?.code,
          callbackUrl,
          errorUrl,
        },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ 
            url: data.paymentUrl,
            presentationStyle: 'fullscreen',
            toolbarColor: '#0f172a',
          });
        } else {
          window.location.href = data.paymentUrl;
        }
      } else {
        throw new Error('لم يتم الحصول على رابط الدفع');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء عملية الدفع');
    } finally {
      setIsProcessing(false);
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

  const getTrialEndDate = () => {
    if (subscription?.trial_ends_at) {
      return format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: ar });
    }
    return null;
  };

  const selectedPkg = activePackages.find(p => p.id === selectedPackage);
  const finalPrice = selectedPkg ? calculateFinalPrice(selectedPkg.price) : 0;

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
            {/* Packages Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activePackages.map((pkg, index) => {
                const isPopular = index === 1 || pkg.courses_count === 2;
                const isSelected = selectedPackage === pkg.id;
                const packageFinalPrice = calculateFinalPrice(pkg.price);
                
                return (
                  <Card 
                    key={pkg.id}
                    className={`relative cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary border-primary' : ''
                    } ${isPopular ? 'border-primary shadow-lg' : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1 bg-primary shadow-lg">
                          <Star className="h-3 w-3 fill-current" />
                          الأكثر شيوعاً
                        </Badge>
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
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
                        {appliedDiscount && (
                          <p className="text-sm text-muted-foreground line-through">
                            {pkg.price.toFixed(2)} د.ك
                          </p>
                        )}
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-primary">
                            {packageFinalPrice.toFixed(0)}
                          </span>
                          <span className="text-lg text-muted-foreground">.{(packageFinalPrice % 1).toFixed(2).slice(2)}</span>
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
                          <span>دعم فني على مدار الساعة</span>
                        </li>
                      </ul>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={isSelected ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackage(pkg.id);
                        }}
                      >
                        {isSelected ? 'تم الاختيار' : 'اختيار الباقة'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Payment Section */}
            {selectedPackage && (!hasActiveSubscription || canRenew) && (
              <Card ref={paymentSectionRef} className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    إتمام الدفع
                  </CardTitle>
                  <CardDescription>أكمل عملية الدفع لتفعيل اشتراكك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Discount Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">كود الخصم (اختياري)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="أدخل كود الخصم"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        disabled={!!appliedDiscount}
                      />
                      {appliedDiscount ? (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setAppliedDiscount(null);
                            setDiscountCode('');
                          }}
                        >
                          إلغاء
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={handleApplyDiscount}
                          disabled={validateDiscount.isPending || !discountCode.trim()}
                        >
                          {validateDiscount.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Tag className="h-4 w-4 ml-1" />
                              تطبيق
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {appliedDiscount && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        تم تطبيق خصم {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : `${appliedDiscount.value} د.ك`}
                      </p>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">ملخص الطلب</h4>
                    <div className="flex justify-between text-sm">
                      <span>{selectedPkg?.name_ar}</span>
                      <span>{selectedPkg?.price.toFixed(2)} د.ك</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>الخصم</span>
                        <span>- {(selectedPkg!.price - finalPrice).toFixed(2)} د.ك</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>الإجمالي</span>
                      <span className="text-primary">{finalPrice.toFixed(2)} د.ك</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">طرق الدفع المتاحة</label>
                    <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <img src={knetLogo} alt="KNET" className="h-8 object-contain" />
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
                        alt="Visa" 
                        className="h-6 object-contain" 
                      />
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                        alt="Mastercard" 
                        className="h-8 object-contain" 
                      />
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" 
                        alt="Apple Pay" 
                        className="h-6 object-contain" 
                      />
                    </div>
                  </div>

                  {/* Pay Button */}
                  <Button 
                    className="w-full h-12 text-lg"
                    onClick={handlePayNow}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        جاري تحويلك للدفع...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 ml-2" />
                        ادفع الآن - {finalPrice.toFixed(2)} د.ك
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

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
