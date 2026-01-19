import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Mail,
  Settings,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  Eye,
  Plus,
  History,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  name_ar: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  variables: string[];
  description: string | null;
}

interface EmailSetting {
  id: string;
  setting_key: string;
  value: Record<string, any>;
  description: string | null;
}

interface EmailLog {
  id: string;
  template_key: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

interface BroadcastEmail {
  id: string;
  subject: string;
  body_html: string;
  recipient_filter: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export default function EmailManagementPage() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState('all');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_key');
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .order('setting_key');
      if (error) throw error;
      return data as EmailSetting[];
    },
  });

  // Fetch logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  // Fetch broadcasts
  const { data: broadcasts, isLoading: broadcastsLoading } = useQuery({
    queryKey: ['broadcast-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_emails')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BroadcastEmail[];
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('email_settings')
        .update({ value })
        .eq('setting_key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      toast.success('تم حفظ الإعدادات');
    },
    onError: () => {
      toast.error('فشل في حفظ الإعدادات');
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('email_templates')
        .update(template)
        .eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('تم حفظ القالب');
      setSelectedTemplate(null);
    },
    onError: () => {
      toast.error('فشل في حفظ القالب');
    },
  });

  // Send broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مسجل الدخول');

      // Create broadcast record
      const { data: broadcast, error: createError } = await supabase
        .from('broadcast_emails')
        .insert({
          subject: broadcastSubject,
          body_html: broadcastContent,
          recipient_filter: broadcastFilter,
          created_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) throw createError;

      // Trigger sending
      const { error: sendError } = await supabase.functions.invoke('send-broadcast-email', {
        body: { broadcastId: broadcast.id },
      });

      if (sendError) throw sendError;
      return broadcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-emails'] });
      toast.success('تم بدء إرسال الرسالة الجماعية');
      setBroadcastSubject('');
      setBroadcastContent('');
      setIsSendingBroadcast(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في إرسال الرسالة');
      setIsSendingBroadcast(false);
    },
  });

  const getSettingValue = (key: string, defaultValue: any = null) => {
    const setting = settings?.find(s => s.setting_key === key);
    return setting?.value ?? defaultValue;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return <Badge className="gap-1 bg-emerald-600"><CheckCircle className="h-3 w-3" />تم الإرسال</Badge>;
      case 'pending':
      case 'sending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />قيد الإرسال</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />فشل</Badge>;
      case 'draft':
        return <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />مسودة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'جميع المشتركين';
      case 'active': return 'المشتركين الفعالين';
      case 'trial': return 'الفترة التجريبية';
      case 'expired': return 'منتهي الاشتراك';
      default: return filter;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            إدارة الإيميلات
          </h1>
          <p className="text-muted-foreground">إعداد قوالب الإيميلات والإرسال الجماعي</p>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              القوالب
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-2">
              <Send className="h-4 w-4" />
              إرسال جماعي
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="h-4 w-4" />
              سجل الإرسال
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الإيميلات التلقائية</CardTitle>
                <CardDescription>تحكم في الإيميلات التي يتم إرسالها تلقائياً</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Welcome Email */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>إيميل الترحيب</Label>
                        <p className="text-sm text-muted-foreground">إرسال إيميل ترحيبي عند تسجيل مستخدم جديد</p>
                      </div>
                      <Switch
                        checked={getSettingValue('enable_welcome_email')?.enabled !== false}
                        onCheckedChange={(checked) => {
                          updateSettingMutation.mutate({
                            key: 'enable_welcome_email',
                            value: { enabled: checked },
                          });
                        }}
                      />
                    </div>

                    <Separator />

                    {/* Reminder Email */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>تذكير انتهاء الاشتراك</Label>
                        <p className="text-sm text-muted-foreground">إرسال تذكير قبل انتهاء الاشتراك</p>
                      </div>
                      <Switch
                        checked={getSettingValue('enable_reminder_email')?.enabled !== false}
                        onCheckedChange={(checked) => {
                          updateSettingMutation.mutate({
                            key: 'enable_reminder_email',
                            value: { enabled: checked },
                          });
                        }}
                      />
                    </div>

                    {/* Days before expiry */}
                    <div className="flex items-center gap-4">
                      <Label className="whitespace-nowrap">عدد الأيام قبل الانتهاء:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={getSettingValue('reminder_days_before_expiry')?.days || 7}
                        onChange={(e) => {
                          updateSettingMutation.mutate({
                            key: 'reminder_days_before_expiry',
                            value: { days: parseInt(e.target.value) || 7 },
                          });
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">يوم</span>
                    </div>

                    <Separator />

                    {/* Expired Email */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>إشعار انتهاء الاشتراك</Label>
                        <p className="text-sm text-muted-foreground">إرسال إشعار عند انتهاء الاشتراك</p>
                      </div>
                      <Switch
                        checked={getSettingValue('enable_expired_email')?.enabled !== false}
                        onCheckedChange={(checked) => {
                          updateSettingMutation.mutate({
                            key: 'enable_expired_email',
                            value: { enabled: checked },
                          });
                        }}
                      />
                    </div>

                    <Separator />

                    {/* Payment Email */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>تأكيد الدفع</Label>
                        <p className="text-sm text-muted-foreground">إرسال تأكيد بعد نجاح عملية الدفع</p>
                      </div>
                      <Switch
                        checked={getSettingValue('enable_payment_email')?.enabled !== false}
                        onCheckedChange={(checked) => {
                          updateSettingMutation.mutate({
                            key: 'enable_payment_email',
                            value: { enabled: checked },
                          });
                        }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قوالب الإيميلات</CardTitle>
                <CardDescription>تخصيص محتوى الإيميلات التلقائية</CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>القالب</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates?.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{template.name_ar}</p>
                              <p className="text-sm text-muted-foreground">{template.subject}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {template.description}
                          </TableCell>
                          <TableCell>
                            {template.is_active ? (
                              <Badge className="bg-emerald-600">مفعّل</Badge>
                            ) : (
                              <Badge variant="secondary">معطّل</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTemplate(template)}
                                >
                                  <Eye className="h-4 w-4 ml-1" />
                                  عرض
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{template.name_ar}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>عنوان الإيميل</Label>
                                    <Input
                                      value={selectedTemplate?.subject || ''}
                                      onChange={(e) => setSelectedTemplate(prev => 
                                        prev ? { ...prev, subject: e.target.value } : null
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>المتغيرات المتاحة</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {template.variables?.map((v) => (
                                        <Badge key={v} variant="outline">{`{{${v}}}`}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={selectedTemplate?.is_active ?? template.is_active}
                                      onCheckedChange={(checked) => setSelectedTemplate(prev =>
                                        prev ? { ...prev, is_active: checked } : null
                                      )}
                                    />
                                    <Label>تفعيل القالب</Label>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (selectedTemplate) {
                                        updateTemplateMutation.mutate({
                                          id: selectedTemplate.id,
                                          subject: selectedTemplate.subject,
                                          is_active: selectedTemplate.is_active,
                                        });
                                      }
                                    }}
                                    disabled={updateTemplateMutation.isPending}
                                  >
                                    {updateTemplateMutation.isPending && (
                                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                    )}
                                    حفظ التغييرات
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compose */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    إنشاء رسالة جماعية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>المستلمون</Label>
                    <Select value={broadcastFilter} onValueChange={setBroadcastFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المشتركين</SelectItem>
                        <SelectItem value="active">المشتركين الفعالين فقط</SelectItem>
                        <SelectItem value="trial">الفترة التجريبية فقط</SelectItem>
                        <SelectItem value="expired">منتهي الاشتراك فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان الرسالة</Label>
                    <Input
                      placeholder="عنوان الإيميل..."
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>محتوى الرسالة</Label>
                    <Textarea
                      placeholder="اكتب محتوى الرسالة هنا... يمكنك استخدام {{name}} لإدراج اسم المستلم"
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      استخدم {`{{name}}`} لإدراج اسم المستلم تلقائياً
                    </p>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      if (!broadcastSubject.trim() || !broadcastContent.trim()) {
                        toast.error('الرجاء إدخال العنوان والمحتوى');
                        return;
                      }
                      setIsSendingBroadcast(true);
                      sendBroadcastMutation.mutate();
                    }}
                    disabled={isSendingBroadcast || sendBroadcastMutation.isPending}
                  >
                    {(isSendingBroadcast || sendBroadcastMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    إرسال الرسالة
                  </Button>
                </CardContent>
              </Card>

              {/* History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    الرسائل السابقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {broadcastsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : broadcasts?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      لا توجد رسائل جماعية سابقة
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {broadcasts?.slice(0, 5).map((broadcast) => (
                        <div key={broadcast.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm line-clamp-1">{broadcast.subject}</p>
                            {getStatusBadge(broadcast.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {getFilterLabel(broadcast.recipient_filter)}
                            </span>
                            <span>
                              {broadcast.sent_count}/{broadcast.total_recipients} تم إرسالها
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(broadcast.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سجل الإيميلات المرسلة</CardTitle>
                <CardDescription>آخر 100 إيميل تم إرسالها</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : logs?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد سجلات
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستلم</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.recipient_name || '-'}</p>
                              <p className="text-xs text-muted-foreground">{log.recipient_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.template_key || 'broadcast'}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {log.subject}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
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
