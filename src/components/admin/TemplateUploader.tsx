import { useState, useCallback } from 'react';
import { Upload, Loader2, X, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreateGradingStructure, GradingGroup, GradingColumn } from '@/hooks/useGradingStructures';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';

interface ParsedColumn {
  name: string;
  maxScore: number;
  type: 'score' | 'total';
}

interface ParsedGroup {
  name: string;
  columns: ParsedColumn[];
}

interface ParsedStructure {
  templateName: string;
  groups: ParsedGroup[];
  totalMaxScore: number;
}

export function TemplateUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedStructure, setParsedStructure] = useState<ParsedStructure | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  const { data: educationLevels } = useEducationLevels();
  const { data: gradeLevels } = useGradeLevels(selectedEducationLevel || undefined);
  const { data: subjects } = useSubjects(selectedEducationLevel || undefined, selectedGradeLevel || undefined);
  const createStructure = useCreateGradingStructure();


  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.some(t => file.type.includes(t.split('/')[1]))) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع صورة أو PDF أو Excel');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        try {
          const { data, error } = await supabase.functions.invoke('analyze-grading-template', {
            body: {
              fileBase64: base64,
              fileType: file.type,
              fileName: file.name
            }
          });

          if (error) throw error;

          if (data.structure) {
            setParsedStructure(data.structure);
            setTemplateName(data.structure.templateName || 'قالب جديد');
            toast.success('تم تحليل القالب بنجاح');
          } else {
            throw new Error('فشل في استخراج هيكل القالب');
          }
        } catch (err) {
          console.error('Analysis error:', err);
          toast.error('فشل في تحليل الملف');
        } finally {
          setIsAnalyzing(false);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('فشل في رفع الملف');
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  }, []);

  const updateGroupName = (groupIndex: number, name: string) => {
    if (!parsedStructure) return;
    const newGroups = [...parsedStructure.groups] as ParsedGroup[];
    newGroups[groupIndex] = { ...newGroups[groupIndex], name };
    setParsedStructure({ ...parsedStructure, groups: newGroups });
  };

  const updateColumn = (groupIndex: number, colIndex: number, field: keyof ParsedColumn, value: string | number) => {
    if (!parsedStructure) return;
    const newGroups = [...parsedStructure.groups] as ParsedGroup[];
    const newColumns = [...newGroups[groupIndex].columns] as ParsedColumn[];
    newColumns[colIndex] = { ...newColumns[colIndex], [field]: value };
    newGroups[groupIndex] = { ...newGroups[groupIndex], columns: newColumns };
    setParsedStructure({ ...parsedStructure, groups: newGroups });
  };

  const addColumn = (groupIndex: number) => {
    if (!parsedStructure) return;
    const newGroups = [...parsedStructure.groups] as ParsedGroup[];
    newGroups[groupIndex].columns.push({ name: 'عمود جديد', maxScore: 1, type: 'score' });
    setParsedStructure({ ...parsedStructure, groups: newGroups });
  };

  const removeColumn = (groupIndex: number, colIndex: number) => {
    if (!parsedStructure) return;
    const newGroups = [...parsedStructure.groups] as ParsedGroup[];
    newGroups[groupIndex].columns.splice(colIndex, 1);
    setParsedStructure({ ...parsedStructure, groups: newGroups });
  };

  const addGroup = () => {
    if (!parsedStructure) return;
    const newGroups: ParsedGroup[] = [...parsedStructure.groups, {
      name: 'مجموعة جديدة',
      columns: [{ name: 'عمود 1', maxScore: 1, type: 'score' as const }]
    }];
    setParsedStructure({ ...parsedStructure, groups: newGroups });
  };

  const removeGroup = (groupIndex: number) => {
    if (!parsedStructure) return;
    const newGroups = parsedStructure.groups.filter((_, i) => i !== groupIndex);
    setParsedStructure({ ...parsedStructure, groups: newGroups });
  };

  const calculateTotalMaxScore = () => {
    if (!parsedStructure) return 0;
    return parsedStructure.groups.reduce((total, group) => {
      return total + group.columns.reduce((groupTotal, col) => {
        return groupTotal + (col.type === 'total' ? 0 : col.maxScore);
      }, 0);
    }, 0);
  };

  // Convert ParsedGroup to GradingGroup format for saving
  const convertToGradingGroups = (groups: ParsedGroup[]): GradingGroup[] => {
    return groups.map((group, groupIndex) => ({
      id: `group-${groupIndex}`,
      name_ar: group.name,
      color: 'bg-primary',
      columns: group.columns.map((col, colIndex): GradingColumn => ({
        id: `col-${groupIndex}-${colIndex}`,
        name_ar: col.name,
        max_score: col.maxScore,
        type: col.type
      }))
    }));
  };

  const handleSave = async () => {
    if (!parsedStructure || !templateName) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    try {
      const gradingGroups = convertToGradingGroups(parsedStructure.groups);
      
      await createStructure.mutateAsync({
        name: templateName,
        name_ar: templateName,
        structure: {
          groups: gradingGroups,
          settings: {
            showPercentage: true,
            passingScore: 50
          }
        },
        education_level_id: selectedEducationLevel || null,
        grade_level_id: selectedGradeLevel || null,
        subject_id: selectedSubject || null,
        is_default: false
      });

      toast.success('تم حفظ القالب بنجاح');
      setParsedStructure(null);
      setTemplateName('');
      setSelectedEducationLevel('');
      setSelectedGradeLevel('');
      setSelectedSubject('');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('فشل في حفظ القالب');
    }
  };

  const handleReset = () => {
    setParsedStructure(null);
    setTemplateName('');
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!parsedStructure && (
        <Card className="border-dashed">
          <CardContent className="p-8">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isAnalyzing ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">جاري تحليل القالب...</p>
                  <p className="text-sm text-muted-foreground">قد يستغرق هذا بضع ثوانٍ</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">ارفع قالب الدرجات</p>
                  <p className="text-sm text-muted-foreground text-center">
                    يدعم صور (PNG, JPG) و PDF و Excel<br />
                    الحد الأقصى: 10 ميجابايت
                  </p>
                </>
              )}
            </label>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      {parsedStructure && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">تحرير القالب</h3>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Template Name */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>اسم القالب</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="أدخل اسم القالب"
              />
            </div>
            <div>
              <Label>المرحلة التعليمية (اختياري)</Label>
              <Select value={selectedEducationLevel || "all"} onValueChange={(v) => setSelectedEducationLevel(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المراحل</SelectItem>
                  {educationLevels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEducationLevel && (
              <div>
                <Label>الصف الدراسي (اختياري)</Label>
                <Select value={selectedGradeLevel || "all"} onValueChange={(v) => setSelectedGradeLevel(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصفوف</SelectItem>
                    {gradeLevels?.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>{grade.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedEducationLevel && (
              <div>
                <Label>المادة (اختياري)</Label>
                <Select value={selectedSubject || "all"} onValueChange={(v) => setSelectedSubject(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المواد</SelectItem>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Groups Editor */}
          <div className="space-y-4">
            {parsedStructure.groups.map((group, groupIndex) => (
              <Card key={groupIndex}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={group.name}
                      onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                      className="font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGroup(groupIndex)}
                      disabled={parsedStructure.groups.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {group.columns.map((col, colIndex) => (
                      <div key={colIndex} className="flex items-center gap-2">
                        <Input
                          value={col.name}
                          onChange={(e) => updateColumn(groupIndex, colIndex, 'name', e.target.value)}
                          placeholder="اسم العمود"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={col.maxScore}
                          onChange={(e) => updateColumn(groupIndex, colIndex, 'maxScore', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min={0}
                        />
                        <Select
                          value={col.type}
                          onValueChange={(v) => updateColumn(groupIndex, colIndex, 'type', v)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="score">درجة</SelectItem>
                            <SelectItem value="total">مجموع</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeColumn(groupIndex, colIndex)}
                          disabled={group.columns.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addColumn(groupIndex)}
                      className="w-full mt-2"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة عمود
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" onClick={addGroup} className="w-full">
              <Plus className="h-4 w-4 ml-1" />
              إضافة مجموعة
            </Button>
          </div>

          {/* Summary & Save */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إجمالي الدرجات: {calculateTotalMaxScore()}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedStructure.groups.length} مجموعات • 
                    {parsedStructure.groups.reduce((t, g) => t + g.columns.length, 0)} أعمدة
                  </p>
                </div>
                <Button onClick={handleSave} disabled={createStructure.isPending}>
                  {createStructure.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  ) : (
                    <Save className="h-4 w-4 ml-1" />
                  )}
                  حفظ القالب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
