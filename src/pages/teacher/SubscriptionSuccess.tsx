import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, Home } from 'lucide-react';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const paymentId = searchParams.get('paymentId');

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
        setVerified(data.success && data.status === 'completed');
      } catch (error) {
        console.error('Verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [paymentId]);

  return (
    <TeacherLayout>
      <div className="max-w-md mx-auto mt-20">
        <Card className="text-center">
          <CardContent className="py-12 space-y-6">
            {isVerifying ? (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold">جاري التحقق من الدفع...</h2>
                <p className="text-muted-foreground">يرجى الانتظار</p>
              </>
            ) : verified ? (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-600">تم الاشتراك بنجاح!</h2>
                <p className="text-muted-foreground">
                  شكراً لك! تم تفعيل اشتراكك بنجاح ويمكنك الآن الاستمتاع بجميع مميزات النظام.
                </p>
                <Button onClick={() => navigate('/teacher')} className="gap-2">
                  <Home className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">شكراً لك!</h2>
                <p className="text-muted-foreground">
                  تم استلام طلبك. سيتم تفعيل اشتراكك قريباً.
                </p>
                <Button onClick={() => navigate('/teacher')} className="gap-2">
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
