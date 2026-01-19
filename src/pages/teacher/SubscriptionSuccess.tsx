import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, Home, AlertCircle, Receipt, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    invoiceId?: string;
    amount?: number;
    packageName?: string;
    subscriptionEndsAt?: string;
    paymentMethod?: string;
  } | null>(null);

  // MyFatoorah sends paymentId or Id parameter
  const paymentId = searchParams.get('paymentId') || searchParams.get('Id');

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
          // Payment found but status might be different
          setPaymentDetails({
            invoiceId: paymentId,
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Even if verification fails, show a success message since they were redirected here
        setPaymentDetails({
          invoiceId: paymentId,
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [paymentId]);

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

  return (
    <TeacherLayout>
      <div className="max-w-md mx-auto mt-10 sm:mt-20 px-4">
        <Card className="text-center overflow-hidden">
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
                  <h2 className="text-2xl font-bold text-emerald-600">تم الاشتراك بنجاح! 🎉</h2>
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
                
                <Button onClick={() => navigate('/teacher')} className="gap-2 w-full sm:w-auto" size="lg">
                  <Home className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </>
            ) : paymentId ? (
              <>
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-14 w-14 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-emerald-600">شكراً لك!</h2>
                  <p className="text-muted-foreground">
                    تم استلام طلب الدفع الخاص بك. سيتم تفعيل اشتراكك خلال لحظات.
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
                
                <Button onClick={() => navigate('/teacher')} className="gap-2 w-full sm:w-auto" size="lg">
                  <Home className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
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
                <Button onClick={() => navigate('/teacher')} className="gap-2 w-full sm:w-auto" size="lg">
                  <Home className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
