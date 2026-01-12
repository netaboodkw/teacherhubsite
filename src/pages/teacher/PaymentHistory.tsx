import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Receipt, 
  Loader2, 
  Download, 
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';

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

export default function PaymentHistory() {
  const { data: payments, isLoading } = useQuery({
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

  const getStatusBadge = (status: string) => {
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

  if (isLoading) {
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">سجل المدفوعات</h1>
            <p className="text-muted-foreground">عرض جميع المدفوعات والفواتير السابقة</p>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Payments List */}
        {payments && payments.length > 0 ? (
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
                      {getStatusBadge(payment.status)}
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
              <Button className="mt-4" onClick={() => window.location.href = '/teacher/subscription'}>
                عرض الباقات
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  );
}
