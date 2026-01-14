import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Edit, Trash2, Calendar, Package, Tag, Settings2, Save, Users, CreditCard, Crown, Clock, AlertTriangle, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useSubscriptionSettings,
  useUpdateSubscriptionSettings,
  useSubscriptionCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useSubscriptionPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeleteDiscountCode,
  SubscriptionCourse,
  SubscriptionPackage,
  DiscountCode,
} from '@/hooks/useSubscription';

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

export default function SubscriptionsPage() {
  const { data: settings, isLoading: settingsLoading } = useSubscriptionSettings();
  const updateSettings = useUpdateSubscriptionSettings();
  const { data: courses = [], isLoading: coursesLoading } = useSubscriptionCourses();
  const { data: packages = [], isLoading: packagesLoading } = useSubscriptionPackages();
  const { data: discountCodes = [], isLoading: codesLoading } = useDiscountCodes();

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const deleteCode = useDeleteDiscountCode();

  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [trialEnabled, setTrialEnabled] = useState(settings?.trial_enabled ?? true);
  const [trialDays, setTrialDays] = useState(settings?.trial_days ?? 100);
  const [expiryBehavior, setExpiryBehavior] = useState<'read_only' | 'full_lockout'>(settings?.expiry_behavior as 'read_only' | 'full_lockout' ?? 'read_only');

  // Subscribers filters
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
      const userIds = subs?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, school_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return subs?.map(sub => ({
        ...sub,
        profile: profileMap.get(sub.user_id) || null
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

      const userIds = pays?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return pays?.map(pay => ({
        ...pay,
        profile: profileMap.get(pay.user_id) || null
      })) as Payment[];
    },
  });

  // Fetch discount code usage details
  const { data: codeUsageDetails } = useQuery({
    queryKey: ['discount-code-usage'],
    queryFn: async () => {
      const { data: usages, error } = await supabase
        .from('subscription_payments')
        .select(`
          id,
          user_id,
          discount_code_id,
          amount,
          created_at,
          discount_codes!inner(code)
        `)
        .not('discount_code_id', 'is', null);

      if (error) throw error;

      const userIds = usages?.map(u => u.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return usages?.map(usage => ({
        ...usage,
        profile: profileMap.get(usage.user_id) || null
      })) || [];
    },
  });

  // Group usage by discount code
  const codeUsageMap = new Map<string, { users: Array<{ name: string; date: string }> }>();
  codeUsageDetails?.forEach(usage => {
    const codeId = usage.discount_code_id;
    if (!codeUsageMap.has(codeId)) {
      codeUsageMap.set(codeId, { users: [] });
    }
    codeUsageMap.get(codeId)!.users.push({
      name: usage.profile?.full_name || 'غير معروف',
      date: usage.created_at
    });
  });

  // Filtered subscribers
  const filteredSubscribers = subscribers?.filter(sub => {
    const matchesSearch = !searchQuery || 
      sub.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profile?.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Filtered payments
  const filteredPayments = payments?.filter(pay => {
    const matchesSearch = !searchQuery || 
      pay.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = paymentStatusFilter === 'all' || pay.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getSubscriptionBadge = (status: string, isReadOnly: boolean) => {
    if (isReadOnly) {
      return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" />قراءة فقط</Badge>;
    }
    switch (status) {
      case 'trial':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />تجريبي</Badge>;
      case 'active':
        return <Badge className="gap-1 bg-emerald-600"><Crown className="h-3 w-3" />نشط</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="gap-1 bg-emerald-600"><CheckCircle className="h-3 w-3" />مكتمل</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />قيد الانتظار</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />فشل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Dialog states
  const [courseDialog, setCourseDialog] = useState(false);
  const [packageDialog, setPackageDialog] = useState(false);
  const [codeDialog, setCodeDialog] = useState(false);
  const [codeUsageDialog, setCodeUsageDialog] = useState<{ code: DiscountCode; users: Array<{ name: string; date: string }> } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'course' | 'package' | 'code'; id: string } | null>(null);

  // Editing states
  const [editingCourse, setEditingCourse] = useState<SubscriptionCourse | null>(null);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: '',
    name_ar: '',
    start_date: '',
    end_date: '',
    display_order: 0,
    is_active: true,
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    courses_count: 1,
    price: 0,
    currency: 'KWD',
    display_order: 0,
    is_active: true,
  });

  const [codeForm, setCodeForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    max_uses: null as number | null,
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setTrialDays(settings.trial_days);
    }
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({ 
      enabled, 
      trial_enabled: trialEnabled,
      trial_days: trialDays,
      expiry_behavior: expiryBehavior
    });
  };

  const openCourseDialog = (course?: SubscriptionCourse) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        name: course.name,
        name_ar: course.name_ar,
        start_date: course.start_date,
        end_date: course.end_date,
        display_order: course.display_order,
        is_active: course.is_active,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        name: '',
        name_ar: '',
        start_date: '',
        end_date: '',
        display_order: courses.length,
        is_active: true,
      });
    }
    setCourseDialog(true);
  };

  const openPackageDialog = (pkg?: SubscriptionPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        name: pkg.name,
        name_ar: pkg.name_ar,
        description: pkg.description || '',
        courses_count: pkg.courses_count,
        price: pkg.price,
        currency: pkg.currency,
        display_order: pkg.display_order,
        is_active: pkg.is_active,
      });
    } else {
      setEditingPackage(null);
      setPackageForm({
        name: '',
        name_ar: '',
        description: '',
        courses_count: 1,
        price: 0,
        currency: 'KWD',
        display_order: packages.length,
        is_active: true,
      });
    }
    setPackageDialog(true);
  };

  const openCodeDialog = (code?: DiscountCode) => {
    if (code) {
      setEditingCode(code);
      setCodeForm({
        code: code.code,
        description: code.description || '',
        discount_type: code.discount_type,
        discount_value: code.discount_value,
        max_uses: code.max_uses,
        valid_from: code.valid_from || '',
        valid_until: code.valid_until || '',
        is_active: code.is_active,
      });
    } else {
      setEditingCode(null);
      setCodeForm({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        max_uses: null,
        valid_from: '',
        valid_until: '',
        is_active: true,
      });
    }
    setCodeDialog(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.name_ar || !courseForm.start_date || !courseForm.end_date) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, ...courseForm });
    } else {
      await createCourse.mutateAsync(courseForm);
    }
    setCourseDialog(false);
  };

  const handleSavePackage = async () => {
    if (!packageForm.name_ar || packageForm.price < 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingPackage) {
      await updatePackage.mutateAsync({ id: editingPackage.id, ...packageForm });
    } else {
      await createPackage.mutateAsync(packageForm);
    }
    setPackageDialog(false);
  };

  const handleSaveCode = async () => {
    if (!codeForm.code || codeForm.discount_value <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const codeData = {
      ...codeForm,
      valid_from: codeForm.valid_from || null,
      valid_until: codeForm.valid_until || null,
    };

    if (editingCode) {
      await updateCode.mutateAsync({ id: editingCode.id, ...codeData });
    } else {
      await createCode.mutateAsync(codeData);
    }
    setCodeDialog(false);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    if (deleteDialog.type === 'course') {
      await deleteCourse.mutateAsync(deleteDialog.id);
    } else if (deleteDialog.type === 'package') {
      await deletePackage.mutateAsync(deleteDialog.id);
    } else if (deleteDialog.type === 'code') {
      await deleteCode.mutateAsync(deleteDialog.id);
    }
    setDeleteDialog(null);
  };

  if (settingsLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">الاشتراكات والمدفوعات</h1>
          <p className="text-muted-foreground mt-1">إدارة الاشتراكات والمشتركين والمدفوعات</p>
        </div>

        <Tabs defaultValue="subscribers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="subscribers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المشتركين
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              المدفوعات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              الكورسات
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              الباقات
            </TabsTrigger>
            <TabsTrigger value="codes" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              الخصومات
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  المشتركين ({filteredSubscribers.length})
                </CardTitle>
                <CardDescription>عرض وإدارة جميع المشتركين في النظام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث بالاسم أو رقم الهاتف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="حالة الاشتراك" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="trial">تجريبي</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {subscribersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المعلم</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الباقة</TableHead>
                          <TableHead>تاريخ الانتهاء</TableHead>
                          <TableHead>الكورسات المتبقية</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscribers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              لا يوجد مشتركين
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSubscribers.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{sub.profile?.full_name || 'غير معروف'}</p>
                                  <p className="text-sm text-muted-foreground">{sub.profile?.school_name || '-'}</p>
                                </div>
                              </TableCell>
                              <TableCell>{getSubscriptionBadge(sub.status, sub.is_read_only)}</TableCell>
                              <TableCell>{sub.package?.name_ar || '-'}</TableCell>
                              <TableCell>
                                {sub.status === 'trial' && sub.trial_ends_at
                                  ? format(new Date(sub.trial_ends_at), 'dd MMM yyyy', { locale: ar })
                                  : sub.subscription_ends_at
                                  ? format(new Date(sub.subscription_ends_at), 'dd MMM yyyy', { locale: ar })
                                  : '-'}
                              </TableCell>
                              <TableCell>{sub.courses_remaining}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  سجل المدفوعات ({filteredPayments.length})
                </CardTitle>
                <CardDescription>جميع عمليات الدفع والفواتير</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث بالاسم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="حالة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="failed">فشل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المعلم</TableHead>
                          <TableHead>الباقة</TableHead>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              لا توجد مدفوعات
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPayments.map((pay) => (
                            <TableRow key={pay.id}>
                              <TableCell>{pay.profile?.full_name || 'غير معروف'}</TableCell>
                              <TableCell>{pay.package?.name_ar || '-'}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{pay.amount.toFixed(2)} د.ك</p>
                                  {pay.discount_amount > 0 && (
                                    <p className="text-xs text-muted-foreground line-through">
                                      {pay.original_amount.toFixed(2)} د.ك
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getPaymentBadge(pay.status)}</TableCell>
                              <TableCell>
                                {format(new Date(pay.created_at), 'dd MMM yyyy', { locale: ar })}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات نظام الاشتراكات</CardTitle>
                <CardDescription>
                  تفعيل أو تعطيل نظام الاشتراكات المدفوعة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">تفعيل نظام الاشتراكات</Label>
                    <p className="text-sm text-muted-foreground">
                      عند التفعيل، سيحتاج المعلمون للاشتراك للوصول الكامل للنظام
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                </div>

                {enabled && (
                  <div className="space-y-6 p-4 border rounded-lg bg-muted/50">
                    {/* Trial Period Settings */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                      <div>
                        <Label className="text-base font-medium">تفعيل الفترة التجريبية المجانية</Label>
                        <p className="text-sm text-muted-foreground">
                          إتاحة فترة مجانية للمعلمين الجدد قبل إلزامهم بالاشتراك
                        </p>
                      </div>
                      <Switch
                        checked={trialEnabled}
                        onCheckedChange={setTrialEnabled}
                      />
                    </div>

                    {trialEnabled && (
                      <div className="space-y-2 p-4 border rounded-lg bg-background">
                        <Label htmlFor="trial_days">مدة الفترة التجريبية (بالأيام)</Label>
                        <Input
                          id="trial_days"
                          type="number"
                          min={1}
                          max={365}
                          value={trialDays}
                          onChange={(e) => setTrialDays(parseInt(e.target.value) || 100)}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground">
                          عدد الأيام المجانية للمعلمين الجدد (الافتراضي: 100 يوم)
                        </p>
                      </div>
                    )}

                    {/* Expiry Behavior */}
                    <div className="space-y-3 p-4 border rounded-lg bg-background">
                      <Label className="text-base font-medium">السلوك عند انتهاء الاشتراك</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        ماذا يحدث عند انتهاء الفترة التجريبية أو الاشتراك المدفوع؟
                      </p>
                      <div className="space-y-3">
                        <div 
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            expiryBehavior === 'read_only' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setExpiryBehavior('read_only')}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                            expiryBehavior === 'read_only' ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                            {expiryBehavior === 'read_only' && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">وضع القراءة فقط</p>
                            <p className="text-sm text-muted-foreground">
                              يمكن للمعلم عرض بياناته ولكن لا يمكنه إضافة أو تعديل أي شيء
                            </p>
                          </div>
                        </div>
                        <div 
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            expiryBehavior === 'full_lockout' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setExpiryBehavior('full_lockout')}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                            expiryBehavior === 'full_lockout' ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                            {expiryBehavior === 'full_lockout' && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">إغلاق كامل</p>
                            <p className="text-sm text-muted-foreground">
                              يُجبر المعلم على الاشتراك قبل الوصول لأي جزء من النظام
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>الكورسات التعليمية</CardTitle>
                  <CardDescription>تحديد فترات الكورسات (الفصول الدراسية)</CardDescription>
                </div>
                <Button onClick={() => openCourseDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة كورس
                </Button>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد كورسات. قم بإضافة كورس جديد.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>تاريخ البداية</TableHead>
                        <TableHead>تاريخ النهاية</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name_ar}</TableCell>
                          <TableCell>{format(new Date(course.start_date), 'dd/MM/yyyy', { locale: ar })}</TableCell>
                          <TableCell>{format(new Date(course.end_date), 'dd/MM/yyyy', { locale: ar })}</TableCell>
                          <TableCell>
                            <Badge variant={course.is_active ? 'default' : 'secondary'}>
                              {course.is_active ? 'مفعل' : 'معطل'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openCourseDialog(course)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: 'course', id: course.id })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>باقات الاشتراك</CardTitle>
                  <CardDescription>تحديد الباقات المتاحة وأسعارها</CardDescription>
                </div>
                <Button onClick={() => openPackageDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة باقة
                </Button>
              </CardHeader>
              <CardContent>
                {packagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد باقات. قم بإضافة باقة جديدة.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>عدد الكورسات</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name_ar}</TableCell>
                          <TableCell>{pkg.courses_count} كورس</TableCell>
                          <TableCell>{pkg.price} {pkg.currency}</TableCell>
                          <TableCell>
                            <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                              {pkg.is_active ? 'مفعل' : 'معطل'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openPackageDialog(pkg)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: 'package', id: pkg.id })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discount Codes Tab */}
          <TabsContent value="codes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>أكواد الخصم</CardTitle>
                  <CardDescription>إنشاء وإدارة كوبونات الخصم</CardDescription>
                </div>
                <Button onClick={() => openCodeDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة كود
                </Button>
              </CardHeader>
              <CardContent>
                {codesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : discountCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أكواد خصم. قم بإضافة كود جديد.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الكود</TableHead>
                        <TableHead>نوع الخصم</TableHead>
                        <TableHead>القيمة</TableHead>
                        <TableHead>الاستخدام</TableHead>
                        <TableHead>المستخدمون</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discountCodes.map((code) => {
                        const usage = codeUsageMap.get(code.id);
                        const actualUses = usage?.users.length || 0;
                        return (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-bold">{code.code}</TableCell>
                            <TableCell>{code.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</TableCell>
                            <TableCell>
                              {code.discount_value}{code.discount_type === 'percentage' ? '%' : ' د.ك'}
                            </TableCell>
                            <TableCell>
                              <span className={actualUses > 0 ? 'text-emerald-600 font-medium' : ''}>
                                {actualUses}
                              </span>
                              /{code.max_uses || '∞'}
                            </TableCell>
                            <TableCell>
                              {actualUses > 0 ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-primary"
                                  onClick={() => setCodeUsageDialog({ code, users: usage?.users || [] })}
                                >
                                  <Eye className="h-3 w-3 ml-1" />
                                  عرض ({actualUses})
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">لا يوجد</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={code.is_active ? 'default' : 'secondary'}>
                                {code.is_active ? 'مفعل' : 'معطل'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openCodeDialog(code)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: 'code', id: code.id })}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Course Dialog */}
        <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'تعديل الكورس' : 'إضافة كورس جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربي *</Label>
                  <Input
                    value={courseForm.name_ar}
                    onChange={(e) => setCourseForm({ ...courseForm, name_ar: e.target.value })}
                    placeholder="الفصل الدراسي الأول"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزي</Label>
                  <Input
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="First Semester"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ البداية *</Label>
                  <Input
                    type="date"
                    value={courseForm.start_date}
                    onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ النهاية *</Label>
                  <Input
                    type="date"
                    value={courseForm.end_date}
                    onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={courseForm.is_active}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_active: checked })}
                />
                <Label>مفعل</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCourseDialog(false)}>إلغاء</Button>
              <Button onClick={handleSaveCourse} disabled={createCourse.isPending || updateCourse.isPending}>
                {(createCourse.isPending || updateCourse.isPending) && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Package Dialog */}
        <Dialog open={packageDialog} onOpenChange={setPackageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربي *</Label>
                  <Input
                    value={packageForm.name_ar}
                    onChange={(e) => setPackageForm({ ...packageForm, name_ar: e.target.value })}
                    placeholder="باقة كورس واحد"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزي</Label>
                  <Input
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    placeholder="Single Course"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="وصف مختصر للباقة"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>عدد الكورسات *</Label>
                  <Select
                    value={packageForm.courses_count.toString()}
                    onValueChange={(v) => setPackageForm({ ...packageForm, courses_count: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 كورس</SelectItem>
                      <SelectItem value="2">2 كورس</SelectItem>
                      <SelectItem value="4">4 كورسات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السعر *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select
                    value={packageForm.currency}
                    onValueChange={(v) => setPackageForm({ ...packageForm, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي</SelectItem>
                      <SelectItem value="KWD">دينار كويتي</SelectItem>
                      <SelectItem value="AED">درهم إماراتي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={packageForm.is_active}
                  onCheckedChange={(checked) => setPackageForm({ ...packageForm, is_active: checked })}
                />
                <Label>مفعل</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPackageDialog(false)}>إلغاء</Button>
              <Button onClick={handleSavePackage} disabled={createPackage.isPending || updatePackage.isPending}>
                {(createPackage.isPending || updatePackage.isPending) && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discount Code Dialog */}
        <Dialog open={codeDialog} onOpenChange={setCodeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCode ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكود *</Label>
                  <Input
                    value={codeForm.code}
                    onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input
                    value={codeForm.description}
                    onChange={(e) => setCodeForm({ ...codeForm, description: e.target.value })}
                    placeholder="خصم 20%"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>نوع الخصم *</Label>
                  <Select
                    value={codeForm.discount_type}
                    onValueChange={(v: 'percentage' | 'fixed') => setCodeForm({ ...codeForm, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القيمة *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={codeForm.discount_type === 'percentage' ? 100 : undefined}
                    value={codeForm.discount_value}
                    onChange={(e) => setCodeForm({ ...codeForm, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى للاستخدام</Label>
                  <Input
                    type="number"
                    min={0}
                    value={codeForm.max_uses || ''}
                    onChange={(e) => setCodeForm({ ...codeForm, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="غير محدود"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>صالح من</Label>
                  <Input
                    type="datetime-local"
                    value={codeForm.valid_from}
                    onChange={(e) => setCodeForm({ ...codeForm, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>صالح حتى</Label>
                  <Input
                    type="datetime-local"
                    value={codeForm.valid_until}
                    onChange={(e) => setCodeForm({ ...codeForm, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={codeForm.is_active}
                  onCheckedChange={(checked) => setCodeForm({ ...codeForm, is_active: checked })}
                />
                <Label>مفعل</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCodeDialog(false)}>إلغاء</Button>
              <Button onClick={handleSaveCode} disabled={createCode.isPending || updateCode.isPending}>
                {(createCode.isPending || updateCode.isPending) && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Code Usage Dialog */}
        <Dialog open={!!codeUsageDialog} onOpenChange={() => setCodeUsageDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                مستخدمو كود الخصم: {codeUsageDialog?.code.code}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {codeUsageDialog?.users.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لم يتم استخدام هذا الكود بعد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>تاريخ الاستخدام</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codeUsageDialog?.users.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.date), 'dd MMM yyyy - HH:mm', { locale: ar })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCodeUsageDialog(null)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
