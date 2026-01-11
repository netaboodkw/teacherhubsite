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
import { useGradingTemplates } from '@/hooks/useGradingSystem';
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
  const { data: gradingTemplates, isLoading: templatesLoading } = useGradingTemplates();

  // Filter state
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  
  // Bulk apply state
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [applying, setApplying] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);

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

  // Get available templates from grading_templates table (active only)
  const templates = useMemo(() => {
    if (!gradingTemplates) return [];
    return gradingTemplates.filter(t => t.is_active);
  }, [gradingTemplates]);

  // Filter subjects and grade levels by education level
  const filteredGradeLevels = useMemo(() => {
    if (selectedEducationLevel === 'all') return gradeLevels || [];
    return gradeLevels?.filter(g => g.education_level_id === selectedEducationLevel) || [];
  }, [gradeLevels, selectedEducationLevel]);

  // Group subjects by name_ar to avoid duplicates in the matrix header
  // Each unique subject name becomes a row, and we match by name for each grade level
  const uniqueSubjectNames = useMemo(() => {
    const filtered = selectedEducationLevel === 'all' 
      ? subjects || [] 
      : subjects?.filter(s => s.education_level_id === selectedEducationLevel) || [];
    
    // Get unique subject names
    const namesMap = new Map<string, { name_ar: string; education_level_ids: Set<string> }>();
    filtered.forEach(s => {
      if (!namesMap.has(s.name_ar)) {
        namesMap.set(s.name_ar, { 
          name_ar: s.name_ar, 
          education_level_ids: new Set([s.education_level_id]) 
        });
      } else {
        namesMap.get(s.name_ar)!.education_level_ids.add(s.education_level_id);
      }
    });
    
    return Array.from(namesMap.values());
  }, [subjects, selectedEducationLevel]);

  // Helper to find the actual subject for a grade level by name
  const getSubjectForGradeLevel = (subjectNameAr: string, gradeLevelId: string) => {
    const gradeLevel = gradeLevels?.find(g => g.id === gradeLevelId);
    if (!gradeLevel) return null;
    
    return subjects?.find(s => 
      s.name_ar === subjectNameAr && 
      s.education_level_id === gradeLevel.education_level_id &&
      (s.grade_level_id === gradeLevelId || s.grade_level_id === null)
    ) || null;
  };

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
      uniqueSubjectNames.forEach(subjectName => {
        const subject = getSubjectForGradeLevel(subjectName.name_ar, gradeLevel.id);
        if (!subject) return;
        
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
  }, [filteredGradeLevels, uniqueSubjectNames, gradingStructures, getSubjectForGradeLevel]);

  // Stats
  const stats = useMemo(() => {
    let covered = 0;
    let uncovered = 0;
    
    filteredGradeLevels.forEach(gradeLevel => {
      uniqueSubjectNames.forEach(subjectName => {
        const subject = getSubjectForGradeLevel(subjectName.name_ar, gradeLevel.id);
        if (!subject) return;
        
        const { hasStructure } = getCellStatus(gradeLevel.id, subject.id);
        if (hasStructure) covered++;
        else uncovered++;
      });
    });
    
    return { covered, uncovered, total: covered + uncovered };
  }, [filteredGradeLevels, uniqueSubjectNames, structureMap, getSubjectForGradeLevel]);

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
      uniqueSubjectNames.forEach(subjectName => {
        const subject = getSubjectForGradeLevel(subjectName.name_ar, gradeLevel.id);
        if (!subject) return;
        
        const { hasStructure } = getCellStatus(gradeLevel.id, subject.id);
        if (!hasStructure) {
          newSelected.add(`${gradeLevel.id}:${subject.id}`);
        }
      });
    });
    setSelectedCells(newSelected);
  };

  // Filter selected cells to only include those without existing structures
  const cellsWithStructure = useMemo(() => {
    const result = new Set<string>();
    selectedCells.forEach(key => {
      const [gradeLevelId, subjectId] = key.split(':');
      const { hasStructure } = getCellStatus(gradeLevelId, subjectId);
      if (hasStructure) {
        result.add(key);
      }
    });
    return result;
  }, [selectedCells, structureMap]);

  const cellsWithoutStructure = useMemo(() => {
    return new Set(Array.from(selectedCells).filter(key => !cellsWithStructure.has(key)));
  }, [selectedCells, cellsWithStructure]);

  // Apply template to selected cells
  const handleApplyTemplate = async () => {
    const cellsToApply = replaceExisting ? selectedCells : cellsWithoutStructure;
    if (!selectedTemplate || cellsToApply.size === 0) return;
    
    const template = gradingTemplates?.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    // Parse the structure from the template's description (stored as JSON)
    let structure = {};
    if (template.description) {
      try {
        structure = JSON.parse(template.description);
      } catch {
        // Not a valid JSON, use empty structure
      }
    }
    
    setApplying(true);
    try {
      // If replacing, first delete existing structures for selected cells
      if (replaceExisting && cellsWithStructure.size > 0) {
        for (const key of cellsWithStructure) {
          const [gradeLevelId, subjectId] = key.split(':');
          await supabase
            .from('subject_grading_structures')
            .delete()
            .eq('grade_level_id', gradeLevelId)
            .eq('subject_id', subjectId);
        }
      }
      
      const inserts = Array.from(cellsToApply).map(key => {
        const [gradeLevelId, subjectId] = key.split(':');
        const gradeLevel = gradeLevels?.find(g => g.id === gradeLevelId);
        
        return {
          name: template.name,
          name_ar: template.name_ar,
          education_level_id: gradeLevel?.education_level_id || null,
          grade_level_id: gradeLevelId,
          subject_id: subjectId,
          template_id: template.id,
          structure: structure,
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
      setReplaceExisting(false);
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
    } catch (error: any) {
      toast.error('فشل في تطبيق القالب: ' + error.message);
    } finally {
      setApplying(false);
    }
  };

  const isLoading = levelsLoading || gradesLoading || subjectsLoading || structuresLoading || templatesLoading;

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
                      <th className="border p-2 bg-muted text-right min-w-[150px]">المادة / الصف</th>
                      {filteredGradeLevels.map(gradeLevel => (
                        <th key={gradeLevel.id} className="border p-2 bg-muted text-center min-w-[100px] text-sm">
                          <div>
                            {gradeLevel.name_ar}
                            <span className="text-xs text-muted-foreground block">
                              {educationLevels?.find(l => l.id === gradeLevel.education_level_id)?.name_ar}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueSubjectNames.map(subjectName => (
                      <tr key={subjectName.name_ar}>
                        <td className="border p-2 bg-muted/50 font-medium">
                          {subjectName.name_ar}
                        </td>
                        {filteredGradeLevels.map(gradeLevel => {
                          const subject = getSubjectForGradeLevel(subjectName.name_ar, gradeLevel.id);
                          
                          // Skip if no subject exists for this grade level
                          if (!subject) {
                            return (
                              <td key={gradeLevel.id} className="border p-2 bg-muted/20 text-center">
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
                              key={gradeLevel.id} 
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
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تطبيق قالب درجات</DialogTitle>
              <DialogDescription>
                تم تحديد {selectedCells.size} خلية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Show breakdown of selected cells */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{cellsWithoutStructure.size}</p>
                  <p className="text-sm text-muted-foreground">فارغة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{cellsWithStructure.size}</p>
                  <p className="text-sm text-muted-foreground">لديها هيكل</p>
                </div>
              </div>

              {/* Replace existing option */}
              {cellsWithStructure.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox 
                    id="replaceExisting"
                    checked={replaceExisting}
                    onCheckedChange={(checked) => setReplaceExisting(checked === true)}
                  />
                  <div className="flex-1">
                    <label htmlFor="replaceExisting" className="text-sm font-medium cursor-pointer">
                      استبدال الهياكل الموجودة
                    </label>
                    <p className="text-xs text-muted-foreground">
                      سيتم حذف الهياكل القديمة وتطبيق القالب الجديد على جميع الخلايا المحددة
                    </p>
                  </div>
                </div>
              )}

              {cellsWithStructure.size > 0 && !replaceExisting && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>تنبيه</AlertTitle>
                  <AlertDescription>
                    {cellsWithStructure.size} خلية لديها نظام درجات مسبق وسيتم تجاهلها.
                    فعّل خيار "استبدال الهياكل الموجودة" لتطبيق القالب عليها أيضاً.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">اختر القالب</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قالب الدرجات" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        لا توجد قوالب. أنشئ قالب من صفحة "قوالب الدرجات" أولاً.
                      </div>
                    ) : (
                      templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span>{template.name_ar}</span>
                            {template.description && (
                              <span className="text-xs text-muted-foreground">
                                {template.description.length > 50 
                                  ? 'قالب كامل' 
                                  : template.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleApplyTemplate} 
                disabled={applying || !selectedTemplate || (replaceExisting ? selectedCells.size === 0 : cellsWithoutStructure.size === 0)}
                variant={replaceExisting ? "destructive" : "default"}
              >
                {applying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : replaceExisting ? (
                  `استبدال وتطبيق على ${selectedCells.size} خلية`
                ) : (
                  `تطبيق على ${cellsWithoutStructure.size} خلية`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
