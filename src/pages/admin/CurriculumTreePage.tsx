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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
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
  Search,
  Power,
  PowerOff
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

  // Handle toggle active status
  const handleToggleActive = async (type: ItemType, item: any) => {
    try {
      const tableName = type === 'education_level' ? 'education_levels' : 
                        type === 'grade_level' ? 'grade_levels' : 'subjects';
      
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success(item.is_active ? 'تم تعطيل العنصر' : 'تم تفعيل العنصر');
      queryClient.invalidateQueries({ queryKey: [type === 'education_level' ? 'education_levels' : type === 'grade_level' ? 'grade_levels' : 'subjects'] });
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

        const { count: subjectsCount } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true })
          .eq('education_level_id', id);

        if (subjectsCount && subjectsCount > 0) {
          throw new Error(`لا يمكن حذف هذه المرحلة لأنها مرتبطة بـ ${subjectsCount} مادة/مواد دراسية. يُفضل تعطيلها بدلاً من حذفها.`);
        }
      } else if (deleteDialog.type === 'grade_level') {
        const { count: classroomsCount } = await supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true })
          .eq('grade_level_id', id);

        if (classroomsCount && classroomsCount > 0) {
          throw new Error(`لا يمكن حذف هذا الصف لأنه مرتبط بـ ${classroomsCount} فصل/فصول دراسية. يُفضل تعطيله بدلاً من حذفه.`);
        }

        const { count: subjectsCount } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true })
          .eq('grade_level_id', id);

        if (subjectsCount && subjectsCount > 0) {
          throw new Error(`لا يمكن حذف هذا الصف لأنه مرتبط بـ ${subjectsCount} مادة/مواد دراسية. يُفضل تعطيله بدلاً من حذفه.`);
        }
      } else if (deleteDialog.type === 'subject') {
        const { count: classroomsCount } = await supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', id);

        if (classroomsCount && classroomsCount > 0) {
          throw new Error(`لا يمكن حذف هذه المادة لأنها مرتبطة بـ ${classroomsCount} فصل/فصول دراسية. يُفضل تعطيلها بدلاً من حذفها.`);
        }

        const { count: gradingStructuresCount } = await supabase
          .from('subject_grading_structures')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', id);

        if (gradingStructuresCount && gradingStructuresCount > 0) {
          throw new Error(`لا يمكن حذف هذه المادة لأنها مرتبطة بـ ${gradingStructuresCount} هيكل/هياكل تقييم. يُفضل تعطيلها بدلاً من حذفها.`);
        }
      }

      const tableName = deleteDialog.type === 'education_level' ? 'education_levels' : 
                        deleteDialog.type === 'grade_level' ? 'grade_levels' : 'subjects';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('تم حذف العنصر بنجاح');
      queryClient.invalidateQueries({ queryKey: [deleteDialog.type === 'education_level' ? 'education_levels' : deleteDialog.type === 'grade_level' ? 'grade_levels' : 'subjects'] });
      setDeleteDialog({ open: false, type: 'education_level', item: null });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter by search (show all items including inactive for admin)
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
                    <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      level.is_active !== false ? 'bg-primary/5 hover:bg-primary/10' : 'bg-muted/50 opacity-60'
                    }`}>
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
                      {level.is_active === false && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">معطل</Badge>
                      )}
                      <Badge variant="secondary">{getGradeLevelsFor(level.id).length} صف</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAddDialog('grade_level', level.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog('education_level', level)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-7 w-7 ${level.is_active !== false ? 'text-green-600' : 'text-muted-foreground'}`}
                        onClick={() => handleToggleActive('education_level', level)}
                        title={level.is_active !== false ? 'تعطيل' : 'تفعيل'}
                      >
                        {level.is_active !== false ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, type: 'education_level', item: level })}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
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
                          <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            gradeLevel.is_active !== false ? 'bg-secondary/5 hover:bg-secondary/10' : 'bg-muted/50 opacity-60'
                          }`}>
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
                            {gradeLevel.is_active === false && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">معطل</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {getSubjectsFor(gradeLevel.id, level.id).length} مادة
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAddDialog('subject', gradeLevel.id)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('grade_level', gradeLevel)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-6 w-6 ${gradeLevel.is_active !== false ? 'text-green-600' : 'text-muted-foreground'}`}
                              onClick={() => handleToggleActive('grade_level', gradeLevel)}
                              title={gradeLevel.is_active !== false ? 'تعطيل' : 'تفعيل'}
                            >
                              {gradeLevel.is_active !== false ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, type: 'grade_level', item: gradeLevel })}
                              title="حذف"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <CollapsibleContent className="mr-6 mt-1 space-y-1">
                            {getSubjectsFor(gradeLevel.id, level.id).map(subject => (
                              <div 
                                key={subject.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                  subject.is_active !== false ? 'bg-accent/5 hover:bg-accent/10' : 'bg-muted/50 opacity-60'
                                }`}
                              >
                                <BookOpen className="h-4 w-4 text-accent mr-6" />
                                <span className="flex-1 text-sm">{subject.name_ar}</span>
                                {subject.is_active === false && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">معطل</Badge>
                                )}
                                {hasGradingStructure(subject.id, gradeLevel.id) ? (
                                  <Badge variant="default" className="text-xs">نظام درجات</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">بدون نظام</Badge>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('subject', subject)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-6 w-6 ${subject.is_active !== false ? 'text-green-600' : 'text-muted-foreground'}`}
                                  onClick={() => handleToggleActive('subject', subject)}
                                  title={subject.is_active !== false ? 'تعطيل' : 'تفعيل'}
                                >
                                  {subject.is_active !== false ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, type: 'subject', item: subject })}
                                  title="حذف"
                                >
                                  <Trash2 className="h-3 w-3" />
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف "{deleteDialog.item?.name_ar}"؟
                {deleteDialog.type === 'education_level' && (
                  <span className="block mt-2 text-destructive font-medium">
                    ⚠️ سيتم حذف جميع الصفوف والمواد المرتبطة بهذه المرحلة!
                  </span>
                )}
                {deleteDialog.type === 'grade_level' && (
                  <span className="block mt-2 text-destructive font-medium">
                    ⚠️ سيتم حذف جميع المواد المرتبطة بهذا الصف!
                  </span>
                )}
                <span className="block mt-2">هذا الإجراء لا يمكن التراجع عنه.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حذف'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
