import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Edit, Save, X, Fingerprint, Clock, MessageSquare, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NotificationTemplate {
  id: string;
  key: string;
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
  description: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categoryIcons: Record<string, any> = {
  fingerprint: Fingerprint,
  schedule: Clock,
  general: MessageSquare,
};

const categoryLabels: Record<string, string> = {
  fingerprint: 'بصمة التواجد',
  schedule: 'جدول الحصص',
  general: 'عام',
};

export default function NotificationTemplatesPage() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>({});

  // Fetch notification templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async (template: Partial<NotificationTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({
          title: template.title,
          title_ar: template.title_ar,
          body: template.body,
          body_ar: template.body_ar,
          description: template.description,
          category: template.category,
          is_active: template.is_active,
        })
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('تم تحديث القالب بنجاح');
      setEditingTemplate(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error('فشل في تحديث القالب: ' + error.message);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('تم تحديث حالة القالب');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الحالة: ' + error.message);
    },
  });

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
  };

  const handleSave = () => {
    if (!editingTemplate || !formData.id) return;
    updateMutation.mutate(formData as NotificationTemplate);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setFormData({});
  };

  // Group templates by category
  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NotificationTemplate[]>) || {};

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Bell}
          title="إدارة قوالب الإشعارات"
          subtitle="تعديل صيغة ومحتوى الإشعارات المرسلة للمعلمين"
          iconVariant="cyan"
        />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>المتغيرات المتاحة</AlertTitle>
          <AlertDescription>
            يمكنك استخدام المتغيرات التالية في نص الإشعار:
            <br />
            <code className="text-primary">{'{minutes}'}</code> - عدد الدقائق المتبقية
            <br />
            <code className="text-primary">{'{teacherName}'}</code> - اسم المعلم
            <br />
            <code className="text-primary">{'{className}'}</code> - اسم الصف
          </AlertDescription>
        </Alert>

        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const CategoryIcon = categoryIcons[category] || Bell;
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5" />
                  {categoryLabels[category] || category}
                </CardTitle>
                <CardDescription>
                  إشعارات {categoryLabels[category] || category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-lg border ${template.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.title_ar}</h4>
                          <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
                            {template.is_active ? 'مفعل' : 'معطل'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.body_ar}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground/70">{template.description}</p>
                        )}
                        <code className="text-xs text-muted-foreground">key: {template.key}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: template.id, is_active: checked })
                          }
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader>
                              <DialogTitle>تعديل قالب الإشعار</DialogTitle>
                              <DialogDescription>
                                تعديل عنوان ومحتوى الإشعار
                              </DialogDescription>
                            </DialogHeader>
                            {editingTemplate?.id === template.id && (
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>العنوان (عربي)</Label>
                                    <Input
                                      value={formData.title_ar || ''}
                                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                                      dir="rtl"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان (إنجليزي)</Label>
                                    <Input
                                      value={formData.title || ''}
                                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                      dir="ltr"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>المحتوى (عربي)</Label>
                                  <Textarea
                                    value={formData.body_ar || ''}
                                    onChange={(e) => setFormData({ ...formData, body_ar: e.target.value })}
                                    dir="rtl"
                                    rows={3}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>المحتوى (إنجليزي)</Label>
                                  <Textarea
                                    value={formData.body || ''}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    dir="ltr"
                                    rows={3}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>الوصف (للمشرف)</Label>
                                  <Input
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>التصنيف</Label>
                                  <Select
                                    value={formData.category || ''}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fingerprint">بصمة التواجد</SelectItem>
                                      <SelectItem value="schedule">جدول الحصص</SelectItem>
                                      <SelectItem value="general">عام</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                    <Save className="w-4 h-4 ml-2" />
                                    حفظ
                                  </Button>
                                  <Button variant="outline" onClick={handleCancel}>
                                    <X className="w-4 h-4 ml-2" />
                                    إلغاء
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
