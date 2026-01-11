import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Grid3X3, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Zap,
  Filter
} from 'lucide-react';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { useGradingStructures } from '@/hooks/useGradingStructures';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface GradingStructure {
  id: string;
  name: string;
  name_ar: string;
  education_level_id: string | null;
  grade_level_id: string | null;
  subject_id: string | null;
  is_default: boolean;
}

export default function GradingMatrixPage() {
  const queryClient = useQueryClient();
  const { data: educationLevels, isLoading: levelsLoading } = useEducationLevels();
  const { data: gradeLevels, isLoading: gradesLoading } = useGradeLevels();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: gradingStructures, isLoading: structuresLoading } = useGradingStructures();

  // Filter state
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  
  // Bulk apply state
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [applying, setApplying] = useState(false);

  // Get structures as a map for quick lookup
  const structureMap = useMemo(() => {
    const map: Record<string, GradingStructure> = {};
    gradingStructures?.forEach(s => {
      // Key format: educationLevelId:gradeLevelId:subjectId
      if (s.grade_level_id && s.subject_id) {
        const key = `${s.education_level_id || 'any'}:${s.grade_level_id}:${s.subject_id}`;
        map[key] = s;
      }
    });
    return map;
  }, [gradingStructures]);

  // Get available templates (structures that are defaults or can be applied)
  const templates = useMemo(() => {
    return gradingStructures?.filter(s => s.is_default || (!s.grade_level_id && !s.subject_id)) || [];
  }, [gradingStructures]);

  // Filter subjects and grade levels by education level
  const filteredGradeLevels = useMemo(() => {
    if (selectedEducationLevel === 'all') return gradeLevels || [];
    return gradeLevels?.filter(g => g.education_level_id === selectedEducationLevel) || [];
  }, [gradeLevels, selectedEducationLevel]);

  const filteredSubjects = useMemo(() => {
    if (selectedEducationLevel === 'all') return subjects || [];
    return subjects?.filter(s => s.education_level_id === selectedEducationLevel) || [];
  }, [subjects, selectedEducationLevel]);

  // Check if a cell has a grading structure
  const getCellStatus = (gradeLevelId: string, subjectId: string) => {
    const gradeLevel = gradeLevels?.find(g => g.id === gradeLevelId);
    const educationLevelId = gradeLevel?.education_level_id;
    
    // Check for exact match first
    const exactKey = `${educationLevelId}:${gradeLevelId}:${subjectId}`;
    if (structureMap[exactKey]) {
      return { hasStructure: true, structure: structureMap[exactKey] };
    }
    
    // Check for any match
    const anyKey = `any:${gradeLevelId}:${subjectId}`;
    if (structureMap[anyKey]) {
      return { hasStructure: true, structure: structureMap[anyKey] };
    }
    
    return { hasStructure: false, structure: null };
  };

  // Detect conflicts (multiple structures for same subject+grade)
  const conflicts = useMemo(() => {
    const conflictList: { gradeLevelId: string; subjectId: string; structures: GradingStructure[] }[] = [];
    
    filteredGradeLevels.forEach(gradeLevel => {
      filteredSubjects.forEach(subject => {
        if (subject.education_level_id !== gradeLevel.education_level_id) return;
        
        const matchingStructures = gradingStructures?.filter(s => 
          s.grade_level_id === gradeLevel.id && 
          s.subject_id === subject.id
        ) || [];
        
        if (matchingStructures.length > 1) {
          conflictList.push({
            gradeLevelId: gradeLevel.id,
            subjectId: subject.id,
            structures: matchingStructures
          });
        }
      });
    });
    
    return conflictList;
  }, [filteredGradeLevels, filteredSubjects, gradingStructures]);

  // Stats
  const stats = useMemo(() => {
    let covered = 0;
    let uncovered = 0;
    
    filteredGradeLevels.forEach(gradeLevel => {
      filteredSubjects.forEach(subject => {
        if (subject.education_level_id !== gradeLevel.education_level_id) return;
        
        const { hasStructure } = getCellStatus(gradeLevel.id, subject.id);
        if (hasStructure) covered++;
        else uncovered++;
      });
    });
    
    return { covered, uncovered, total: covered + uncovered };
  }, [filteredGradeLevels, filteredSubjects, structureMap]);

  // Toggle cell selection
  const toggleCell = (gradeLevelId: string, subjectId: string) => {
    const key = `${gradeLevelId}:${subjectId}`;
    const newSelected = new Set(selectedCells);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCells(newSelected);
  };

  // Select all uncovered cells
  const selectAllUncovered = () => {
    const newSelected = new Set<string>();
    filteredGradeLevels.forEach(gradeLevel => {
      filteredSubjects.forEach(subject => {
        if (subject.education_level_id !== gradeLevel.education_level_id) return;
        
        const { hasStructure } = getCellStatus(gradeLevel.id, subject.id);
        if (!hasStructure) {
          newSelected.add(`${gradeLevel.id}:${subject.id}`);
        }
      });
    });
    setSelectedCells(newSelected);
  };

  // Apply template to selected cells
  const handleApplyTemplate = async () => {
    if (!selectedTemplate || selectedCells.size === 0) return;
    
    const template = gradingStructures?.find(s => s.id === selectedTemplate);
    if (!template) return;
    
    setApplying(true);
    try {
      const inserts = Array.from(selectedCells).map(key => {
        const [gradeLevelId, subjectId] = key.split(':');
        const gradeLevel = gradeLevels?.find(g => g.id === gradeLevelId);
        const subject = subjects?.find(s => s.id === subjectId);
        
        return {
          name: `${template.name} - ${subject?.name || ''} - ${gradeLevel?.name || ''}`,
          name_ar: `${template.name_ar} - ${subject?.name_ar || ''} - ${gradeLevel?.name_ar || ''}`,
          education_level_id: gradeLevel?.education_level_id || null,
          grade_level_id: gradeLevelId,
          subject_id: subjectId,
          template_id: template.id,
          structure: (template as any).structure || {},
          is_default: false,
        };
      });
      
      const { error } = await supabase
        .from('subject_grading_structures')
        .insert(inserts);
      
      if (error) throw error;
      
      toast.success(`تم تطبيق القالب على ${inserts.length} خلية بنجاح`);
      setApplyDialogOpen(false);
      setSelectedCells(new Set());
      setSelectedTemplate('');
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
    } catch (error: any) {
      toast.error('فشل في تطبيق القالب: ' + error.message);
    } finally {
      setApplying(false);
    }
  };

  const isLoading = levelsLoading || gradesLoading || subjectsLoading || structuresLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">مصفوفة أنظمة الدرجات</h1>
              <p className="text-muted-foreground">تطبيق أنظمة الدرجات على الصفوف والمواد بشكل سريع</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الخلايا</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Grid3X3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مغطاة</p>
                  <p className="text-2xl font-bold text-success">{stats.covered}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">غير مغطاة</p>
                  <p className="text-2xl font-bold text-destructive">{stats.uncovered}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تعارضات</p>
                  <p className="text-2xl font-bold text-warning">{conflicts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تم اكتشاف تعارضات!</AlertTitle>
            <AlertDescription>
              يوجد {conflicts.length} تعارض حيث تم تطبيق أكثر من نظام درجات على نفس المادة والصف.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedEducationLevel} onValueChange={setSelectedEducationLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="كل المراحل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المراحل</SelectItem>
                {educationLevels?.map(level => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={selectAllUncovered} disabled={stats.uncovered === 0}>
              تحديد كل الفارغة ({stats.uncovered})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedCells(new Set())}
              disabled={selectedCells.size === 0}
            >
              إلغاء التحديد
            </Button>
            <Button 
              onClick={() => setApplyDialogOpen(true)}
              disabled={selectedCells.size === 0}
            >
              <Zap className="h-4 w-4 ml-2" />
              تطبيق قالب ({selectedCells.size})
            </Button>
          </div>
        </div>

        {/* Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>مصفوفة الصفوف والمواد</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted text-right min-w-[150px]">الصف / المادة</th>
                      {filteredSubjects.map(subject => (
                        <th key={subject.id} className="border p-2 bg-muted text-center min-w-[100px] text-sm">
                          {subject.name_ar}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGradeLevels.map(gradeLevel => (
                      <tr key={gradeLevel.id}>
                        <td className="border p-2 bg-muted/50 font-medium">
                          <div>
                            {gradeLevel.name_ar}
                            <span className="text-xs text-muted-foreground block">
                              {educationLevels?.find(l => l.id === gradeLevel.education_level_id)?.name_ar}
                            </span>
                          </div>
                        </td>
                        {filteredSubjects.map(subject => {
                          // Skip if subject doesn't belong to same education level
                          if (subject.education_level_id !== gradeLevel.education_level_id) {
                            return (
                              <td key={subject.id} className="border p-2 bg-muted/20 text-center">
                                <span className="text-muted-foreground">-</span>
                              </td>
                            );
                          }
                          
                          const { hasStructure, structure } = getCellStatus(gradeLevel.id, subject.id);
                          const cellKey = `${gradeLevel.id}:${subject.id}`;
                          const isSelected = selectedCells.has(cellKey);
                          const hasConflict = conflicts.some(
                            c => c.gradeLevelId === gradeLevel.id && c.subjectId === subject.id
                          );
                          
                          return (
                            <td 
                              key={subject.id} 
                              className={`border p-2 text-center cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-primary/20 ring-2 ring-primary' 
                                  : hasConflict
                                    ? 'bg-warning/20'
                                    : hasStructure 
                                      ? 'bg-success/10 hover:bg-success/20' 
                                      : 'bg-destructive/10 hover:bg-destructive/20'
                              }`}
                              onClick={() => toggleCell(gradeLevel.id, subject.id)}
                              title={structure?.name_ar || 'لا يوجد نظام درجات'}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <Checkbox 
                                  checked={isSelected}
                                  className="pointer-events-none"
                                />
                                {hasConflict ? (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                ) : hasStructure ? (
                                  <Check className="h-4 w-4 text-success" />
                                ) : (
                                  <X className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Template Dialog */}
        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تطبيق قالب درجات</DialogTitle>
              <DialogDescription>
                سيتم تطبيق القالب المختار على {selectedCells.size} خلية محددة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اختر القالب</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قالب الدرجات" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradingStructures?.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {template.name_ar}
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>تنبيه</AlertTitle>
                <AlertDescription>
                  سيتم إنشاء نسخة من القالب لكل خلية محددة. الخلايا التي لديها نظام درجات مسبقاً قد تحصل على تعارض.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleApplyTemplate} disabled={applying || !selectedTemplate}>
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
