import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useEducationLevels, useCreateEducationLevel, useUpdateEducationLevel, useDeleteEducationLevel } from '@/hooks/useEducationLevels';
import { useGradeLevels, useCreateGradeLevel, useUpdateGradeLevel, useDeleteGradeLevel } from '@/hooks/useGradeLevels';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, GradeType } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, BookOpen, GraduationCap, Loader2, Shield, Users, ExternalLink, Layers, Calculator } from 'lucide-react';
import { GradingSystemManager } from '@/components/admin/GradingSystemManager';

const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  exam: 'اختبار',
  assignment: 'واجب',
  participation: 'مشاركة',
  project: 'مشروع',
};

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: levels, isLoading: levelsLoading } = useEducationLevels();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const { data: gradeLevels, isLoading: gradeLevelsLoading } = useGradeLevels(selectedLevelId || undefined);
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(selectedLevelId || undefined);
  
  // Level dialog
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<{ id: string; name: string; name_ar: string } | null>(null);
  const [levelForm, setLevelForm] = useState({ name: '', name_ar: '' });
  
  // Grade level dialog
  const [gradeLevelDialogOpen, setGradeLevelDialogOpen] = useState(false);
  const [editingGradeLevel, setEditingGradeLevel] = useState<any>(null);
  const [gradeLevelForm, setGradeLevelForm] = useState({ name: '', name_ar: '', grade_number: 1 });
  
  // Subject dialog
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    name_ar: '',
    weeks_count: 18,
    max_score: 100,
    grade_types: ['exam', 'assignment', 'participation', 'project'] as GradeType[],
  });

  const createLevel = useCreateEducationLevel();
  const updateLevel = useUpdateEducationLevel();
  const deleteLevel = useDeleteEducationLevel();
  
  const createGradeLevel = useCreateGradeLevel();
  const updateGradeLevel = useUpdateGradeLevel();
  const deleteGradeLevel = useDeleteGradeLevel();
  
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  if (roleLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const openLevelDialog = (level?: { id: string; name: string; name_ar: string }) => {
    if (level) {
      setEditingLevel(level);
      setLevelForm({ name: level.name, name_ar: level.name_ar });
    } else {
      setEditingLevel(null);
      setLevelForm({ name: '', name_ar: '' });
    }
    setLevelDialogOpen(true);
  };

  const handleSaveLevel = async () => {
    if (!levelForm.name_ar) return;
    
    if (editingLevel) {
      await updateLevel.mutateAsync({ id: editingLevel.id, ...levelForm });
    } else {
      await createLevel.mutateAsync(levelForm);
    }
    setLevelDialogOpen(false);
  };

  const openGradeLevelDialog = (gradeLevel?: any) => {
    if (gradeLevel) {
      setEditingGradeLevel(gradeLevel);
      setGradeLevelForm({ 
        name: gradeLevel.name, 
        name_ar: gradeLevel.name_ar,
        grade_number: gradeLevel.grade_number 
      });
    } else {
      setEditingGradeLevel(null);
      const nextNumber = (gradeLevels?.length || 0) + 1;
      setGradeLevelForm({ name: '', name_ar: '', grade_number: nextNumber });
    }
    setGradeLevelDialogOpen(true);
  };

  const handleSaveGradeLevel = async () => {
    if (!gradeLevelForm.name_ar || !selectedLevelId) return;
    
    if (editingGradeLevel) {
      await updateGradeLevel.mutateAsync({ id: editingGradeLevel.id, ...gradeLevelForm });
    } else {
      await createGradeLevel.mutateAsync({
        education_level_id: selectedLevelId,
        ...gradeLevelForm,
      });
    }
    setGradeLevelDialogOpen(false);
  };

  const openSubjectDialog = (subject?: any) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name,
        name_ar: subject.name_ar,
        weeks_count: subject.weeks_count,
        max_score: subject.max_score,
        grade_types: subject.grade_types || [],
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: '',
        name_ar: '',
        weeks_count: 18,
        max_score: 100,
        grade_types: ['exam', 'assignment', 'participation', 'project'],
      });
    }
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectForm.name_ar || !selectedLevelId) return;
    
    if (editingSubject) {
      await updateSubject.mutateAsync({ id: editingSubject.id, ...subjectForm });
    } else {
      await createSubject.mutateAsync({
        education_level_id: selectedLevelId,
        ...subjectForm,
      });
    }
    setSubjectDialogOpen(false);
  };

  const toggleGradeType = (type: GradeType) => {
    setSubjectForm(prev => ({
      ...prev,
      grade_types: prev.grade_types.includes(type)
        ? prev.grade_types.filter(t => t !== type)
        : [...prev.grade_types, type],
    }));
  };

  const selectedLevel = levels?.find(l => l.id === selectedLevelId);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
            <p className="text-muted-foreground">إدارة المراحل التعليمية والمواد والمعلمين</p>
          </div>
        </div>

        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="curriculum">المناهج والمواد</TabsTrigger>
            <TabsTrigger value="grading">نظام الدرجات</TabsTrigger>
            <TabsTrigger value="teachers">المعلمون</TabsTrigger>
          </TabsList>
          
          <TabsContent value="curriculum" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Education Levels */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                المراحل التعليمية
              </CardTitle>
              <Button size="sm" onClick={() => openLevelDialog()}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            </CardHeader>
            <CardContent>
              {levelsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {levels?.map((level) => (
                    <div
                      key={level.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLevelId === level.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedLevelId(level.id)}
                    >
                      <span className="font-medium">{level.name_ar}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLevelDialog(level);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLevel.mutate(level.id);
                          }}
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

          {/* Grade Levels */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                الصفوف الدراسية
                {selectedLevel && (
                  <Badge variant="secondary">{selectedLevel.name_ar}</Badge>
                )}
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => openGradeLevelDialog()}
                disabled={!selectedLevelId}
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            </CardHeader>
            <CardContent>
              {!selectedLevelId ? (
                <p className="text-center text-muted-foreground py-8">
                  اختر مرحلة تعليمية لعرض الصفوف
                </p>
              ) : gradeLevelsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : gradeLevels?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد صفوف في هذه المرحلة
                </p>
              ) : (
                <div className="space-y-2">
                  {gradeLevels?.map((gradeLevel) => (
                    <div
                      key={gradeLevel.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted"
                    >
                      <div>
                        <span className="font-medium">{gradeLevel.name_ar}</span>
                        <Badge variant="outline" className="text-xs mr-2">
                          {gradeLevel.grade_number}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openGradeLevelDialog(gradeLevel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGradeLevel.mutate(gradeLevel.id)}
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

          {/* Subjects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                المواد الدراسية
                {selectedLevel && (
                  <Badge variant="secondary">{selectedLevel.name_ar}</Badge>
                )}
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => openSubjectDialog()}
                disabled={!selectedLevelId}
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            </CardHeader>
            <CardContent>
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
                  لا توجد مواد في هذه المرحلة
                </p>
              ) : (
                <div className="space-y-2">
                  {subjects?.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted"
                    >
                      <div>
                        <span className="font-medium">{subject.name_ar}</span>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {subject.weeks_count} أسبوع
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {subject.max_score} درجة
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSubjectDialog(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSubject.mutate(subject.id)}
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
      </TabsContent>

      <TabsContent value="grading" className="mt-6">
        <GradingSystemManager />
      </TabsContent>
      
      <TabsContent value="teachers" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              المعلمون المسجلون
              <Badge variant="secondary">{teachers?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teachers?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا يوجد معلمون مسجلون بعد
              </p>
            ) : (
              <div className="space-y-3">
                {teachers?.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={teacher.avatar_url || ''} />
                        <AvatarFallback>
                          {teacher.full_name?.charAt(0) || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{teacher.full_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {teacher.school_name && (
                            <Badge variant="outline" className="text-xs">
                              {teacher.school_name}
                            </Badge>
                          )}
                          {teacher.education_level_name && (
                            <Badge variant="secondary" className="text-xs">
                              {teacher.education_level_name}
                            </Badge>
                          )}
                          {teacher.subject_name && (
                            <Badge className="text-xs">
                              {teacher.subject_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          تاريخ التسجيل: {new Date(teacher.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!teacher.is_profile_complete && (
                        <Badge variant="destructive" className="text-xs">
                          غير مكتمل
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" title="عرض لوحة التحكم">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLevel ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={levelForm.name_ar}
                onChange={(e) => setLevelForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: المرحلة الابتدائية"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={levelForm.name}
                onChange={(e) => setLevelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLevelDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveLevel}>
              {editingLevel ? 'حفظ' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Level Dialog */}
      <Dialog open={gradeLevelDialogOpen} onOpenChange={setGradeLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGradeLevel ? 'تعديل الصف' : 'إضافة صف جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={gradeLevelForm.name_ar}
                onChange={(e) => setGradeLevelForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: الصف الأول"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={gradeLevelForm.name}
                onChange={(e) => setGradeLevelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. First Grade"
              />
            </div>
            <div>
              <Label>رقم الصف</Label>
              <Input
                type="number"
                min="1"
                value={gradeLevelForm.grade_number}
                onChange={(e) => setGradeLevelForm(prev => ({ ...prev, grade_number: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeLevelDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveGradeLevel}>
              {editingGradeLevel ? 'حفظ' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'تعديل المادة' : 'إضافة مادة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم بالعربية</Label>
              <Input
                value={subjectForm.name_ar}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: الرياضيات"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية (اختياري)</Label>
              <Input
                value={subjectForm.name}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>عدد الأسابيع</Label>
                <Input
                  type="number"
                  value={subjectForm.weeks_count}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, weeks_count: parseInt(e.target.value) || 18 }))}
                />
              </div>
              <div>
                <Label>الدرجة القصوى</Label>
                <Input
                  type="number"
                  value={subjectForm.max_score}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
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
                      checked={subjectForm.grade_types.includes(type)}
                      onCheckedChange={() => toggleGradeType(type)}
                    />
                    <label htmlFor={type} className="text-sm">
                      {GRADE_TYPE_LABELS[type]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveSubject}>
              {editingSubject ? 'حفظ' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
