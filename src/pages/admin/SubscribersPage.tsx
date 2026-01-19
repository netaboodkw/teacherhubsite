import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
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
  UserX,
  Edit,
  Wallet
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
  package_id: string | null;
  package: {
    id: string;
    name_ar: string;
    courses_count: number;
    price: number;
  } | null;
  teacher: {
    full_name: string | null;
    phone: string | null;
    school_name: string | null;
    education_level_name: string | null;
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

interface Package {
  id: string;
  name_ar: string;
  courses_count: number;
}

export default function SubscribersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    package_id: '',
    subscription_ends_at: '',
    courses_remaining: 0,
    is_read_only: false,
  });

  const queryClient = useQueryClient();

  // Fetch packages for dropdown
  const { data: packages } = useQuery({
    queryKey: ['subscription-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('id, name_ar, courses_count')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Package[];
    },
  });

  // Fetch subscribers
  const { data: subscribers, isLoading: subscribersLoading } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from('teacher_subscriptions')
        .select(`
          *,
          package:subscription_packages(id, name_ar, courses_count, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch teacher info from teachers_view (includes profiles data)
      const userIds = subs.map(s => s.user_id);
      const { data: teachers } = await supabase
        .from('teachers_view')
        .select('user_id, full_name, phone, school_name, education_level_name')
        .in('user_id', userIds);

      const teacherMap = new Map(teachers?.map(t => [t.user_id, t]) || []);
      
      return subs.map(s => ({
        ...s,
        teacher: teacherMap.get(s.user_id) || null
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

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      status: string;
      package_id: string | null;
      subscription_ends_at: string | null;
      courses_remaining: number;
      is_read_only: boolean;
    }) => {
      const updateData: Record<string, unknown> = {
        status: data.status,
        package_id: data.package_id || null,
        courses_remaining: data.courses_remaining,
        is_read_only: data.is_read_only,
      };

      // Handle subscription dates based on status
      if (data.status === 'active') {
        updateData.subscription_ends_at = data.subscription_ends_at || null;
        if (!updateData.subscription_ends_at) {
          // Default to 1 year from now if not specified
          updateData.subscription_ends_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        }
        if (!updateData.subscription_started_at) {
          updateData.subscription_started_at = new Date().toISOString();
        }
      } else if (data.status === 'trial') {
        if (!updateData.trial_started_at) {
          updateData.trial_started_at = new Date().toISOString();
        }
        updateData.trial_ends_at = data.subscription_ends_at || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from('teacher_subscriptions')
        .update(updateData)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث الاشتراك بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      setEditDialogOpen(false);
      setSelectedSubscriber(null);
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء تحديث الاشتراك');
      console.error(error);
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

  const getPaymentMethodDisplay = (method: string | null) => {
    if (!method) return '-';
    
    const methodsMap: Record<string, { name: string; icon: string }> = {
      'KNET': { name: 'كي نت', icon: '🏦' },
      'kn': { name: 'كي نت', icon: '🏦' },
      'VISA/MASTER': { name: 'فيزا/ماستر', icon: '💳' },
      'vm': { name: 'فيزا/ماستر', icon: '💳' },
      'APPLEPAY': { name: 'Apple Pay', icon: '🍎' },
      'ap': { name: 'Apple Pay', icon: '🍎' },
      'Apple Pay (KWD)': { name: 'Apple Pay', icon: '🍎' },
      'MADA': { name: 'مدى', icon: '💳' },
      'SAMSUNG_PAY': { name: 'Samsung Pay', icon: '📱' },
      'GOOGLE_PAY': { name: 'Google Pay', icon: '📱' },
    };

    const methodInfo = methodsMap[method.toUpperCase()] || methodsMap[method] || { name: method, icon: '💰' };
    
    return (
      <Badge variant="outline" className="gap-1">
        <span>{methodInfo.icon}</span>
        {methodInfo.name}
      </Badge>
    );
  };

  const handleEditSubscription = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setEditForm({
      status: subscriber.status,
      package_id: subscriber.package_id || '',
      subscription_ends_at: subscriber.status === 'trial' 
        ? subscriber.trial_ends_at?.split('T')[0] || ''
        : subscriber.subscription_ends_at?.split('T')[0] || '',
      courses_remaining: subscriber.courses_remaining,
      is_read_only: subscriber.is_read_only,
    });
    setEditDialogOpen(true);
  };

  const handleSaveSubscription = () => {
    if (!selectedSubscriber) return;

    updateSubscriptionMutation.mutate({
      id: selectedSubscriber.id,
      status: editForm.status,
      package_id: editForm.package_id || null,
      subscription_ends_at: editForm.subscription_ends_at || null,
      courses_remaining: editForm.courses_remaining,
      is_read_only: editForm.is_read_only,
    });
  };

  const filteredSubscribers = subscribers?.filter(sub => {
    const matchesSearch = sub.teacher?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.teacher?.phone?.includes(searchQuery) ||
      sub.teacher?.school_name?.toLowerCase().includes(searchQuery.toLowerCase());
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
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscribers?.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.teacher?.full_name || 'غير معروف'}</p>
                              <p className="text-sm text-muted-foreground">{sub.teacher?.phone || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.teacher?.school_name || '-'}</TableCell>
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
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSubscription(sub)}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              تعديل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredSubscribers || filteredSubscribers.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                        <TableHead>طريقة الدفع</TableHead>
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
                          <TableCell>
                            {getPaymentMethodDisplay(payment.payment_method)}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredPayments || filteredPayments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

      {/* Edit Subscription Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الاشتراك</DialogTitle>
            <DialogDescription>
              تعديل بيانات اشتراك: {selectedSubscriber?.teacher?.full_name || 'المستخدم'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>حالة الاشتراك</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">تجريبي</SelectItem>
                  <SelectItem value="active">مشترك (فعال)</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Package */}
            <div className="space-y-2">
              <Label>الباقة</Label>
              <Select
                value={editForm.package_id}
                onValueChange={(value) => {
                  const pkg = packages?.find(p => p.id === value);
                  setEditForm(prev => ({ 
                    ...prev, 
                    package_id: value,
                    courses_remaining: pkg?.courses_count || prev.courses_remaining 
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون باقة</SelectItem>
                  {packages?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name_ar} ({pkg.courses_count} كورسات)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>
                {editForm.status === 'trial' ? 'تاريخ انتهاء الفترة التجريبية' : 'تاريخ انتهاء الاشتراك'}
              </Label>
              <Input
                type="date"
                value={editForm.subscription_ends_at}
                onChange={(e) => setEditForm(prev => ({ ...prev, subscription_ends_at: e.target.value }))}
              />
            </div>

            {/* Courses Remaining */}
            <div className="space-y-2">
              <Label>الكورسات المتبقية</Label>
              <Input
                type="number"
                min={0}
                value={editForm.courses_remaining}
                onChange={(e) => setEditForm(prev => ({ ...prev, courses_remaining: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Read Only */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_read_only"
                checked={editForm.is_read_only}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_read_only: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_read_only" className="cursor-pointer">
                قراءة فقط (تقييد الصلاحيات)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveSubscription}
              disabled={updateSubscriptionMutation.isPending}
            >
              {updateSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
