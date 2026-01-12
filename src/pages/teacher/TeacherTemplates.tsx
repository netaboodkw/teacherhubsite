import { useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useTeacherTemplates, useCreateTeacherTemplate, useUpdateTeacherTemplate, useDeleteTeacherTemplate, TeacherTemplate } from '@/hooks/useTeacherTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Loader2, Edit, Trash2, Copy, FileText, LayoutGrid } from 'lucide-react';
import { GradingStructureData, GradingGroup, GradingColumn } from '@/hooks/useGradingStructures';

// Simple structure editor component
function StructureEditor({ 
  structure, 
  onChange 
}: { 
  structure: GradingStructureData; 
  onChange: (structure: GradingStructureData) => void;
}) {
  const addGroup = () => {
    const newGroup: GradingGroup = {
      id: `group_${Date.now()}`,
      name_ar: `مجموعة ${(structure.groups?.length || 0) + 1}`,
      color: '#3b82f6',
      columns: []
    };
    onChange({
      ...structure,
      groups: [...(structure.groups || []), newGroup]
    });
  };

  const updateGroup = (groupId: string, updates: Partial<GradingGroup>) => {
    onChange({
      ...structure,
      groups: structure.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    });
  };

  const deleteGroup = (groupId: string) => {
    onChange({
      ...structure,
      groups: structure.groups.filter(g => g.id !== groupId)
    });
  };

  const addColumn = (groupId: string, type: 'score' | 'total') => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: type === 'score' ? `درجة ${group.columns.length + 1}` : 'المجموع',
      type,
      max_score: type === 'score' ? 10 : 0
    };

    updateGroup(groupId, {
      columns: [...group.columns, newColumn]
    });
  };

  const updateColumn = (groupId: string, columnId: string, updates: Partial<GradingColumn>) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      columns: group.columns.map(c => c.id === columnId ? { ...c, ...updates } : c)
    });
  };

  const deleteColumn = (groupId: string, columnId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      columns: group.columns.filter(c => c.id !== columnId)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>المجموعات والأعمدة</Label>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-4 w-4 ml-1" />
          إضافة مجموعة
        </Button>
      </div>

      <ScrollArea className="h-[300px] border rounded-lg p-3">
        {(!structure.groups || structure.groups.length === 0) ? (
          <div className="text-center text-muted-foreground py-8">
            لا توجد مجموعات. اضغط على "إضافة مجموعة" للبدء.
          </div>
        ) : (
          <div className="space-y-4">
            {structure.groups.map((group, groupIndex) => (
              <Card key={group.id} className="border-r-4" style={{ borderRightColor: group.color }}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={group.name_ar}
                      onChange={(e) => updateGroup(group.id, { name_ar: e.target.value })}
                      className="h-8 flex-1"
                      placeholder="اسم المجموعة"
                    />
                    <Input
                      type="color"
                      value={group.color}
                      onChange={(e) => updateGroup(group.id, { color: e.target.value })}
                      className="h-8 w-12 p-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="space-y-2">
                    {group.columns.map((column, colIndex) => (
                      <div key={column.id} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                        <Input
                          value={column.name_ar}
                          onChange={(e) => updateColumn(group.id, column.id, { name_ar: e.target.value })}
                          className="h-7 flex-1 text-sm"
                          placeholder="اسم العمود"
                        />
                        <Badge variant={column.type === 'score' ? 'secondary' : 'default'} className="text-xs">
                          {column.type === 'score' ? 'درجة' : 'مجموع'}
                        </Badge>
                        {column.type === 'score' && (
                          <Input
                            type="number"
                            value={column.max_score}
                            onChange={(e) => updateColumn(group.id, column.id, { max_score: parseInt(e.target.value) || 0 })}
                            className="h-7 w-16 text-sm"
                            min={0}
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteColumn(group.id, column.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addColumn(group.id, 'score')}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        درجة
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addColumn(group.id, 'total')}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        مجموع
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default function TeacherTemplates() {
  const { data: templates = [], isLoading } = useTeacherTemplates();
  const createTemplate = useCreateTeacherTemplate();
  const updateTemplate = useUpdateTeacherTemplate();
  const deleteTemplate = useDeleteTeacherTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TeacherTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_ar: '',
    description: '',
    structure: { groups: [], settings: { showGrandTotal: true, showPercentage: false, passingScore: 50 } } as GradingStructureData
  });

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name_ar: '',
      description: '',
      structure: { groups: [], settings: { showGrandTotal: true, showPercentage: false, passingScore: 50 } }
    });
    setDialogOpen(true);
  };

  const openEditDialog = (template: TeacherTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name_ar: template.name_ar,
      description: template.description || '',
      structure: template.structure || { groups: [], settings: { showGrandTotal: true, showPercentage: false, passingScore: 50 } }
    });
    setDialogOpen(true);
  };

  const handleDuplicate = async (template: TeacherTemplate) => {
    try {
      await createTemplate.mutateAsync({
        name: `${template.name} (نسخة)`,
        name_ar: `${template.name_ar} (نسخة)`,
        description: template.description || undefined,
        structure: template.structure
      });
      toast.success('تم نسخ القالب بنجاح');
    } catch (error: any) {
      toast.error('فشل في نسخ القالب');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          name: formData.name_ar,
          name_ar: formData.name_ar,
          description: formData.description || undefined,
          structure: formData.structure
        });
        toast.success('تم تحديث القالب بنجاح');
      } else {
        await createTemplate.mutateAsync({
          name: formData.name_ar,
          name_ar: formData.name_ar,
          description: formData.description || undefined,
          structure: formData.structure
        });
        toast.success('تم إنشاء القالب بنجاح');
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await deleteTemplate.mutateAsync(templateToDelete);
      toast.success('تم حذف القالب بنجاح');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      toast.error('فشل في حذف القالب');
    }
  };

  const calculateTotalScore = (structure: GradingStructureData) => {
    if (!structure.groups) return 0;
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, c) => s + c.max_score, 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">قوالب الدرجات</h1>
            <p className="text-muted-foreground">أنشئ قوالب درجات خاصة بك وطبقها على فصولك</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 ml-2" />
            قالب جديد
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد قوالب</h3>
              <p className="text-muted-foreground text-center mb-4">
                أنشئ قالب درجات خاص بك لتطبيقه على فصولك
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء قالب
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name_ar}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {calculateTotalScore(template.structure)} درجة
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.structure.groups?.slice(0, 4).map((group) => (
                      <Badge
                        key={group.id}
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: group.color, color: group.color }}
                      >
                        {group.name_ar}
                      </Badge>
                    ))}
                    {(template.structure.groups?.length || 0) > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{(template.structure.groups?.length || 0) - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setTemplateToDelete(template.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">اسم القالب *</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: قالب الرياضيات"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للقالب"
                rows={2}
              />
            </div>

            <StructureEditor
              structure={formData.structure}
              onChange={(structure) => setFormData({ ...formData, structure })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingTemplate ? (
                'حفظ التغييرات'
              ) : (
                'إنشاء القالب'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeacherLayout>
  );
}
