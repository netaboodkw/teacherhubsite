import { useState, useCallback } from 'react';
import { Upload, Loader2, X, Save, Plus, Trash2, Image, RefreshCw, Sparkles, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GradingStructureData, GradingGroup, GradingColumn } from '@/hooks/useGradingStructures';

interface ParsedColumn {
  name: string;
  maxScore: number;
  type: 'score' | 'total';
}

interface ParsedGroup {
  name: string;
  columns: ParsedColumn[];
}

interface DetectedInfo {
  subject?: string;
  grade?: string;
  semester?: string;
}

interface ParsedStructure {
  templateName: string;
  groups: ParsedGroup[];
  totalMaxScore: number;
  detectedInfo?: DetectedInfo;
}

interface AITemplateCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateReady: (templateName: string, structure: GradingStructureData) => void;
}

export function AITemplateCreator({ open, onOpenChange, onTemplateReady }: AITemplateCreatorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedStructure, setParsedStructure] = useState<ParsedStructure | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        if (file.type.startsWith('image/')) {
          setUploadedImage(reader.result as string);
        }
        
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
            toast.success('تم تحليل القالب بنجاح بالذكاء الاصطناعي');
          } else {
            throw new Error('فشل في استخراج هيكل القالب');
          }
        } catch (err: any) {
          console.error('Analysis error:', err);
          if (err.message?.includes('429') || err.message?.includes('rate')) {
            toast.error('تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً');
          } else if (err.message?.includes('402')) {
            toast.error('يرجى إضافة رصيد لحساب AI');
          } else {
            toast.error('فشل في تحليل الملف');
          }
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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setCurrentFile(file);
    setIsUploading(true);
    await analyzeFile(file);
  }, [analyzeFile]);

  const handleReanalyze = useCallback(async () => {
    if (!currentFile) return;
    await analyzeFile(currentFile);
  }, [currentFile, analyzeFile]);

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

  // Convert ParsedGroup to GradingGroup format
  const convertToGradingStructure = (): GradingStructureData => {
    if (!parsedStructure) return { groups: [], settings: { showGrandTotal: false, showPercentage: false, passingScore: 50 } };
    
    const GROUP_COLORS = ['#bfdbfe', '#bbf7d0', '#fef08a', '#fbcfe8', '#ddd6fe', '#fed7aa', '#a5f3fc', '#fecdd3'];
    
    const groups: GradingGroup[] = parsedStructure.groups.map((group, groupIndex) => {
      const groupId = `group-${Date.now()}-${groupIndex}`;
      
      // First pass: create all score columns and collect their IDs
      const scoreColumnIds: string[] = [];
      const columns: GradingColumn[] = [];
      
      group.columns.forEach((col, colIndex) => {
        const colId = `col-${Date.now()}-${groupIndex}-${colIndex}`;
        
        if (col.type === 'score') {
          scoreColumnIds.push(colId);
          columns.push({
            id: colId,
            name_ar: col.name,
            max_score: col.maxScore,
            type: 'score'
          });
        } else if (col.type === 'total') {
          // For total columns, set internalSourceColumns to all previous score columns
          columns.push({
            id: colId,
            name_ar: col.name,
            max_score: 0, // Will be calculated
            type: 'internal_sum',
            internalSourceColumns: [...scoreColumnIds] // Copy all score column IDs collected so far
          });
        }
      });
      
      return {
        id: groupId,
        name_ar: group.name,
        color: GROUP_COLORS[groupIndex % GROUP_COLORS.length],
        columns
      };
    });

    return {
      groups,
      settings: {
        showGrandTotal: false,
        showPercentage: false,
        passingScore: 50
      }
    };
  };

  const handleUseTemplate = () => {
    if (!parsedStructure || !templateName) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    const structure = convertToGradingStructure();
    onTemplateReady(templateName, structure);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setParsedStructure(null);
    setTemplateName('');
    setUploadedImage(null);
    setCurrentFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            إنشاء قالب بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            ارفع صورة جدول درجات وسيتم تحليلها تلقائياً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                      <div className="relative inline-block mb-4">
                        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                        <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
                      </div>
                      <p className="text-lg font-medium">جاري تحليل القالب بالذكاء الاصطناعي...</p>
                      <p className="text-sm text-muted-foreground">يتم استخراج الهيكل والدرجات تلقائياً</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block mb-4">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                        <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1" />
                      </div>
                      <p className="text-lg font-medium mb-2">ارفع صورة جدول الدرجات</p>
                      <p className="text-sm text-muted-foreground text-center">
                        الذكاء الاصطناعي سيتعرف على هيكل القالب تلقائياً<br />
                        يدعم صور (PNG, JPG) و PDF و Excel • الحد: 10 ميجابايت
                      </p>
                      <Badge variant="secondary" className="mt-3">
                        <Sparkles className="h-3 w-3 ml-1" />
                        مدعوم بالذكاء الاصطناعي
                      </Badge>
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">تم التعرف بالذكاء الاصطناعي</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {currentFile && (
                    <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={isAnalyzing}>
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="mr-1">إعادة التحليل</span>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Image Preview */}
              {uploadedImage && (
                <Card className="overflow-hidden">
                  <CardContent className="p-2">
                    <div className="relative">
                      <img 
                        src={uploadedImage} 
                        alt="صورة القالب" 
                        className="w-full max-h-48 object-contain rounded-lg bg-muted"
                      />
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        <Image className="h-3 w-3 ml-1" />
                        الصورة الأصلية
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detected Info */}
              {parsedStructure.detectedInfo && (
                <div className="flex flex-wrap gap-2">
                  {parsedStructure.detectedInfo.subject && (
                    <Badge variant="outline">المادة: {parsedStructure.detectedInfo.subject}</Badge>
                  )}
                  {parsedStructure.detectedInfo.grade && (
                    <Badge variant="outline">الصف: {parsedStructure.detectedInfo.grade}</Badge>
                  )}
                  {parsedStructure.detectedInfo.semester && (
                    <Badge variant="outline">الفصل: {parsedStructure.detectedInfo.semester}</Badge>
                  )}
                </div>
              )}

              {/* Template Name */}
              <div>
                <Label>اسم القالب</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="أدخل اسم القالب"
                  className="mt-1"
                />
              </div>

              {/* Groups Editor */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {parsedStructure.groups.map((group, groupIndex) => (
                  <Card key={groupIndex} className="border-r-4 border-r-primary/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          value={group.name}
                          onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                          className="h-8 flex-1"
                          placeholder="اسم المجموعة"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeGroup(groupIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {group.columns.map((col, colIndex) => (
                          <div key={colIndex} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                            <Input
                              value={col.name}
                              onChange={(e) => updateColumn(groupIndex, colIndex, 'name', e.target.value)}
                              className="h-7 flex-1 text-sm"
                              placeholder="اسم العمود"
                            />
                            <Badge variant={col.type === 'total' ? 'default' : 'secondary'} className="text-xs">
                              {col.type === 'total' ? 'مجموع' : 'درجة'}
                            </Badge>
                            <Input
                              type="number"
                              value={col.maxScore}
                              onChange={(e) => updateColumn(groupIndex, colIndex, 'maxScore', parseInt(e.target.value) || 0)}
                              className="h-7 w-16 text-sm"
                              min={0}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeColumn(groupIndex, colIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs w-full"
                          onClick={() => addColumn(groupIndex)}
                        >
                          <Plus className="h-3 w-3 ml-1" />
                          إضافة عمود
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addGroup}
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة مجموعة
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          {parsedStructure && (
            <Button onClick={handleUseTemplate}>
              <Save className="h-4 w-4 ml-2" />
              استخدام القالب
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
