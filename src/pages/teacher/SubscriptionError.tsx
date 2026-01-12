import { useNavigate } from 'react-router-dom';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home } from 'lucide-react';

export default function SubscriptionError() {
  const navigate = useNavigate();

  return (
    <TeacherLayout>
      <div className="max-w-md mx-auto mt-20">
        <Card className="text-center">
          <CardContent className="py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-destructive">فشلت عملية الدفع</h2>
            <p className="text-muted-foreground">
              عذراً، حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/teacher/subscription')} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                المحاولة مرة أخرى
              </Button>
              <Button variant="outline" onClick={() => navigate('/teacher')} className="gap-2">
                <Home className="h-4 w-4" />
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
