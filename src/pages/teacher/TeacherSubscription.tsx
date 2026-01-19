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
  FileText,
  Users,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Star,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  Smartphone,
  HeadphonesIcon,
  Gift
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

// Feature items for display
const features = [
  {
    icon: Users,
    title: 'إدارة الطلاب',
    description: 'إدارة بيانات الطلاب وتنظيمهم في صفوف'
  },
  {
    icon: ClipboardCheck,
    title: 'تسجيل الحضور',
    description: 'تسجيل الحضور والغياب بسهولة وسرعة'
  },
  {
    icon: BarChart3,
    title: 'تقارير الدرجات',
    description: 'تقارير شاملة للدرجات والأداء الأكاديمي'
  },
  {
    icon: Bell,
    title: 'التنبيهات الذكية',
    description: 'تنبيهات للحصص والمهام المهمة'
  },
  {
    icon: Smartphone,
    title: 'تطبيق الجوال',
    description: 'استخدم النظام من أي جهاز في أي وقت'
  },
  {
    icon: TrendingUp,
    title: 'متابعة التقدم',
    description: 'تتبع تقدم الطلاب عبر الوقت'
  },
  {
    icon: Shield,
    title: 'حماية البيانات',
    description: 'بياناتك آمنة ومحمية بالكامل'
  },
  {
    icon: HeadphonesIcon,
    title: 'دعم فني متميز',
    description: 'فريق دعم متاح لمساعدتك'
  }
];

interface PaymentMethod {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  ImageUrl: string;
  ServiceCharge: number;
  TotalAmount: number;
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

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

  // Fetch payment methods when package is selected
  const fetchPaymentMethods = async (invoiceValue: number) => {
    setLoadingPaymentMethods(true);
    setPaymentMethods([]);
    setSelectedPaymentMethod(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
        body: {
          action: 'get-payment-methods',
          invoiceValue,
          currencyIso: 'KWD',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setPaymentMethods(data.paymentMethods || []);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast.error('فشل في جلب طرق الدفع');
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Handle package selection
  const handlePackageSelect = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    const finalPrice = calculateFinalPrice(pkg);
    fetchPaymentMethods(finalPrice);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error('الرجاء اختيار باقة');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('الرجاء اختيار طريقة الدفع');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
        body: {
          action: 'execute-payment',
          packageId: selectedPackage.id,
          discountCode: appliedDiscount?.code,
          paymentMethodId: selectedPaymentMethod.PaymentMethodId,
          callbackUrl: `${window.location.origin}/teacher/subscription/success`,
          errorUrl: `${window.location.origin}/teacher/subscription/error`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'فشل في بدء عملية الدفع');

      if (data.paymentUrl) {
        toast.success('جاري التحويل لصفحة الدفع...');
        // Open in new window to avoid iframe restrictions from payment gateways
        // Use window.top to break out of iframe if embedded
        setTimeout(() => {
          if (window.top) {
            window.top.location.href = data.paymentUrl;
          } else {
            window.open(data.paymentUrl, '_blank');
          }
        }, 300);
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

  const getStatusBadge = () => {
    switch (subscriptionStatus.status) {
      case 'trial':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 border-amber-300">
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
          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700">
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

        {/* Features Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">مميزات الاشتراك</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-md transition-all hover:border-primary/50">
                <CardContent className="p-4 text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
                        className={`w-full gap-2 ${isPopular && !isSelected ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={isSelected ? 'default' : 'outline'}
                        size="lg"
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            تم الاختيار
                          </>
                        ) : (
                          'اختر هذه الباقة'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Discount Code & Checkout */}
            {selectedPackage && (
              <Card className="border-primary/20 shadow-lg">
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

                  <Separator />

                  {/* Payment Methods Selection */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      اختر طريقة الدفع
                    </h4>
                    
                    {loadingPaymentMethods ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="mr-2 text-muted-foreground">جاري تحميل طرق الدفع...</span>
                      </div>
                    ) : paymentMethods.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.PaymentMethodId}
                            onClick={() => setSelectedPaymentMethod(method)}
                            className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                              selectedPaymentMethod?.PaymentMethodId === method.PaymentMethodId
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {selectedPaymentMethod?.PaymentMethodId === method.PaymentMethodId && (
                              <div className="absolute top-2 left-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <img 
                              src={method.ImageUrl} 
                              alt={method.PaymentMethodAr}
                              className="h-10 w-auto mx-auto mb-2 object-contain"
                            />
                            <p className="text-xs text-center font-medium truncate">
                              {method.PaymentMethodAr}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد طرق دفع متاحة</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-6">
                  <Button 
                    className="w-full gap-2 h-12 text-base" 
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isProcessing || !selectedPaymentMethod}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري التحويل لصفحة الدفع...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        {selectedPaymentMethod 
                          ? `ادفع الآن عبر ${selectedPaymentMethod.PaymentMethodAr}`
                          : 'اختر طريقة الدفع أولاً'
                        }
                      </>
                    )}
                  </Button>
                </CardFooter>
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
