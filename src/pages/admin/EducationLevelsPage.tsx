import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, GraduationCap, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEducationLevels, useCreateEducationLevel, useUpdateEducationLevel, useDeleteEducationLevel } from '@/hooks/useEducationLevels';

export default function EducationLevelsPage() {
  const { data: levels, isLoading } = useEducationLevels();
  const createLevel = useCreateEducationLevel();
  const updateLevel = useUpdateEducationLevel();
  const deleteLevel = useDeleteEducationLevel();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<{ id: string; name: string; name_ar: string } | null>(null);
  const [form, setForm] = useState({ name: '', name_ar: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string } | null>(null);

  const handleToggleActive = async (level: { id: string; is_active: boolean }) => {
    await updateLevel.mutateAsync({ id: level.id, is_active: !level.is_active });
  };

  const handleDelete = (id: string) => {
    deleteLevel.mutate(id);
    setDeleteConfirm(null);
  };

  const openDialog = (level?: { id: string; name: string; name_ar: string }) => {
    if (level) {
      setEditingLevel(level);
      setForm({ name: level.name, name_ar: level.name_ar });
    } else {
      setEditingLevel(null);
      setForm({ name: '', name_ar: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ar) return;
    
    if (editingLevel) {
      await updateLevel.mutateAsync({ id: editingLevel.id, ...form });
    } else {
      await createLevel.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">المراحل التعليمية</h1>
              <p className="text-muted-foreground">إدارة المراحل التعليمية في النظام</p>
            </div>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 ml-1" />
            إضافة مرحلة
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : levels?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد مراحل تعليمية. أضف مرحلة جديدة للبدء.
              </p>
            ) : (
              <div className="space-y-2">
                {levels?.map((level) => (
                  <div
                    key={level.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      level.is_active ? 'hover:bg-muted/50' : 'bg-muted/30 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-medium text-lg ${!level.is_active && 'text-muted-foreground'}`}>
                        {level.name_ar}
                      </span>
                      {level.name && (
                        <span className="text-muted-foreground text-sm">({level.name})</span>
                      )}
                      {!level.is_active && (
                        <Badge variant="outline" className="text-muted-foreground">معطّل</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleActive(level)}
                        title={level.is_active ? 'تعطيل المرحلة' : 'تفعيل المرحلة'}
                        className={level.is_active ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground'}
                      >
                        {level.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDialog(level)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteConfirm({ open: true, id: level.id, name: level.name_ar })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLevel ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={form.name_ar}
                onChange={(e) => setForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: المرحلة الابتدائية"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editingLevel ? 'حفظ' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm?.open} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المرحلة "{deleteConfirm?.name}"؟
              <br />
              <span className="text-destructive font-medium">
                ملاحظة: إذا كانت المرحلة مرتبطة ببيانات أخرى، يُفضل تعطيلها بدلاً من حذفها.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
