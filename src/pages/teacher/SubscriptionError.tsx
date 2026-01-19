import { useSearchParams, useNavigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, MessageCircle, AlertTriangle } from 'lucide-react';

export default function SubscriptionError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get error info from URL params if available
  const errorCode = searchParams.get('error') || searchParams.get('ErrorCode');
  const errorMessage = searchParams.get('message') || searchParams.get('ErrorMessage');

  const getErrorDescription = () => {
    if (errorCode === 'cancelled' || errorMessage?.toLowerCase().includes('cancel')) {
      return 'تم إلغاء عملية الدفع. لم يتم خصم أي مبلغ من حسابك.';
    }
    if (errorCode === 'declined' || errorMessage?.toLowerCase().includes('declined')) {
      return 'تم رفض البطاقة. يرجى التأكد من صحة بيانات البطاقة أو استخدام بطاقة أخرى.';
    }
    if (errorCode === 'timeout') {
      return 'انتهت مهلة العملية. يرجى المحاولة مرة أخرى.';
    }
    return 'عذراً، حدث خطأ أثناء معالجة الدفع. لم يتم خصم أي مبلغ من حسابك.';
  };

  return (
    <TeacherLayout>
      <div className="max-w-md mx-auto mt-10 sm:mt-20 px-4">
        <Card className="text-center overflow-hidden">
          <CardContent className="py-10 sm:py-12 space-y-6">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-14 w-14 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">لم تتم عملية الدفع</h2>
              <p className="text-muted-foreground">
                {getErrorDescription()}
              </p>
            </div>

            {/* Error Details (if available) */}
            {(errorCode || errorMessage) && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-right">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>تفاصيل الخطأ</span>
                </div>
                {errorCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الكود:</span>
                    <span className="font-mono text-xs">{errorCode}</span>
                  </div>
                )}
              </div>
            )}

            {/* Reassurance Message */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm">
              <p>لا تقلق! لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى بأمان.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/teacher/subscription')} className="gap-2 w-full" size="lg">
                <RefreshCw className="h-4 w-4" />
                المحاولة مرة أخرى
              </Button>
              <Button variant="outline" onClick={() => navigate('/teacher')} className="gap-2 w-full">
                <Home className="h-4 w-4" />
                العودة للرئيسية
              </Button>
            </div>

            {/* Support Link */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                تواجه مشكلة؟{' '}
                <a 
                  href="https://wa.me/96599999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  تواصل مع الدعم
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
