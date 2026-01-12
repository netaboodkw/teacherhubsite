import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Users, 
  Loader2, 
  Search,
  CreditCard,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  UserCheck,
  UserX
} from 'lucide-react';

interface Subscriber {
  id: string;
  user_id: string;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  courses_remaining: number;
  is_read_only: boolean;
  package: {
    name_ar: string;
    courses_count: number;
    price: number;
  } | null;
  profile: {
    full_name: string;
    phone: string | null;
    school_name: string | null;
  } | null;
}

interface Payment {
  id: string;
  amount: number;
  original_amount: number;
  discount_amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  invoice_id: string | null;
  created_at: string;
  paid_at: string | null;
  package: {
    name_ar: string;
  } | null;
  profile: {
    full_name: string;
  } | null;
}

export default function SubscribersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Fetch subscribers
  const { data: subscribers, isLoading: subscribersLoading } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from('teacher_subscriptions')
        .select(`
          *,
          package:subscription_packages(name_ar, courses_count, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = subs.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, school_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return subs.map(s => ({
        ...s,
        profile: profileMap.get(s.user_id) || null
      })) as Subscriber[];
    },
  });

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data: pays, error } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          package:subscription_packages(name_ar)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = pays.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return pays.map(p => ({
        ...p,
        profile: profileMap.get(p.user_id) || null
      })) as Payment[];
    },
  });

  // Calculate stats
  const stats = {
    total: subscribers?.length || 0,
    active: subscribers?.filter(s => s.status === 'active').length || 0,
    trial: subscribers?.filter(s => s.status === 'trial').length || 0,
    expired: subscribers?.filter(s => s.status === 'expired' || s.is_read_only).length || 0,
    totalRevenue: payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0,
  };

  const getStatusBadge = (status: string, isReadOnly: boolean) => {
    if (isReadOnly) {
      return (
        <Badge variant="destructive" className="gap-1">
          <UserX className="h-3 w-3" />
          قراءة فقط
        </Badge>
      );
    }
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1 bg-emerald-600">
            <Crown className="h-3 w-3" />
            مشترك
          </Badge>
        );
      case 'trial':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            تجريبي
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            منتهي
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
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

  const filteredSubscribers = subscribers?.filter(sub => {
    const matchesSearch = sub.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profile?.phone?.includes(searchQuery) ||
      sub.profile?.school_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = payment.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice_id?.includes(searchQuery);
    const matchesStatus = paymentStatusFilter === 'all' || payment.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">المشتركين والمدفوعات</h1>
          <p className="text-muted-foreground">إدارة اشتراكات المعلمين ومتابعة المدفوعات</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">مشتركين فعالين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.trial}</p>
                  <p className="text-xs text-muted-foreground">فترة تجريبية</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-xs text-muted-foreground">منتهي/قراءة فقط</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الإيرادات (د.ك)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscribers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="h-4 w-4" />
              المشتركين
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              المدفوعات
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <CardTitle>قائمة المشتركين</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم أو الهاتف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">مشترك</SelectItem>
                        <SelectItem value="trial">تجريبي</SelectItem>
                        <SelectItem value="expired">منتهي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subscribersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المعلم</TableHead>
                        <TableHead>المدرسة</TableHead>
                        <TableHead>الباقة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الانتهاء</TableHead>
                        <TableHead>الكورسات المتبقية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscribers?.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.profile?.full_name || 'غير معروف'}</p>
                              <p className="text-sm text-muted-foreground">{sub.profile?.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.profile?.school_name || '-'}</TableCell>
                          <TableCell>{sub.package?.name_ar || 'بدون باقة'}</TableCell>
                          <TableCell>{getStatusBadge(sub.status, sub.is_read_only)}</TableCell>
                          <TableCell>
                            {sub.status === 'trial' && sub.trial_ends_at
                              ? format(new Date(sub.trial_ends_at), 'dd/MM/yyyy')
                              : sub.subscription_ends_at
                              ? format(new Date(sub.subscription_ends_at), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>{sub.courses_remaining}</TableCell>
                        </TableRow>
                      ))}
                      {(!filteredSubscribers || filteredSubscribers.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا يوجد مشتركين
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <CardTitle>سجل المدفوعات</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم أو رقم الفاتورة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-64"
                      />
                    </div>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="failed">فشل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>المعلم</TableHead>
                        <TableHead>الباقة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الخصم</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.invoice_id || payment.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>{payment.profile?.full_name || 'غير معروف'}</TableCell>
                          <TableCell>{payment.package?.name_ar || '-'}</TableCell>
                          <TableCell className="font-medium">
                            {payment.amount.toFixed(2)} د.ك
                          </TableCell>
                          <TableCell>
                            {payment.discount_amount > 0 ? (
                              <span className="text-emerald-600">-{payment.discount_amount.toFixed(2)} د.ك</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredPayments || filteredPayments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            لا توجد مدفوعات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
