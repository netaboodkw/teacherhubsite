import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  TreePine, 
  ChevronDown, 
  ChevronLeft, 
  Plus, 
  Edit, 
  Trash2, 
  GraduationCap,
  BookOpen,
  Layers,
  Loader2,
  Search
} from 'lucide-react';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { useGradingStructures } from '@/hooks/useGradingStructures';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type ItemType = 'education_level' | 'grade_level' | 'subject';

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
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: gradingStructures } = useGradingStructures();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>({ open: false, mode: 'add', type: 'education_level' });
  const [formData, setFormData] = useState({ name: '', name_ar: '', grade_number: 1 });
  const [saving, setSaving] = useState(false);

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

  // Toggle grade expansion
  const toggleGrade = (gradeId: string) => {
    const newExpanded = new Set(expandedGrades);
    if (newExpanded.has(gradeId)) {
      newExpanded.delete(gradeId);
    } else {
      newExpanded.add(gradeId);
    }
    setExpandedGrades(newExpanded);
  };

  // Expand all
  const expandAll = () => {
    setExpandedLevels(new Set(educationLevels?.map(l => l.id) || []));
    setExpandedGrades(new Set(gradeLevels?.map(g => g.id) || []));
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedLevels(new Set());
    setExpandedGrades(new Set());
  };

  // Get grade levels for education level
  const getGradeLevelsFor = (educationLevelId: string) => {
    return gradeLevels?.filter(g => g.education_level_id === educationLevelId) || [];
  };

  // Get subjects for grade level
  const getSubjectsFor = (gradeLevelId: string, educationLevelId: string) => {
    return subjects?.filter(s => 
      (s.grade_level_id === gradeLevelId) || 
      (s.education_level_id === educationLevelId && !s.grade_level_id)
    ) || [];
  };

  // Check if subject has grading structure
  const hasGradingStructure = (subjectId: string, gradeLevelId: string) => {
    return gradingStructures?.some(s => 
      s.subject_id === subjectId && s.grade_level_id === gradeLevelId
    ) || false;
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
        queryClient.invalidateQueries({ queryKey: ['education-levels'] });
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
        queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
      } else if (dialog.type === 'subject') {
        const gradeLevel = gradeLevels?.find(g => g.id === dialog.parentId);
        if (dialog.mode === 'add') {
          const { error } = await supabase
            .from('subjects')
            .insert({ 
              name: formData.name || formData.name_ar, 
              name_ar: formData.name_ar,
              education_level_id: gradeLevel?.education_level_id,
              grade_level_id: dialog.parentId
            });
          if (error) throw error;
          toast.success('تمت إضافة المادة الدراسية');
        } else {
          const { error } = await supabase
            .from('subjects')
            .update({ name: formData.name || formData.name_ar, name_ar: formData.name_ar })
            .eq('id', dialog.item.id);
          if (error) throw error;
          toast.success('تم تحديث المادة الدراسية');
        }
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
      }

      setDialog({ ...dialog, open: false });
    } catch (error: any) {
      toast.error('فشل في الحفظ: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter by search
  const filteredLevels = useMemo(() => {
    if (!searchTerm) return educationLevels || [];
    
    return educationLevels?.filter(level => {
      const levelMatch = level.name_ar.includes(searchTerm);
      const gradesMatch = getGradeLevelsFor(level.id).some(g => g.name_ar.includes(searchTerm));
      const subjectsMatch = subjects?.some(s => 
        s.education_level_id === level.id && s.name_ar.includes(searchTerm)
      );
      return levelMatch || gradesMatch || subjectsMatch;
    }) || [];
  }, [educationLevels, searchTerm, gradeLevels, subjects]);

  const isLoading = levelsLoading || gradesLoading || subjectsLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TreePine className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">شجرة المناهج</h1>
              <p className="text-muted-foreground">إدارة المراحل والصفوف والمواد بشكل هرمي</p>
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
              placeholder="بحث في الشجرة..."
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
        <div className="grid grid-cols-3 gap-4">
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
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{subjects?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">مادة دراسية</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tree */}
        <Card>
          <CardHeader>
            <CardTitle>هيكل المناهج</CardTitle>
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
              <div className="space-y-2">
                {filteredLevels.map(level => (
                  <Collapsible 
                    key={level.id} 
                    open={expandedLevels.has(level.id)}
                    onOpenChange={() => toggleLevel(level.id)}
                  >
                    {/* Education Level */}
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {expandedLevels.has(level.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <span className="font-medium flex-1">{level.name_ar}</span>
                      <Badge variant="secondary">{getGradeLevelsFor(level.id).length} صف</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAddDialog('grade_level', level.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog('education_level', level)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent className="mr-6 mt-1 space-y-1">
                      {getGradeLevelsFor(level.id).map(gradeLevel => (
                        <Collapsible 
                          key={gradeLevel.id}
                          open={expandedGrades.has(gradeLevel.id)}
                          onOpenChange={() => toggleGrade(gradeLevel.id)}
                        >
                          {/* Grade Level */}
                          <div className="flex items-center gap-2 p-2 rounded-lg border bg-secondary/5 hover:bg-secondary/10 transition-colors">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {expandedGrades.has(gradeLevel.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronLeft className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <Layers className="h-4 w-4 text-secondary" />
                            <span className="flex-1">{gradeLevel.name_ar}</span>
                            <Badge variant="outline" className="text-xs">
                              {getSubjectsFor(gradeLevel.id, level.id).length} مادة
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAddDialog('subject', gradeLevel.id)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('grade_level', gradeLevel)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>

                          <CollapsibleContent className="mr-6 mt-1 space-y-1">
                            {getSubjectsFor(gradeLevel.id, level.id).map(subject => (
                              <div 
                                key={subject.id}
                                className="flex items-center gap-2 p-2 rounded-lg border bg-accent/5 hover:bg-accent/10 transition-colors"
                              >
                                <BookOpen className="h-4 w-4 text-accent mr-6" />
                                <span className="flex-1 text-sm">{subject.name_ar}</span>
                                {hasGradingStructure(subject.id, gradeLevel.id) ? (
                                  <Badge variant="default" className="text-xs">نظام درجات</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">بدون نظام</Badge>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('subject', subject)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {getSubjectsFor(gradeLevel.id, level.id).length === 0 && (
                              <p className="text-sm text-muted-foreground py-2 pr-8">لا توجد مواد</p>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                      {getGradeLevelsFor(level.id).length === 0 && (
                        <p className="text-sm text-muted-foreground py-2">لا توجد صفوف</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {dialog.mode === 'add' ? 'إضافة' : 'تعديل'}{' '}
                {dialog.type === 'education_level' ? 'مرحلة تعليمية' : 
                 dialog.type === 'grade_level' ? 'صف دراسي' : 'مادة دراسية'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم بالعربي</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="أدخل الاسم بالعربي"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزي (اختياري)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name in English"
                  dir="ltr"
                />
              </div>
              {dialog.type === 'grade_level' && (
                <div className="space-y-2">
                  <Label>رقم الصف</Label>
                  <Input
                    type="number"
                    min="1"
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
