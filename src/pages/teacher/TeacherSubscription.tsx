import { useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
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
  Sparkles
} from 'lucide-react';

export default function TeacherSubscription() {
  const { data: packages, isLoading: packagesLoading } = useSubscriptionPackages();
  const { data: subscription, isLoading: subscriptionLoading } = useMySubscription();
  const { data: settings } = useSubscriptionSettings();
  const validateDiscount = useValidateDiscountCode();
  
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  if (packagesLoading || subscriptionLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">باقات الاشتراك</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اختر الباقة المناسبة لاحتياجاتك واستمتع بجميع مميزات النظام
          </p>
          {getStatusBadge()}
        </div>

        {/* Read-only warning */}
        {subscriptionStatus.isReadOnly && (
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
      </div>
    </TeacherLayout>
  );
}
