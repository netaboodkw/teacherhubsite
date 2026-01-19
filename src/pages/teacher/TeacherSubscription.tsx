import { useState, useRef } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  CreditCard, 
  Check, 
  Clock, 
  AlertTriangle, 
  Tag, 
  Loader2,
  Crown,
  Receipt,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  GraduationCap,
  Gift,
  FileText,
  Zap,
  ExternalLink,
  ShieldCheck
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
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);

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
  
  // Check if user can subscribe (not allowed if active with more than 30 days remaining)
  const canSubscribe = () => {
    if (subscriptionStatus.status === 'active' && subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining > 30) {
      return false;
    }
    return true;
  };
  
  const subscriptionNotAllowedMessage = subscriptionStatus.status === 'active' && subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining > 30
    ? `لديك اشتراك فعال ينتهي بعد ${subscriptionStatus.daysRemaining} يوم. يمكنك التجديد عندما يتبقى 30 يوم أو أقل.`
    : null;

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

  // Handle package selection
  const handlePackageSelect = (pkg: SubscriptionPackage) => {
    if (!canSubscribe()) {
      toast.error(subscriptionNotAllowedMessage || 'لا يمكنك الاشتراك حالياً');
      return;
    }
    setSelectedPackage(pkg);
    // Scroll to checkout section
    setTimeout(() => scrollToCheckout(), 100);
  };

  const initiatePayment = () => {
    if (!selectedPackage) {
      toast.error('الرجاء اختيار باقة');
      return;
    }
    setShowPaymentConfirmDialog(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setShowPaymentConfirmDialog(false);
    setIsProcessing(true);
    
    try {
      // Use production domain for payment callbacks - this domain has Universal Links configured
      const baseUrl = 'https://teacherhub.site';
      
      toast.info('جاري تحويلك لصفحة الدفع الآمنة...', {
        description: 'سيتم إرجاعك للتطبيق تلقائياً بعد إتمام الدفع',
        duration: 4000,
      });
      
      // Use initiate-payment to get a payment page with all payment methods
      const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
        body: {
          action: 'initiate-payment',
          packageId: selectedPackage.id,
          discountCode: appliedDiscount?.code,
          callbackUrl: `${baseUrl}/teacher/subscription/success`,
          errorUrl: `${baseUrl}/teacher/subscription/error`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'فشل في بدء عملية الدفع');

      if (data.paymentUrl) {
        // Check if running on native platform (iOS/Android)
        if (Capacitor.isNativePlatform()) {
          try {
            // Use In-App Browser (Safari View Controller on iOS, Chrome Custom Tab on Android)
            await Browser.open({ 
              url: data.paymentUrl,
              presentationStyle: 'fullscreen',
              toolbarColor: '#0f172a',
            });
          } catch (browserError) {
            console.error('In-app browser error:', browserError);
            window.open(data.paymentUrl, '_blank');
          }
        } else {
          // Web browser - redirect to payment page
          // Try to open in same window/tab to avoid popup blockers
          try {
            if (window.top && window.top !== window) {
              window.top.location.href = data.paymentUrl;
            } else {
              window.location.href = data.paymentUrl;
            }
          } catch (e) {
            // Fallback to new tab
            window.open(data.paymentUrl, '_blank');
          }
        }
      } else {
        throw new Error('لم يتم استلام رابط الدفع');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'حدث خطأ أثناء بدء عملية الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkoutRef = useRef<HTMLDivElement>(null);
  
  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
        {/* Hero Section */}
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
                    <h1 className="text-2xl lg:text-3xl font-bold">اشترك الآن</h1>
                    <p className="text-primary-foreground/80">واستمتع بجميع مميزات النظام</p>
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

        {/* Active subscription - can't subscribe yet */}
        {!canSubscribe() && (
          <Card className="border-emerald-500 bg-emerald-50">
            <CardContent className="flex items-center gap-4 p-4">
              <Crown className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-emerald-700">لديك اشتراك فعال</h3>
                <p className="text-sm text-emerald-600">
                  {subscriptionNotAllowedMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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
          <TabsContent value="packages" className="space-y-8 mt-8">
            {/* Packages Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activePackages.map((pkg, index) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const finalPrice = calculateFinalPrice(pkg);
                const hasDiscount = appliedDiscount && finalPrice < pkg.price;
                const isPopular = index === 1 || pkg.courses_count === 2;
                
                return (
                  <Card 
                    key={pkg.id}
                    className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      isSelected ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : 'hover:scale-[1.01]'
                    } ${isPopular ? 'border-primary shadow-lg' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
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
                        {hasDiscount && (
                          <p className="text-lg text-muted-foreground line-through">
                            {pkg.price} د.ك
                          </p>
                        )}
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-primary">
                            {finalPrice.toFixed(0)}
                          </span>
                          <span className="text-lg text-muted-foreground">.{(finalPrice % 1).toFixed(2).slice(2)}</span>
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
                    
                    <CardFooter className="pb-6">
                      <Button 
                        className={`w-full gap-2 ${isSelected ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={isSelected ? 'default' : 'outline'}
                        size="lg"
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            تم الاختيار
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            اشترك الآن
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Discount Code & Checkout */}
            {selectedPackage && (
              <Card ref={checkoutRef} className="border-primary/20 shadow-lg scroll-mt-4">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">إتمام الشراء</CardTitle>
                      <CardDescription>راجع طلبك وأكمل عملية الدفع</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Discount Code Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      كود الخصم (اختياري)
                    </label>
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
                      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          تم تطبيق خصم {appliedDiscount.discount_type === 'percentage' 
                            ? `${appliedDiscount.discount_value}%` 
                            : `${appliedDiscount.discount_value} د.ك`}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      ملخص الطلب
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الباقة</span>
                        <span className="font-semibold">{selectedPackage.name_ar}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">عدد الكورسات</span>
                        <Badge variant="secondary">{selectedPackage.courses_count} كورس</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">السعر الأصلي</span>
                        <span>{selectedPackage.price.toFixed(2)} د.ك</span>
                      </div>
                      {appliedDiscount && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span>الخصم</span>
                          <span>- {(selectedPackage.price - calculateFinalPrice(selectedPackage)).toFixed(2)} د.ك</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">الإجمالي</span>
                        <span className="font-bold text-primary text-2xl">{calculateFinalPrice(selectedPackage).toFixed(2)} د.ك</span>
                      </div>
                    </div>
                  </div>

                </CardContent>
                <CardFooter className="bg-muted/30 pt-6 flex-col gap-4">
                  {/* Payment Methods Logos */}
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" 
                        alt="Visa" 
                        className="h-5 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" 
                        alt="Mastercard" 
                        className="h-5 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/200px-Apple_Pay_logo.svg.png" 
                        alt="Apple Pay" 
                        className="h-5 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border">
                      <span className="text-xs font-bold text-blue-600">KNET</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full gap-2 h-12 text-base" 
                    size="lg"
                    onClick={initiatePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري التحويل لصفحة الدفع...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        ادفع الآن
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>دفع آمن عبر بوابة MyFatoorah المعتمدة</span>
                  </div>
                </CardFooter>
              </Card>
            )}

            {/* Payment Confirmation Dialog */}
            <AlertDialog open={showPaymentConfirmDialog} onOpenChange={setShowPaymentConfirmDialog}>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-xl">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    تأكيد عملية الدفع
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-right space-y-4 pt-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الباقة:</span>
                        <span className="font-semibold text-foreground">{selectedPackage?.name_ar}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">المبلغ:</span>
                        <span className="font-bold text-primary text-lg">
                          {selectedPackage && calculateFinalPrice(selectedPackage).toFixed(2)} د.ك
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">طرق الدفع المتاحة:</span>
                        <span className="font-medium text-foreground text-sm">كي نت - فيزا - ماستر - Apple Pay</span>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                      <div className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                          سيتم تحويلك لصفحة الدفع الآمنة لإتمام العملية. 
                          بعد الانتهاء ستعود تلقائياً للتطبيق.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-700 text-sm">
                      <ShieldCheck className="h-4 w-4" />
                      <span>دفع آمن ومشفر عبر MyFatoorah</span>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePurchase} className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    متابعة الدفع
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
