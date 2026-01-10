import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, Layers } from 'lucide-react';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels, useCreateGradeLevel, useUpdateGradeLevel, useDeleteGradeLevel } from '@/hooks/useGradeLevels';

export default function GradeLevelsPage() {
  const { data: educationLevels, isLoading: levelsLoading } = useEducationLevels();
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const { data: gradeLevels, isLoading: gradesLoading } = useGradeLevels(selectedLevelId || undefined);
  
  const createGradeLevel = useCreateGradeLevel();
  const updateGradeLevel = useUpdateGradeLevel();
  const deleteGradeLevel = useDeleteGradeLevel();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [form, setForm] = useState({ name: '', name_ar: '', grade_number: 1 });

  const openDialog = (grade?: any) => {
    if (grade) {
      setEditingGrade(grade);
      setForm({ name: grade.name, name_ar: grade.name_ar, grade_number: grade.grade_number });
    } else {
      setEditingGrade(null);
      const nextNumber = (gradeLevels?.length || 0) + 1;
      setForm({ name: '', name_ar: '', grade_number: nextNumber });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ar || !selectedLevelId) return;
    
    if (editingGrade) {
      await updateGradeLevel.mutateAsync({ id: editingGrade.id, ...form });
    } else {
      await createGradeLevel.mutateAsync({
        education_level_id: selectedLevelId,
        ...form,
      });
    }
    setDialogOpen(false);
  };

  const selectedLevel = educationLevels?.find(l => l.id === selectedLevelId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">الصفوف الدراسية</h1>
              <p className="text-muted-foreground">إدارة الصفوف لكل مرحلة تعليمية</p>
            </div>
          </div>
          <Button onClick={() => openDialog()} disabled={!selectedLevelId}>
            <Plus className="h-4 w-4 ml-1" />
            إضافة صف
          </Button>
        </div>

        {/* Education Level Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">المرحلة التعليمية:</Label>
              <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={levelsLoading ? "جاري التحميل..." : "اختر المرحلة"} />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {!selectedLevelId ? (
              <p className="text-center text-muted-foreground py-8">
                اختر مرحلة تعليمية لعرض الصفوف
              </p>
            ) : gradesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : gradeLevels?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد صفوف في هذه المرحلة. أضف صفاً جديداً.
              </p>
            ) : (
              <div className="space-y-2">
                {gradeLevels?.map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{grade.grade_number}</Badge>
                      <div>
                        <span className="font-medium">{grade.name_ar}</span>
                        {grade.name && (
                          <span className="text-muted-foreground text-sm mr-2">({grade.name})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(grade)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteGradeLevel.mutate(grade.id)}>
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
            <DialogTitle>
              {editingGrade ? 'تعديل الصف' : 'إضافة صف جديد'}
              {selectedLevel && <Badge variant="secondary" className="mr-2">{selectedLevel.name_ar}</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={form.name_ar}
                onChange={(e) => setForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: الصف الأول"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. First Grade"
              />
            </div>
            <div>
              <Label>رقم الصف</Label>
              <Input
                type="number"
                min="1"
                value={form.grade_number}
                onChange={(e) => setForm(prev => ({ ...prev, grade_number: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editingGrade ? 'حفظ' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
