import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, FileText, Loader2, Upload, Settings, Star, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';
import {
  useGradingTemplates,
  useCreateGradingTemplate,
  useUpdateGradingTemplate,
  useDeleteGradingTemplate,
  GradingTemplate,
} from '@/hooks/useGradingSystem';
import { TemplateUploader } from './TemplateUploader';
import { useQueryClient } from '@tanstack/react-query';

interface PeriodFormData {
  name: string;
  name_ar: string;
  max_score: number;
  weight: number;
}

interface TemplateAssignment {
  education_level_id: string;
  grade_level_ids: string[];
  subject_ids: string[];
}

export function GradingSystemManager() {
  const queryClient = useQueryClient();
  const { data: levels } = useEducationLevels();
  const { data: allGradeLevels } = useGradeLevels();
  const { data: allSubjects } = useSubjects();
  const { data: templates, isLoading: templatesLoading } = useGradingTemplates();

  // Mutations
  const createTemplate = useCreateGradingTemplate();
  const updateTemplate = useUpdateGradingTemplate();
  const deleteTemplate = useDeleteGradingTemplate();

  // Template Dialog State
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GradingTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    periods: [{ name: '', name_ar: '', max_score: 100, weight: 1 }] as PeriodFormData[],
  });

  // Assignment Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GradingTemplate | null>(null);
  const [assignment, setAssignment] = useState<TemplateAssignment>({
    education_level_id: '',
    grade_level_ids: [],
    subject_ids: [],
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Default template
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  // Get filtered data based on selected education level
  const filteredGradeLevels = allGradeLevels?.filter(
    g => g.education_level_id === assignment.education_level_id
  ) || [];
  const filteredSubjects = allSubjects?.filter(
    s => s.education_level_id === assignment.education_level_id
  ) || [];

  // Template handlers
  const openTemplateDialog = async (template?: GradingTemplate) => {
    if (template) {
      setEditingTemplate(template);
      const { data: templatePeriods } = await supabase
        .from('grading_template_periods')
        .select('*')
        .eq('template_id', template.id)
        .order('display_order', { ascending: true });
      
      setTemplateForm({
        name: template.name,
        name_ar: template.name_ar,
        description: template.description || '',
        periods: templatePeriods?.map(p => ({
          name: p.name,
          name_ar: p.name_ar,
          max_score: p.max_score,
          weight: p.weight,
        })) || [{ name: '', name_ar: '', max_score: 100, weight: 1 }],
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        name_ar: '',
        description: '',
        periods: [{ name: '', name_ar: '', max_score: 100, weight: 1 }],
      });
    }
    setTemplateDialogOpen(true);
  };

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
    
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...templateForm });
    } else {
      await createTemplate.mutateAsync(templateForm);
    }
    
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      name_ar: '',
      description: '',
      periods: [{ name: '', name_ar: '', max_score: 100, weight: 1 }],
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      await deleteTemplate.mutateAsync(templateId);
    }
  };

  // Assignment handlers
  const openAssignDialog = (template: GradingTemplate) => {
    setSelectedTemplate(template);
    setAssignment({
      education_level_id: '',
      grade_level_ids: [],
      subject_ids: [],
    });
    setAssignDialogOpen(true);
  };

  const toggleGradeLevel = (gradeId: string) => {
    setAssignment(prev => ({
      ...prev,
      grade_level_ids: prev.grade_level_ids.includes(gradeId)
        ? prev.grade_level_ids.filter(id => id !== gradeId)
        : [...prev.grade_level_ids, gradeId],
    }));
  };

  const toggleSubject = (subjectId: string) => {
    setAssignment(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId],
    }));
  };

  const selectAllGradeLevels = () => {
    setAssignment(prev => ({
      ...prev,
      grade_level_ids: filteredGradeLevels.map(g => g.id),
    }));
  };

  const selectAllSubjects = () => {
    setAssignment(prev => ({
      ...prev,
      subject_ids: filteredSubjects.map(s => s.id),
    }));
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplate || !assignment.education_level_id) return;
    
    setIsAssigning(true);
    try {
      // Get template periods
      const { data: templatePeriods } = await supabase
        .from('grading_template_periods')
        .select('*')
        .eq('template_id', selectedTemplate.id)
        .order('display_order', { ascending: true });

      if (!templatePeriods || templatePeriods.length === 0) {
        toast.error('القالب لا يحتوي على فترات');
        return;
      }

      // Create grading periods for each combination
      const gradeLevels = assignment.grade_level_ids.length > 0 
        ? assignment.grade_level_ids 
        : [null];
      const subjects = assignment.subject_ids.length > 0 
        ? assignment.subject_ids 
        : [null];

      const periodsToInsert = [];
      for (const gradeId of gradeLevels) {
        for (const subjectId of subjects) {
          for (const period of templatePeriods) {
            periodsToInsert.push({
              education_level_id: assignment.education_level_id,
              grade_level_id: gradeId,
              subject_id: subjectId,
              name: period.name,
              name_ar: period.name_ar,
              max_score: period.max_score,
              weight: period.weight,
              display_order: period.display_order,
              is_active: true,
            });
          }
        }
      }

      const { error } = await supabase
        .from('grading_periods')
        .insert(periodsToInsert);

      if (error) throw error;

      toast.success(`تم تطبيق القالب على ${periodsToInsert.length / templatePeriods.length} تركيبة`);
      setAssignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('فشل في تطبيق القالب');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    setSettingDefault(templateId);
    try {
      // For now, we'll store the default in localStorage
      // In a real app, this would be stored in the database
      localStorage.setItem('default_grading_template', templateId);
      toast.success('تم تعيين القالب الافتراضي');
      queryClient.invalidateQueries({ queryKey: ['grading_templates'] });
    } catch (error) {
      toast.error('فشل في تعيين القالب الافتراضي');
    } finally {
      setSettingDefault(null);
    }
  };

  const defaultTemplateId = localStorage.getItem('default_grading_template');

  return (
    <Tabs defaultValue="templates" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="templates" className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          قوالب نظام الدرجات
        </TabsTrigger>
        <TabsTrigger value="upload" className="flex items-center gap-1">
          <Upload className="h-4 w-4" />
          رفع قالب بالذكاء الاصطناعي
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="templates" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                قوالب نظام الدرجات
              </CardTitle>
              <CardDescription className="mt-1">
                اختر قالب وقم بتطبيقه على المراحل والصفوف والمواد المطلوبة
              </CardDescription>
            </div>
            <Button onClick={() => openTemplateDialog()}>
              <Plus className="h-4 w-4 ml-1" />
              قالب جديد
            </Button>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">لا توجد قوالب</p>
                <p className="text-muted-foreground mb-4">أنشئ قالب جديد أو ارفع صورة قالب باستخدام الذكاء الاصطناعي</p>
                <Button onClick={() => openTemplateDialog()}>
                  <Plus className="h-4 w-4 ml-1" />
                  إنشاء قالب
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                  <Card key={template.id} className={`relative ${defaultTemplateId === template.id ? 'ring-2 ring-primary' : ''}`}>
                    {defaultTemplateId === template.id && (
                      <Badge className="absolute -top-2 -right-2" variant="default">
                        <Star className="h-3 w-3 ml-1" />
                        افتراضي
                      </Badge>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{template.name_ar}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="text-xs">
                          {template.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          onClick={() => openAssignDialog(template)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 ml-1" />
                          تطبيق
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openTemplateDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {defaultTemplateId !== template.id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetDefaultTemplate(template.id)}
                            disabled={settingDefault === template.id}
                          >
                            {settingDefault === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={(open) => {
          setTemplateDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            setTemplateForm({
              name: '',
              name_ar: '',
              description: '',
              periods: [{ name: '', name_ar: '', max_score: 100, weight: 1 }],
            });
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}</DialogTitle>
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
              <Button onClick={handleSaveTemplate}>{editingTemplate ? 'حفظ التغييرات' : 'إنشاء القالب'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تطبيق القالب: {selectedTemplate?.name_ar}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Education Level */}
              <div className="space-y-2">
                <Label>المرحلة التعليمية *</Label>
                <Select 
                  value={assignment.education_level_id} 
                  onValueChange={(v) => setAssignment({
                    education_level_id: v,
                    grade_level_ids: [],
                    subject_ids: [],
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة التعليمية" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels?.map((level) => (
                      <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignment.education_level_id && (
                <>
                  {/* Grade Levels */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>الصفوف الدراسية</Label>
                      <Button type="button" size="sm" variant="ghost" onClick={selectAllGradeLevels}>
                        تحديد الكل
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                      {filteredGradeLevels.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                          لا توجد صفوف لهذه المرحلة
                        </p>
                      ) : (
                        filteredGradeLevels.map((grade) => (
                          <div key={grade.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`grade-${grade.id}`}
                              checked={assignment.grade_level_ids.includes(grade.id)}
                              onCheckedChange={() => toggleGradeLevel(grade.id)}
                            />
                            <label htmlFor={`grade-${grade.id}`} className="text-sm cursor-pointer">
                              {grade.name_ar}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {assignment.grade_level_ids.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        إذا لم تحدد صفوف، سيُطبق القالب على المرحلة بشكل عام
                      </p>
                    )}
                  </div>

                  {/* Subjects */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>المواد الدراسية</Label>
                      <Button type="button" size="sm" variant="ghost" onClick={selectAllSubjects}>
                        تحديد الكل
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                      {filteredSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                          لا توجد مواد لهذه المرحلة
                        </p>
                      ) : (
                        filteredSubjects.map((subject) => (
                          <div key={subject.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={assignment.subject_ids.includes(subject.id)}
                              onCheckedChange={() => toggleSubject(subject.id)}
                            />
                            <label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer">
                              {subject.name_ar}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {assignment.subject_ids.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        إذا لم تحدد مواد، سيُطبق القالب على جميع المواد
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Summary */}
              {assignment.education_level_id && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">ملخص التطبيق:</p>
                  <ul className="text-sm space-y-1">
                    <li>• المرحلة: {levels?.find(l => l.id === assignment.education_level_id)?.name_ar}</li>
                    <li>• الصفوف: {assignment.grade_level_ids.length > 0 
                      ? `${assignment.grade_level_ids.length} صف محدد` 
                      : 'جميع الصفوف'}</li>
                    <li>• المواد: {assignment.subject_ids.length > 0 
                      ? `${assignment.subject_ids.length} مادة محددة` 
                      : 'جميع المواد'}</li>
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>إلغاء</Button>
              <Button 
                onClick={handleAssignTemplate} 
                disabled={!assignment.education_level_id || isAssigning}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    جاري التطبيق...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 ml-1" />
                    تطبيق القالب
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
      
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع قالب درجات بالذكاء الاصطناعي
            </CardTitle>
            <CardDescription>
              ارفع صورة لقالب درجات وسيتم التعرف عليه وتحويله تلقائياً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateUploader />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
