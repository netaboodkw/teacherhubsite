import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, Home, AlertCircle, Receipt, Calendar, CreditCard, RefreshCw, Smartphone, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useWaitForPaymentCompletion } from '@/hooks/useSubscriptionRealtime';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showAppLink, setShowAppLink] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    invoiceId?: string;
    amount?: number;
    packageName?: string;
    subscriptionEndsAt?: string;
    paymentMethod?: string;
  } | null>(null);

  // MyFatoorah sends paymentId or Id parameter
  const paymentId = searchParams.get('paymentId') || searchParams.get('Id');

  // Check if user came from native app (iOS/Android)
  useEffect(() => {
    // Detect if on mobile browser (came from app's in-app browser)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Show app link if on mobile (user likely came from the app)
    if (isMobile && !isStandalone) {
      setShowAppLink(true);
      
      // Try to auto-redirect to app after a short delay
      const redirectTimer = setTimeout(() => {
        tryOpenApp();
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [paymentId]);

  // Try to open the native app using URL scheme
  const tryOpenApp = () => {
    const appUrl = paymentId 
      ? `teacherhub://teacher/subscription/success?paymentId=${paymentId}`
      : 'teacherhub://teacher/subscription/success';
    
    console.log('Attempting to open app with URL:', appUrl);
    
    // Create a hidden iframe to try opening the app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    
    // Also try direct location change
    setTimeout(() => {
      window.location.href = appUrl;
    }, 100);
    
    // Clean up iframe after attempt
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  };

  // Listen for realtime subscription updates
  useWaitForPaymentCompletion(paymentId, {
    onComplete: useCallback((subscriptionData: any) => {
      console.log('Realtime: Subscription activated!', subscriptionData);
      if (!verified) {
        setVerified(true);
        toast.success('تم تفعيل اشتراكك! 🎉');
        // Fetch updated payment details
        verifyPaymentDetails();
      }
    }, [verified]),
    timeout: 60000, // Wait up to 60 seconds
  });

  const verifyPaymentDetails = async () => {
    if (!paymentId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
        body: {
          action: 'verify-payment',
          paymentId,
        },
      });

      if (error) throw error;
      
      if (data.success && data.status === 'completed') {
        setVerified(true);
        setPaymentDetails({
          invoiceId: data.invoiceId || paymentId,
          amount: data.amount,
          packageName: data.packageName,
          subscriptionEndsAt: data.subscriptionEndsAt,
          paymentMethod: data.paymentMethod,
        });
      } else if (data.success) {
        setPaymentDetails({
          invoiceId: paymentId,
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setPaymentDetails({
        invoiceId: paymentId,
      });
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId) {
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('myfatoorah-payment', {
          body: {
            action: 'verify-payment',
            paymentId,
          },
        });

        if (error) throw error;
        
        if (data.success && data.status === 'completed') {
          setVerified(true);
          setPaymentDetails({
            invoiceId: data.invoiceId || paymentId,
            amount: data.amount,
            packageName: data.packageName,
            subscriptionEndsAt: data.subscriptionEndsAt,
            paymentMethod: data.paymentMethod,
          });
        } else if (data.success) {
          // Payment found but not yet completed - realtime will catch the update
          setPaymentDetails({
            invoiceId: paymentId,
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        setPaymentDetails({
          invoiceId: paymentId,
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [paymentId, retryCount]);

  const handleRetry = () => {
    setIsVerifying(true);
    setRetryCount(prev => prev + 1);
  };

  const formatEndDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodName = (method?: string) => {
    if (!method) return null;
    const methods: Record<string, string> = {
      'KNET': 'كي نت',
      'VISA/MASTER': 'فيزا/ماستر كارد',
      'APPLEPAY': 'Apple Pay',
      'MADA': 'مدى',
    };
    return methods[method.toUpperCase()] || method;
  };

  // App redirect banner component
  const AppRedirectBanner = () => (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-center gap-2 text-primary mb-3">
        <Smartphone className="h-5 w-5" />
        <span className="font-semibold">العودة للتطبيق</span>
      </div>
      <p className="text-sm text-muted-foreground text-center mb-3">
        اضغط على الزر أدناه للعودة إلى تطبيق Teacher Hub
      </p>
      <Button 
        onClick={tryOpenApp} 
        className="w-full gap-2"
        size="lg"
      >
        <Smartphone className="h-4 w-4" />
        فتح التطبيق
      </Button>
    </div>
  );

  // Determine if user is logged in
  const isLoggedIn = !!user;

  // Handle navigation based on login status
  const handleNavigate = () => {
    if (isLoggedIn) {
      navigate('/teacher');
    } else {
      navigate('/auth/teacher?tab=login');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir="rtl">
      <div className="max-w-md mx-auto pt-10 sm:pt-20 px-4 pb-10">
        {/* Show app redirect banner if on mobile */}
        {showAppLink && <AppRedirectBanner />}
        
        <Card className="text-center overflow-hidden shadow-lg">
          <CardContent className="py-10 sm:py-12 space-y-6">
            {isVerifying ? (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold">جاري التحقق من الدفع...</h2>
                <p className="text-muted-foreground">يرجى الانتظار</p>
              </>
            ) : verified ? (
              <>
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-pulse">
                  <CheckCircle className="h-14 w-14 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-emerald-600">تم الدفع بنجاح! 🎉</h2>
                  <p className="text-muted-foreground">
                    شكراً لك! تم تفعيل اشتراكك بنجاح ويمكنك الآن الاستمتاع بجميع مميزات النظام.
                  </p>
                </div>
                
                {paymentDetails && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span>تفاصيل الدفع</span>
                    </div>
                    
                    {paymentDetails.invoiceId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الفاتورة:</span>
                        <span className="font-mono font-medium">{paymentDetails.invoiceId}</span>
                      </div>
                    )}
                    
                    {paymentDetails.packageName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الباقة:</span>
                        <span className="font-medium">{paymentDetails.packageName}</span>
                      </div>
                    )}
                    
                    {paymentDetails.amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المبلغ:</span>
                        <span className="font-medium">{paymentDetails.amount} د.ك</span>
                      </div>
                    )}

                    {paymentDetails.paymentMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          طريقة الدفع:
                        </span>
                        <span className="font-medium">{getPaymentMethodName(paymentDetails.paymentMethod)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Subscription End Date */}
                {paymentDetails?.subscriptionEndsAt && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-semibold">تم بدء اشتراكك</span>
                    </div>
                    <p className="text-emerald-600 text-sm">
                      سينتهي اشتراكك في: <strong>{formatEndDate(paymentDetails.subscriptionEndsAt)}</strong>
                    </p>
                  </div>
                )}

                {/* Action buttons based on context */}
                {showAppLink ? (
                  <Button onClick={tryOpenApp} className="gap-2 w-full" size="lg">
                    <Smartphone className="h-4 w-4" />
                    العودة للتطبيق
                  </Button>
                ) : isLoggedIn ? (
                  <Button onClick={() => navigate('/teacher')} className="gap-2 w-full sm:w-auto" size="lg">
                    <Home className="h-4 w-4" />
                    العودة للرئيسية
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      يمكنك الآن تسجيل الدخول للوصول إلى حسابك
                    </p>
                    <Button onClick={() => navigate('/auth/teacher?tab=login')} className="gap-2 w-full" size="lg">
                      <LogIn className="h-4 w-4" />
                      تسجيل الدخول
                    </Button>
                  </div>
                )}
              </>
            ) : paymentId ? (
              <>
                <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto animate-pulse">
                  <Loader2 className="h-14 w-14 text-amber-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-amber-600">جاري تفعيل اشتراكك...</h2>
                  <p className="text-muted-foreground">
                    تم استلام طلب الدفع الخاص بك. سيتم تفعيل اشتراكك تلقائياً خلال لحظات.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    سيتم تحديث الصفحة تلقائياً عند اكتمال التفعيل
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Receipt className="h-4 w-4" />
                    <span>تفاصيل الدفع</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم العملية:</span>
                    <span className="font-mono font-medium text-xs">{paymentId}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={handleRetry} 
                    className="gap-2"
                    disabled={isVerifying}
                  >
                    <RefreshCw className={`h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
                    إعادة التحقق
                  </Button>
                  {showAppLink ? (
                    <Button onClick={tryOpenApp} className="gap-2">
                      <Smartphone className="h-4 w-4" />
                      العودة للتطبيق
                    </Button>
                  ) : (
                    <Button onClick={handleNavigate} className="gap-2">
                      {isLoggedIn ? <Home className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      {isLoggedIn ? 'العودة للرئيسية' : 'تسجيل الدخول'}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-14 w-14 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">لم يتم العثور على بيانات الدفع</h2>
                  <p className="text-muted-foreground">
                    يرجى التواصل مع الدعم الفني إذا تم خصم المبلغ من حسابك.
                  </p>
                </div>
                {showAppLink ? (
                  <Button onClick={tryOpenApp} className="gap-2 w-full" size="lg">
                    <Smartphone className="h-4 w-4" />
                    العودة للتطبيق
                  </Button>
                ) : (
                  <Button onClick={handleNavigate} className="gap-2 w-full sm:w-auto" size="lg">
                    {isLoggedIn ? <Home className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                    {isLoggedIn ? 'العودة للرئيسية' : 'تسجيل الدخول'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Branding */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Teacher Hub</p>
        </div>
      </div>
    </div>
  );
}
