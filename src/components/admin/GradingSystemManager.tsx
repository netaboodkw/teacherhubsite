import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Copy, FileText, Loader2, Calendar, Upload } from 'lucide-react';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';
import {
  useGradingPeriods,
  useCreateGradingPeriod,
  useUpdateGradingPeriod,
  useDeleteGradingPeriod,
  useGradingTemplates,
  useGradingTemplatePeriods,
  useCreateGradingTemplate,
  useDeleteGradingTemplate,
  useApplyGradingTemplate,
  useCopyGradingPeriods,
  GradingPeriod,
} from '@/hooks/useGradingSystem';
import { TemplateUploader } from './TemplateUploader';

interface PeriodFormData {
  name: string;
  name_ar: string;
  max_score: number;
  weight: number;
}

export function GradingSystemManager() {
  const { data: levels, isLoading: levelsLoading } = useEducationLevels();
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const { data: gradeLevels } = useGradeLevels(selectedLevelId || undefined);
  const { data: subjects } = useSubjects(selectedLevelId || undefined);
  const { data: periods, isLoading: periodsLoading } = useGradingPeriods({
    education_level_id: selectedLevelId || undefined,
    grade_level_id: selectedGradeLevelId || undefined,
    subject_id: selectedSubjectId || undefined,
  });
  const { data: templates } = useGradingTemplates();

  // Mutations
  const createPeriod = useCreateGradingPeriod();
  const updatePeriod = useUpdateGradingPeriod();
  const deletePeriod = useDeleteGradingPeriod();
  const createTemplate = useCreateGradingTemplate();
  const deleteTemplate = useDeleteGradingTemplate();
  const applyTemplate = useApplyGradingTemplate();
  const copyPeriods = useCopyGradingPeriods();

  // Dialogs
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<GradingPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState<PeriodFormData>({
    name: '',
    name_ar: '',
    max_score: 100,
    weight: 1,
  });

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    periods: [{ name: '', name_ar: '', max_score: 100, weight: 1 }] as PeriodFormData[],
  });

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState({
    education_level_id: '',
    grade_level_id: '',
    subject_id: '',
  });

  // Period handlers
  const openPeriodDialog = (period?: GradingPeriod) => {
    if (period) {
      setEditingPeriod(period);
      setPeriodForm({
        name: period.name,
        name_ar: period.name_ar,
        max_score: period.max_score,
        weight: period.weight,
      });
    } else {
      setEditingPeriod(null);
      setPeriodForm({ name: '', name_ar: '', max_score: 100, weight: 1 });
    }
    setPeriodDialogOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!periodForm.name_ar || !selectedLevelId) return;

    if (editingPeriod) {
      await updatePeriod.mutateAsync({ id: editingPeriod.id, ...periodForm });
    } else {
      await createPeriod.mutateAsync({
        education_level_id: selectedLevelId,
        grade_level_id: selectedGradeLevelId || null,
        subject_id: selectedSubjectId || null,
        display_order: periods?.length || 0,
        ...periodForm,
      });
    }
    setPeriodDialogOpen(false);
  };

  // Template handlers
  const addTemplatePeriod = () => {
    setTemplateForm(prev => ({
      ...prev,
      periods: [...prev.periods, { name: '', name_ar: '', max_score: 100, weight: 1 }],
    }));
  };

  const removeTemplatePeriod = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index),
    }));
  };

  const updateTemplatePeriod = (index: number, field: keyof PeriodFormData, value: string | number) => {
    setTemplateForm(prev => ({
      ...prev,
      periods: prev.periods.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name_ar) return;
    await createTemplate.mutateAsync(templateForm);
    setTemplateDialogOpen(false);
    setTemplateForm({
      name: '',
      name_ar: '',
      description: '',
      periods: [{ name: '', name_ar: '', max_score: 100, weight: 1 }],
    });
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !selectedLevelId) return;
    await applyTemplate.mutateAsync({
      template_id: selectedTemplateId,
      education_level_id: selectedLevelId,
      grade_level_id: selectedGradeLevelId || undefined,
      subject_id: selectedSubjectId || undefined,
    });
    setApplyDialogOpen(false);
    setSelectedTemplateId('');
  };

  const handleCopyPeriods = async () => {
    if (!selectedLevelId || !copyTarget.education_level_id) return;
    await copyPeriods.mutateAsync({
      source_education_level_id: selectedLevelId,
      source_grade_level_id: selectedGradeLevelId || undefined,
      source_subject_id: selectedSubjectId || undefined,
      target_education_level_id: copyTarget.education_level_id,
      target_grade_level_id: copyTarget.grade_level_id || undefined,
      target_subject_id: copyTarget.subject_id || undefined,
    });
    setCopyDialogOpen(false);
    setCopyTarget({ education_level_id: '', grade_level_id: '', subject_id: '' });
  };

  const selectedLevel = levels?.find(l => l.id === selectedLevelId);
  const selectedGradeLevel = gradeLevels?.find(g => g.id === selectedGradeLevelId);
  const selectedSubject = subjects?.find(s => s.id === selectedSubjectId);

  return (
    <Tabs defaultValue="periods" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="periods">فترات التقييم والقوالب</TabsTrigger>
        <TabsTrigger value="upload" className="flex items-center gap-1">
          <Upload className="h-4 w-4" />
          رفع قالب
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="periods" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إعدادات نظام الدرجات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>المرحلة التعليمية</Label>
              <Select value={selectedLevelId} onValueChange={(v) => {
                setSelectedLevelId(v);
                setSelectedGradeLevelId('');
                setSelectedSubjectId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={levelsLoading ? "جاري التحميل..." : "اختر المرحلة"} />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>الصف الدراسي (اختياري)</Label>
              <Select value={selectedGradeLevelId || "all"} onValueChange={(v) => setSelectedGradeLevelId(v === "all" ? "" : v)} disabled={!selectedLevelId}>
                <SelectTrigger>
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
            
            <div className="space-y-2">
              <Label>المادة (اختياري)</Label>
              <Select value={selectedSubjectId || "all"} onValueChange={(v) => setSelectedSubjectId(v === "all" ? "" : v)} disabled={!selectedLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="كل المواد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المواد</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grading Periods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              فترات التقييم
              {selectedLevel && <Badge variant="secondary">{selectedLevel.name_ar}</Badge>}
              {selectedGradeLevel && <Badge variant="outline">{selectedGradeLevel.name_ar}</Badge>}
              {selectedSubject && <Badge>{selectedSubject.name_ar}</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              {periods && periods.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setCopyDialogOpen(true)}>
                  <Copy className="h-4 w-4 ml-1" />
                  نسخ
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setApplyDialogOpen(true)} disabled={!selectedLevelId}>
                <FileText className="h-4 w-4 ml-1" />
                من قالب
              </Button>
              <Button size="sm" onClick={() => openPeriodDialog()} disabled={!selectedLevelId}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedLevelId ? (
              <p className="text-center text-muted-foreground py-8">اختر المرحلة التعليمية أولاً</p>
            ) : periodsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : periods?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد فترات تقييم</p>
            ) : (
              <div className="space-y-2">
                {periods?.map((period) => (
                  <div key={period.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted">
                    <div>
                      <span className="font-medium">{period.name_ar}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{period.max_score} درجة</Badge>
                        <Badge variant="secondary" className="text-xs">وزن: {period.weight}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openPeriodDialog(period)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePeriod.mutate(period.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              قوالب نظام الدرجات
            </CardTitle>
            <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-1" />
              قالب جديد
            </Button>
          </CardHeader>
          <CardContent>
            {templates?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد قوالب</p>
            ) : (
              <div className="space-y-2">
                {templates?.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted">
                    <div>
                      <span className="font-medium">{template.name_ar}</span>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate.mutate(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period Dialog */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriod ? 'تعديل الفترة' : 'إضافة فترة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={periodForm.name_ar}
                onChange={(e) => setPeriodForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: الفترة الأولى"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={periodForm.name}
                onChange={(e) => setPeriodForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. First Period"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الدرجة القصوى</Label>
                <Input
                  type="number"
                  value={periodForm.max_score}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, max_score: parseFloat(e.target.value) || 100 }))}
                />
              </div>
              <div>
                <Label>الوزن</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={periodForm.weight}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 1 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSavePeriod}>{editingPeriod ? 'حفظ' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء قالب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>اسم القالب بالعربية</Label>
                <Input
                  value={templateForm.name_ar}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="مثال: نظام الفترات الثلاث"
                />
              </div>
              <div>
                <Label>الاسم بالإنجليزية (اختياري)</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>وصف (اختياري)</Label>
              <Input
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للقالب"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>الفترات</Label>
                <Button type="button" size="sm" variant="outline" onClick={addTemplatePeriod}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة فترة
                </Button>
              </div>
              {templateForm.periods.map((period, index) => (
                <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs">الاسم بالعربية</Label>
                    <Input
                      value={period.name_ar}
                      onChange={(e) => updateTemplatePeriod(index, 'name_ar', e.target.value)}
                      placeholder="الفترة الأولى"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">الدرجة</Label>
                    <Input
                      type="number"
                      value={period.max_score}
                      onChange={(e) => updateTemplatePeriod(index, 'max_score', parseFloat(e.target.value) || 100)}
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">الوزن</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={period.weight}
                      onChange={(e) => updateTemplatePeriod(index, 'weight', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  {templateForm.periods.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTemplatePeriod(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveTemplate}>إنشاء القالب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Template Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تطبيق قالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اختر القالب</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر قالب" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>{template.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              سيتم إنشاء فترات التقييم للمرحلة والصف والمادة المحددة حالياً
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleApplyTemplate} disabled={!selectedTemplateId}>تطبيق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نسخ نظام الدرجات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              نسخ فترات التقييم إلى مرحلة/صف/مادة أخرى
            </p>
            <div>
              <Label>المرحلة الهدف</Label>
              <Select value={copyTarget.education_level_id} onValueChange={(v) => setCopyTarget(prev => ({ ...prev, education_level_id: v, grade_level_id: '', subject_id: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الصف الهدف (اختياري)</Label>
              <Select value={copyTarget.grade_level_id || "all"} onValueChange={(v) => setCopyTarget(prev => ({ ...prev, grade_level_id: v === "all" ? "" : v }))} disabled={!copyTarget.education_level_id}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الصفوف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الصفوف</SelectItem>
                  {gradeLevels?.filter(g => g.education_level_id === copyTarget.education_level_id).map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>{grade.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المادة الهدف (اختياري)</Label>
              <Select value={copyTarget.subject_id || "all"} onValueChange={(v) => setCopyTarget(prev => ({ ...prev, subject_id: v === "all" ? "" : v }))} disabled={!copyTarget.education_level_id}>
                <SelectTrigger>
                  <SelectValue placeholder="كل المواد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المواد</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleCopyPeriods} disabled={!copyTarget.education_level_id}>نسخ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TabsContent>
      
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع قالب درجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateUploader />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
