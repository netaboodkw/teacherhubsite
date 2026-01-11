import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, GradeType } from '@/hooks/useSubjects';

const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  exam: 'اختبار',
  assignment: 'واجب',
  participation: 'مشاركة',
  project: 'مشروع',
};

export default function SubjectsPage() {
  const navigate = useNavigate();
  const { data: educationLevels, isLoading: levelsLoading } = useEducationLevels();
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string>('');
  const { data: gradeLevels } = useGradeLevels(selectedLevelId || undefined);
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(selectedLevelId || undefined, selectedGradeLevelId || undefined);
  
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    weeks_count: 18,
    max_score: 100,
    grade_types: ['exam', 'assignment', 'participation', 'project'] as GradeType[],
    grade_level_id: '' as string,
  });

  const openDialog = (subject?: any) => {
    if (subject) {
      setEditingSubject(subject);
      setForm({
        name: subject.name,
        name_ar: subject.name_ar,
        weeks_count: subject.weeks_count,
        max_score: subject.max_score,
        grade_types: subject.grade_types || [],
        grade_level_id: subject.grade_level_id || '',
      });
    } else {
      setEditingSubject(null);
      setForm({
        name: '',
        name_ar: '',
        weeks_count: 18,
        max_score: 100,
        grade_types: ['exam', 'assignment', 'participation', 'project'],
        grade_level_id: selectedGradeLevelId || '',
      });
    }
    setDialogOpen(true);
  };

  const toggleGradeType = (type: GradeType) => {
    setForm(prev => ({
      ...prev,
      grade_types: prev.grade_types.includes(type)
        ? prev.grade_types.filter(t => t !== type)
        : [...prev.grade_types, type],
    }));
  };

  const handleSave = async () => {
    if (!form.name_ar || !selectedLevelId) return;
    
    if (editingSubject) {
      await updateSubject.mutateAsync({ 
        id: editingSubject.id, 
        ...form,
        grade_level_id: form.grade_level_id || null,
      });
      setDialogOpen(false);
    } else {
      // If no grade level selected and there are grade levels, add to all
      const result = await createSubject.mutateAsync({
        education_level_id: selectedLevelId,
        ...form,
        grade_level_id: form.grade_level_id || null,
        all_grade_levels: !form.grade_level_id && gradeLevels && gradeLevels.length > 0 
          ? gradeLevels 
          : undefined,
      });
      setDialogOpen(false);
      if (result?.id) {
        navigate(`/admin/subject-grading?subject_id=${result.id}&education_level_id=${selectedLevelId}${form.grade_level_id ? `&grade_level_id=${form.grade_level_id}` : ''}`);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">المواد الدراسية</h1>
              <p className="text-muted-foreground">إدارة المواد لكل مرحلة وصف</p>
            </div>
          </div>
          <Button onClick={() => openDialog()} disabled={!selectedLevelId}>
            <Plus className="h-4 w-4 ml-1" />
            إضافة مادة
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">المرحلة:</Label>
                <Select value={selectedLevelId} onValueChange={(v) => {
                  setSelectedLevelId(v);
                  setSelectedGradeLevelId('');
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={levelsLoading ? "جاري التحميل..." : "اختر المرحلة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels?.map((level) => (
                      <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedLevelId && gradeLevels && gradeLevels.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">الصف:</Label>
                  <Select value={selectedGradeLevelId || "all"} onValueChange={(v) => setSelectedGradeLevelId(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="كل الصفوف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الصفوف</SelectItem>
                      {gradeLevels?.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>{grade.name_ar}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {!selectedLevelId ? (
              <p className="text-center text-muted-foreground py-8">
                اختر مرحلة تعليمية لعرض المواد
              </p>
            ) : subjectsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : subjects?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد مواد. أضف مادة جديدة.
              </p>
            ) : (
              <div className="space-y-2">
                {subjects?.map((subject) => {
                  const subjectGradeLevel = gradeLevels?.find(g => g.id === subject.grade_level_id);
                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-medium">{subject.name_ar}</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {subjectGradeLevel && (
                            <Badge className="text-xs">{subjectGradeLevel.name_ar}</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{subject.weeks_count} أسبوع</Badge>
                          <Badge variant="outline" className="text-xs">{subject.max_score} درجة</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSubject.mutate(subject.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'تعديل المادة' : 'إضافة مادة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الصف الدراسي</Label>
              <Select value={form.grade_level_id || "all"} onValueChange={(v) => setForm(prev => ({ ...prev, grade_level_id: v === "all" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الصفوف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {gradeLevels?.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>{grade.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.grade_level_id && gradeLevels && gradeLevels.length > 0 && !editingSubject && (
                <p className="text-xs text-muted-foreground mt-1">
                  سيتم إضافة المادة لجميع الصفوف ({gradeLevels.length} صفوف)
                </p>
              )}
            </div>
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={form.name_ar}
                onChange={(e) => setForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: الرياضيات"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>عدد الأسابيع</Label>
                <Input
                  type="number"
                  value={form.weeks_count}
                  onChange={(e) => setForm(prev => ({ ...prev, weeks_count: parseInt(e.target.value) || 18 }))}
                />
              </div>
              <div>
                <Label>الدرجة القصوى</Label>
                <Input
                  type="number"
                  value={form.max_score}
                  onChange={(e) => setForm(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">أنواع التقييم</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(GRADE_TYPE_LABELS) as GradeType[]).map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={type}
                      checked={form.grade_types.includes(type)}
                      onCheckedChange={() => toggleGradeType(type)}
                    />
                    <label htmlFor={type} className="text-sm">{GRADE_TYPE_LABELS[type]}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editingSubject ? 'حفظ' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
