import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { 
  TreePine, 
  ChevronDown, 
  ChevronLeft, 
  Plus, 
  Edit, 
  Trash2, 
  GraduationCap,
  Layers,
  Loader2,
  Search,
  Power,
  PowerOff
} from 'lucide-react';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type ItemType = 'education_level' | 'grade_level';

interface DialogState {
  open: boolean;
  mode: 'add' | 'edit';
  type: ItemType;
  parentId?: string;
  item?: any;
}

export default function CurriculumTreePage() {
  const queryClient = useQueryClient();
  const { data: educationLevels, isLoading: levelsLoading } = useEducationLevels();
  const { data: gradeLevels, isLoading: gradesLoading } = useGradeLevels();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>({ open: false, mode: 'add', type: 'education_level' });
  const [formData, setFormData] = useState({ name: '', name_ar: '', grade_number: 1 });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: ItemType; item: any }>({ open: false, type: 'education_level', item: null });
  const [deleting, setDeleting] = useState(false);

  // Toggle level expansion
  const toggleLevel = (levelId: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId);
    } else {
      newExpanded.add(levelId);
    }
    setExpandedLevels(newExpanded);
  };

  // Expand all
  const expandAll = () => {
    setExpandedLevels(new Set(educationLevels?.map(l => l.id) || []));
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedLevels(new Set());
  };

  // Get grade levels for education level
  const getGradeLevelsFor = (educationLevelId: string) => {
    return gradeLevels?.filter(g => g.education_level_id === educationLevelId) || [];
  };

  // Open dialog for adding
  const openAddDialog = (type: ItemType, parentId?: string) => {
    setDialog({ open: true, mode: 'add', type, parentId });
    setFormData({ name: '', name_ar: '', grade_number: 1 });
  };

  // Open dialog for editing
  const openEditDialog = (type: ItemType, item: any) => {
    setDialog({ open: true, mode: 'edit', type, item });
    setFormData({ 
      name: item.name || '', 
      name_ar: item.name_ar || '', 
      grade_number: item.grade_number || 1 
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.name_ar.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }

    setSaving(true);
    try {
      if (dialog.type === 'education_level') {
        if (dialog.mode === 'add') {
          const { error } = await supabase
            .from('education_levels')
            .insert({ 
              name: formData.name || formData.name_ar, 
              name_ar: formData.name_ar,
              display_order: (educationLevels?.length || 0) + 1
            });
          if (error) throw error;
          toast.success('تمت إضافة المرحلة التعليمية');
        } else {
          const { error } = await supabase
            .from('education_levels')
            .update({ name: formData.name || formData.name_ar, name_ar: formData.name_ar })
            .eq('id', dialog.item.id);
          if (error) throw error;
          toast.success('تم تحديث المرحلة التعليمية');
        }
        queryClient.invalidateQueries({ queryKey: ['education_levels'] });
      } else if (dialog.type === 'grade_level') {
        if (dialog.mode === 'add') {
          const { error } = await supabase
            .from('grade_levels')
            .insert({ 
              name: formData.name || formData.name_ar, 
              name_ar: formData.name_ar,
              education_level_id: dialog.parentId,
              grade_number: formData.grade_number,
              display_order: getGradeLevelsFor(dialog.parentId!).length + 1
            });
          if (error) throw error;
          toast.success('تمت إضافة الصف الدراسي');
        } else {
          const { error } = await supabase
            .from('grade_levels')
            .update({ 
              name: formData.name || formData.name_ar, 
              name_ar: formData.name_ar,
              grade_number: formData.grade_number
            })
            .eq('id', dialog.item.id);
          if (error) throw error;
          toast.success('تم تحديث الصف الدراسي');
        }
        queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      }

      setDialog({ ...dialog, open: false });
    } catch (error: any) {
      toast.error('فشل في الحفظ: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (type: ItemType, item: any) => {
    try {
      const tableName = type === 'education_level' ? 'education_levels' : 'grade_levels';
      
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success(item.is_active ? 'تم تعطيل العنصر' : 'تم تفعيل العنصر');
      queryClient.invalidateQueries({ queryKey: [type === 'education_level' ? 'education_levels' : 'grade_levels'] });
    } catch (error: any) {
      toast.error('فشل في تغيير الحالة: ' + error.message);
    }
  };

  // Handle delete with dependency checks
  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    
    setDeleting(true);
    try {
      const id = deleteDialog.item.id;

      // Check for dependencies based on type
      if (deleteDialog.type === 'education_level') {
        const { count: classroomsCount } = await supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true })
          .eq('education_level_id', id);

        if (classroomsCount && classroomsCount > 0) {
          throw new Error(`لا يمكن حذف هذه المرحلة لأنها مرتبطة بـ ${classroomsCount} فصل/فصول دراسية. يُفضل تعطيلها بدلاً من حذفها.`);
        }

        const { count: gradeLevelsCount } = await supabase
          .from('grade_levels')
          .select('*', { count: 'exact', head: true })
          .eq('education_level_id', id);

        if (gradeLevelsCount && gradeLevelsCount > 0) {
          throw new Error(`لا يمكن حذف هذه المرحلة لأنها مرتبطة بـ ${gradeLevelsCount} صف/صفوف دراسية. يُفضل تعطيلها بدلاً من حذفها.`);
        }

        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('education_level_id', id);

        if (profilesCount && profilesCount > 0) {
          throw new Error(`لا يمكن حذف هذه المرحلة لأنها مرتبطة بـ ${profilesCount} معلم/معلمين. يُفضل تعطيلها بدلاً من حذفها.`);
        }
      } else if (deleteDialog.type === 'grade_level') {
        const { count: classroomsCount } = await supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true })
          .eq('grade_level_id', id);

        if (classroomsCount && classroomsCount > 0) {
          throw new Error(`لا يمكن حذف هذا الصف لأنه مرتبط بـ ${classroomsCount} فصل/فصول دراسية. يُفضل تعطيله بدلاً من حذفه.`);
        }
      }

      const tableName = deleteDialog.type === 'education_level' ? 'education_levels' : 'grade_levels';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('تم حذف العنصر بنجاح');
      queryClient.invalidateQueries({ queryKey: [deleteDialog.type === 'education_level' ? 'education_levels' : 'grade_levels'] });
      setDeleteDialog({ open: false, type: 'education_level', item: null });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter by search
  const filteredLevels = useMemo(() => {
    if (!searchTerm) return educationLevels || [];
    
    return educationLevels?.filter(level => {
      const levelMatch = level.name_ar.includes(searchTerm);
      const gradesMatch = getGradeLevelsFor(level.id).some(g => g.name_ar.includes(searchTerm));
      return levelMatch || gradesMatch;
    }) || [];
  }, [educationLevels, searchTerm, gradeLevels]);

  const isLoading = levelsLoading || gradesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TreePine className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">المراحل والصفوف</h1>
              <p className="text-muted-foreground">إدارة المراحل التعليمية والصفوف الدراسية</p>
            </div>
          </div>
          <Button onClick={() => openAddDialog('education_level')}>
            <Plus className="h-4 w-4 ml-2" />
            مرحلة جديدة
          </Button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="h-4 w-4 ml-1" />
            توسيع الكل
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronLeft className="h-4 w-4 ml-1" />
            طي الكل
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{educationLevels?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">مرحلة تعليمية</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Layers className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{gradeLevels?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">صف دراسي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tree */}
        <Card>
          <CardHeader>
            <CardTitle>هيكل المراحل والصفوف</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredLevels.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'لا توجد نتائج' : 'لا توجد مراحل تعليمية. أضف واحدة للبدء.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredLevels.map((level) => {
                  const levelGrades = getGradeLevelsFor(level.id);
                  const isExpanded = expandedLevels.has(level.id);

                  return (
                    <Collapsible key={level.id} open={isExpanded} onOpenChange={() => toggleLevel(level.id)}>
                      {/* Education Level */}
                      <div className={`border rounded-lg ${!level.is_active ? 'opacity-60 bg-muted/50' : ''}`}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                              )}
                              <GraduationCap className="h-5 w-5 text-primary" />
                              <span className="font-medium">{level.name_ar}</span>
                              <Badge variant="outline" className="text-xs">
                                {levelGrades.length} صف
                              </Badge>
                              {!level.is_active && (
                                <Badge variant="secondary" className="text-xs">معطّل</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleActive('education_level', level)}
                                title={level.is_active ? 'تعطيل' : 'تفعيل'}
                              >
                                {level.is_active ? (
                                  <Power className="h-4 w-4 text-green-500" />
                                ) : (
                                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openAddDialog('grade_level', level.id)}
                                title="إضافة صف"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog('education_level', level)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteDialog({ open: true, type: 'education_level', item: level })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t">
                            {levelGrades.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-4 pr-12">
                                لا توجد صفوف في هذه المرحلة
                              </p>
                            ) : (
                              <div className="divide-y">
                                {levelGrades.map((grade) => (
                                  <div 
                                    key={grade.id} 
                                    className={`flex items-center justify-between p-3 pr-12 hover:bg-muted/30 transition-colors ${!grade.is_active ? 'opacity-60' : ''}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Layers className="h-4 w-4 text-secondary" />
                                      <span>{grade.name_ar}</span>
                                      {!grade.is_active && (
                                        <Badge variant="secondary" className="text-xs">معطّل</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleToggleActive('grade_level', grade)}
                                        title={grade.is_active ? 'تعطيل' : 'تفعيل'}
                                      >
                                        {grade.is_active ? (
                                          <Power className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                          <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => openEditDialog('grade_level', grade)}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteDialog({ open: true, type: 'grade_level', item: grade })}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialog.mode === 'add' ? 'إضافة' : 'تعديل'} {dialog.type === 'education_level' ? 'مرحلة تعليمية' : 'صف دراسي'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">الاسم بالعربية <span className="text-destructive">*</span></Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder={dialog.type === 'education_level' ? 'مثال: المرحلة الابتدائية' : 'مثال: الصف السادس'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">الاسم بالإنجليزية (اختياري)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={dialog.type === 'education_level' ? 'e.g. Primary' : 'e.g. Grade 6'}
                  dir="ltr"
                />
              </div>
              {dialog.type === 'grade_level' && (
                <div className="space-y-2">
                  <Label htmlFor="grade_number">رقم الصف</Label>
                  <Input
                    id="grade_number"
                    type="number"
                    min={1}
                    max={12}
                    value={formData.grade_number}
                    onChange={(e) => setFormData({ ...formData, grade_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {dialog.mode === 'add' ? 'إضافة' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف "{deleteDialog.item?.name_ar}"؟ 
                {deleteDialog.type === 'education_level' && ' سيتم حذف جميع الصفوف المرتبطة بهذه المرحلة.'}
                {' '}هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
