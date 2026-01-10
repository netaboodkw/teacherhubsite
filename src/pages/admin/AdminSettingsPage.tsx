import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Database, Bell, Loader2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    appName: 'TeacherHub',
    allowRegistration: true,
    requireEmailVerification: false,
    maxClassroomsPerTeacher: 20,
    maxStudentsPerClassroom: 50,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">إعدادات النظام</h1>
            <p className="text-muted-foreground">إدارة الإعدادات العامة للنظام</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات العامة
              </CardTitle>
              <CardDescription>تخصيص الإعدادات الأساسية للتطبيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">اسم التطبيق</Label>
                <Input
                  id="appName"
                  value={settings.appName}
                  onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>السماح بالتسجيل الجديد</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح للمعلمين بإنشاء حسابات جديدة
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowRegistration: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التحقق من البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">
                    طلب تأكيد البريد الإلكتروني قبل استخدام الحساب
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Limits Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                حدود النظام
              </CardTitle>
              <CardDescription>تحديد الحدود القصوى للاستخدام</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxClassrooms">الحد الأقصى للصفوف لكل معلم</Label>
                  <Input
                    id="maxClassrooms"
                    type="number"
                    value={settings.maxClassroomsPerTeacher}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxClassroomsPerTeacher: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">الحد الأقصى للطلاب لكل صف</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={settings.maxStudentsPerClassroom}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxStudentsPerClassroom: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
              <CardDescription>إعدادات الإشعارات والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">
                    إرسال إشعارات للمعلمين
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                حالة النظام
              </CardTitle>
              <CardDescription>إدارة حالة التشغيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>وضع الصيانة</Label>
                    {settings.maintenanceMode && (
                      <Badge variant="destructive">مفعّل</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    عند التفعيل سيتم منع المعلمين من الوصول للنظام
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">جميع الخدمات تعمل بشكل طبيعي</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
