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
import { Loader2, Plus, Edit, Trash2, Calendar, Package, Tag, Settings2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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
  const [trialDays, setTrialDays] = useState(settings?.trial_days ?? 10);

  // Dialog states
  const [courseDialog, setCourseDialog] = useState(false);
  const [packageDialog, setPackageDialog] = useState(false);
  const [codeDialog, setCodeDialog] = useState(false);
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
    currency: 'SAR',
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
    updateSettings.mutate({ enabled, trial_days: trialDays });
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
        currency: 'SAR',
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
          <h1 className="text-2xl lg:text-3xl font-bold">إدارة الاشتراكات</h1>
          <p className="text-muted-foreground mt-1">إعداد الكورسات والباقات وأكواد الخصم</p>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label htmlFor="trial_days">مدة الفترة التجريبية (بالأيام)</Label>
                      <Input
                        id="trial_days"
                        type="number"
                        min={0}
                        max={30}
                        value={trialDays}
                        onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                        className="max-w-xs"
                      />
                      <p className="text-sm text-muted-foreground">
                        عدد الأيام المجانية للمعلمين الجدد قبل الحاجة للاشتراك
                      </p>
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
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discountCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-bold">{code.code}</TableCell>
                          <TableCell>{code.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</TableCell>
                          <TableCell>
                            {code.discount_value}{code.discount_type === 'percentage' ? '%' : ' ر.س'}
                          </TableCell>
                          <TableCell>
                            {code.current_uses}/{code.max_uses || '∞'}
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
                      ))}
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
