import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowRight, 
  GripVertical, 
  Calculator,
  Table,
  Settings2,
  CheckCircle2,
  FileText,
  Palette,
  Upload,
  Sparkles,
  Loader2,
  Image,
  RefreshCw
} from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { 
  useDefaultGradingStructures, 
  useCreateGradingStructure,
  GradingGroup,
  GradingColumn,
  GradingStructureData
} from '@/hooks/useGradingStructures';

const GROUP_COLORS = [
  { id: 'yellow', color: '#fef3c7', name: 'أصفر' },
  { id: 'green', color: '#d1fae5', name: 'أخضر' },
  { id: 'blue', color: '#dbeafe', name: 'أزرق' },
  { id: 'red', color: '#fecaca', name: 'أحمر' },
  { id: 'purple', color: '#e9d5ff', name: 'بنفسجي' },
  { id: 'orange', color: '#fed7aa', name: 'برتقالي' },
];

export default function SubjectGradingSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subject_id');
  const educationLevelId = searchParams.get('education_level_id');
  const gradeLevelId = searchParams.get('grade_level_id');

  const { data: subjects } = useSubjects(educationLevelId || undefined, gradeLevelId || undefined);
  const { data: levels } = useEducationLevels();
  const { data: gradeLevels } = useGradeLevels(educationLevelId || undefined);
  const { data: defaultStructures } = useDefaultGradingStructures();
  const createStructure = useCreateGradingStructure();

  const subject = subjects?.find(s => s.id === subjectId);
  const educationLevel = levels?.find(l => l.id === educationLevelId);
  const gradeLevel = gradeLevels?.find(g => g.id === gradeLevelId);

  const [activeTab, setActiveTab] = useState<'templates' | 'upload' | 'structure' | 'preview'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Upload state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  const [structure, setStructure] = useState<GradingStructureData>({
    groups: [],
    settings: {
      showPercentage: true,
      passingScore: 50,
    }
  });

  // Load template structure when selected
  useEffect(() => {
    if (selectedTemplate && defaultStructures) {
      const template = defaultStructures.find(t => t.id === selectedTemplate);
      if (template) {
        setStructure(template.structure);
        setActiveTab('preview');
      }
    }
  }, [selectedTemplate, defaultStructures]);

  // Group management
  const addGroup = () => {
    const usedColors = structure.groups.map(g => g.color);
    const availableColor = GROUP_COLORS.find(c => !usedColors.includes(c.color)) || GROUP_COLORS[0];
    
    const newGroup: GradingGroup = {
      id: `group${Date.now()}`,
      name_ar: `مجموعة ${structure.groups.length + 1}`,
      color: availableColor.color,
      columns: [
        { id: `col${Date.now()}`, name_ar: 'عمود 1', max_score: 1, type: 'score' }
      ]
    };
    
    setStructure(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup]
    }));
  };

  const updateGroup = (groupId: string, field: keyof GradingGroup, value: any) => {
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.map(g => 
        g.id === groupId ? { ...g, [field]: value } : g
      )
    }));
  };

  const removeGroup = (groupId: string) => {
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId)
    }));
  };

  // Column management within groups
  const addColumn = (groupId: string) => {
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          columns: [...g.columns, {
            id: `col${Date.now()}`,
            name_ar: `عمود ${g.columns.length + 1}`,
            max_score: 1,
            type: 'score' as const
          }]
        };
      })
    }));
  };

  const updateColumn = (groupId: string, columnId: string, field: keyof GradingColumn, value: any) => {
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          columns: g.columns.map(c => 
            c.id === columnId ? { ...c, [field]: value } : c
          )
        };
      })
    }));
  };

  const removeColumn = (groupId: string, columnId: string) => {
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          columns: g.columns.filter(c => c.id !== columnId)
        };
      })
    }));
  };

  const addTotalColumn = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const totalScore = group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, c) => sum + c.max_score, 0);
    
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          columns: [...g.columns, {
            id: `total${Date.now()}`,
            name_ar: 'المجموع',
            max_score: totalScore,
            type: 'total' as const
          }]
        };
      })
    }));
  };

  const calculateTotalMaxScore = () => {
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, c) => s + c.max_score, 0);
    }, 0);
  };

  // AI Upload handlers
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
            // Convert parsed structure to GradingStructureData
            const groups: GradingGroup[] = data.structure.groups.map((group: any, index: number) => ({
              id: `group-${Date.now()}-${index}`,
              name_ar: group.name || `مجموعة ${index + 1}`,
              color: GROUP_COLORS[index % GROUP_COLORS.length].color,
              columns: group.columns.map((col: any, colIndex: number) => ({
                id: `col-${Date.now()}-${index}-${colIndex}`,
                name_ar: col.name || `عمود ${colIndex + 1}`,
                max_score: col.maxScore || 1,
                type: col.type || 'score'
              }))
            }));

            setStructure({
              groups,
              settings: {
                showPercentage: true,
                passingScore: 50,
              }
            });
            
            setActiveTab('structure');
            toast.success('تم تحليل النموذج بنجاح! يمكنك تعديله الآن');
          } else {
            throw new Error('فشل في استخراج هيكل القالب');
          }
        } catch (err: any) {
          console.error('Analysis error:', err);
          if (err.message?.includes('429') || err.message?.includes('rate')) {
            toast.error('تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً');
          } else {
            toast.error('فشل في تحليل الملف');
          }
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('فشل في رفع الملف');
      setIsAnalyzing(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    
    if (!validTypes.some(t => file.type.includes(t.split('/')[1]))) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع صورة أو PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    setCurrentFile(file);
    await analyzeFile(file);
  }, [analyzeFile]);

  const handleReanalyze = useCallback(async () => {
    if (!currentFile) return;
    await analyzeFile(currentFile);
  }, [currentFile, analyzeFile]);

  const handleSave = async () => {
    if (!educationLevelId) {
      toast.error('يجب تحديد المرحلة التعليمية');
      return;
    }

    try {
      await createStructure.mutateAsync({
        subject_id: subjectId,
        education_level_id: educationLevelId,
        grade_level_id: gradeLevelId,
        name: subject?.name || 'Custom Structure',
        name_ar: subject?.name_ar || 'هيكل مخصص',
        structure: structure,
        is_default: false,
      });
      navigate('/admin');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getAllColumns = () => {
    return structure.groups.flatMap(g => g.columns.map(c => ({ ...c, groupColor: g.color })));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowRight className="h-4 w-4 ml-1" />
              رجوع
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Table className="h-6 w-6 text-primary" />
                إعداد سجل الدرجات
              </h1>
              <div className="flex gap-2 mt-1">
                {educationLevel && <Badge variant="secondary">{educationLevel.name_ar}</Badge>}
                {gradeLevel && <Badge variant="outline">{gradeLevel.name_ar}</Badge>}
                {subject && <Badge>{subject.name_ar}</Badge>}
              </div>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2" disabled={structure.groups.length === 0}>
            <Save className="h-4 w-4" />
            حفظ النظام
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={activeTab === 'templates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('templates')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            القوالب الجاهزة
          </Button>
          <Button 
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            رفع نموذج
          </Button>
          <Button 
            variant={activeTab === 'structure' ? 'default' : 'outline'}
            onClick={() => setActiveTab('structure')}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            بناء مخصص
          </Button>
          <Button 
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('preview')}
            className="gap-2"
            disabled={structure.groups.length === 0}
          >
            <Table className="h-4 w-4" />
            معاينة
          </Button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <Card className="border-dashed border-2">
              <CardContent className="p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={isAnalyzing}
                  />
                  {isAnalyzing ? (
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                        <Loader2 className="h-8 w-8 animate-spin text-primary absolute -bottom-1 -right-1" />
                      </div>
                      <p className="text-xl font-medium">جاري تحليل النموذج بالذكاء الاصطناعي...</p>
                      <p className="text-muted-foreground mt-2">يتم استخراج الهيكل والدرجات تلقائياً</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block mb-4">
                        <Upload className="h-16 w-16 text-muted-foreground" />
                        <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
                      </div>
                      <p className="text-xl font-medium mb-2">ارفع صورة نموذج الدرجات</p>
                      <p className="text-muted-foreground text-center max-w-md">
                        الذكاء الاصطناعي سيتعرف على هيكل النموذج ويحوّله لسجل درجات قابل للتعديل
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        يدعم: صور (PNG, JPG, WEBP) و PDF • الحد: 10 ميجابايت
                      </p>
                      <Badge variant="secondary" className="mt-4">
                        <Sparkles className="h-3 w-3 ml-1" />
                        مدعوم بالذكاء الاصطناعي
                      </Badge>
                    </>
                  )}
                </label>
              </CardContent>
            </Card>

            {/* Image Preview */}
            {uploadedImage && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    الصورة المرفوعة
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="mr-1">إعادة التحليل</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <img 
                    src={uploadedImage} 
                    alt="النموذج المرفوع" 
                    className="w-full max-h-96 object-contain rounded-lg bg-muted"
                  />
                </CardContent>
              </Card>
            )}

            {structure.groups.length > 0 && (
              <div className="flex items-center justify-center gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">تم استخراج الهيكل بنجاح!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {structure.groups.length} مجموعات • {structure.groups.reduce((s, g) => s + g.columns.length, 0)} أعمدة
                  </p>
                </div>
                <Button onClick={() => setActiveTab('structure')}>
                  تعديل الهيكل
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('preview')}>
                  معاينة
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultStructures?.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {template.name_ar}
                  </CardTitle>
                  <CardDescription>
                    {template.structure.groups.length} مجموعات •{' '}
                    {template.structure.groups.reduce((s, g) => s + g.columns.length, 0)} أعمدة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {template.structure.groups.map((group) => (
                      <div 
                        key={group.id}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: group.color }}
                      >
                        {group.name_ar}
                      </div>
                    ))}
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">تم اختيار هذا القالب</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {/* Custom template option */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-dashed"
              onClick={() => {
                setSelectedTemplate(null);
                setActiveTab('structure');
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                  <Plus className="h-5 w-5" />
                  إنشاء هيكل مخصص
                </CardTitle>
                <CardDescription>
                  أنشئ هيكل درجات مخصص من الصفر
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="space-y-6">
            {/* Add Group Button */}
            <div className="flex justify-end">
              <Button onClick={addGroup} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مجموعة
              </Button>
            </div>

            {/* Groups */}
            <div className="space-y-4">
              {structure.groups.map((group, groupIndex) => (
                <Card key={group.id} style={{ borderRightColor: group.color, borderRightWidth: 4 }}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <Input
                        value={group.name_ar}
                        onChange={(e) => updateGroup(group.id, 'name_ar', e.target.value)}
                        className="w-48 font-medium"
                      />
                      <Select
                        value={group.color}
                        onValueChange={(v) => updateGroup(group.id, 'color', v)}
                      >
                        <SelectTrigger className="w-32">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: group.color }}
                            />
                            <Palette className="h-3 w-3" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {GROUP_COLORS.map((c) => (
                            <SelectItem key={c.id} value={c.color}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => addTotalColumn(group.id)}>
                        <Calculator className="h-4 w-4 ml-1" />
                        مجموع
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => addColumn(group.id)}>
                        <Plus className="h-4 w-4 ml-1" />
                        عمود
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeGroup(group.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {group.columns.map((column) => (
                        <div 
                          key={column.id}
                          className="flex gap-2 items-center p-3 rounded-lg border"
                          style={{ backgroundColor: group.color + '40' }}
                        >
                          <div className="flex-1 space-y-2">
                            <Input
                              value={column.name_ar}
                              onChange={(e) => updateColumn(group.id, column.id, 'name_ar', e.target.value)}
                              placeholder="اسم العمود"
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={column.max_score}
                                onChange={(e) => updateColumn(group.id, column.id, 'max_score', parseInt(e.target.value) || 0)}
                                className="w-16 text-center text-sm"
                                min={0}
                              />
                              <Select
                                value={column.type}
                                onValueChange={(v) => updateColumn(group.id, column.id, 'type', v)}
                              >
                                <SelectTrigger className="flex-1 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="score">درجة</SelectItem>
                                  <SelectItem value="total">مجموع</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeColumn(group.id, column.id)}
                            className="text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {structure.groups.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مجموعات بعد</p>
                    <p className="text-sm">أضف مجموعة للبدء في بناء هيكل الدرجات</p>
                    <Button onClick={addGroup} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة مجموعة
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary */}
            {structure.groups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    ملخص النظام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <p className="text-2xl font-bold text-primary">{structure.groups.length}</p>
                      <p className="text-sm text-muted-foreground">عدد المجموعات</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold">
                        {structure.groups.reduce((s, g) => s + g.columns.length, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">عدد الأعمدة</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-500/10">
                      <p className="text-2xl font-bold text-green-600">{calculateTotalMaxScore()}</p>
                      <p className="text-sm text-muted-foreground">مجموع الدرجات</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-orange-500/10">
                      <p className="text-2xl font-bold text-orange-600">
                        {structure.groups.reduce((s, g) => s + g.columns.filter(c => c.type === 'total').length, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">أعمدة المجاميع</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'preview' && structure.groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                معاينة سجل الدرجات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    {/* Group Headers */}
                    <tr>
                      <th 
                        className="border p-2 text-right font-medium bg-muted"
                        rowSpan={2}
                      >
                        اسم الطالب
                      </th>
                      {structure.groups.map((group) => (
                        <th
                          key={group.id}
                          colSpan={group.columns.length}
                          className="border p-2 text-center font-medium"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.name_ar}
                        </th>
                      ))}
                    </tr>
                    {/* Column Headers */}
                    <tr>
                      {structure.groups.map((group) => (
                        group.columns.map((col) => (
                          <th 
                            key={col.id}
                            className="border p-2 text-center font-medium min-w-[60px]"
                            style={{ backgroundColor: group.color + '80' }}
                          >
                            <div className="text-xs">{col.name_ar}</div>
                            <div className="text-xs text-muted-foreground">{col.max_score}</div>
                          </th>
                        ))
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample student rows */}
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="border p-2 font-medium">طالب {i}</td>
                        {structure.groups.map((group) => (
                          group.columns.map((col) => (
                            <td 
                              key={col.id}
                              className={`border p-1 text-center ${
                                col.type === 'total' ? 'font-medium' : ''
                              }`}
                              style={{ 
                                backgroundColor: col.type === 'total' 
                                  ? group.color + '60' 
                                  : group.color + '20' 
                              }}
                            >
                              <Input
                                type="number"
                                className="w-full text-center h-7 text-xs"
                                placeholder="0"
                                max={col.max_score}
                              />
                            </td>
                          ))
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-medium">
                      <td className="border p-2">الحد الأعلى</td>
                      {structure.groups.map((group) => (
                        group.columns.map((col) => (
                          <td 
                            key={col.id} 
                            className="border p-2 text-center"
                            style={{ backgroundColor: group.color + '40' }}
                          >
                            {col.max_score}
                          </td>
                        ))
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  يمكنك تعديل هذا النظام لاحقاً من إعدادات المادة
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStructure({ groups: [], settings: { showPercentage: true, passingScore: 50 } });
                    setSelectedTemplate(null);
                  }}
                >
                  مسح الكل
                </Button>
                <Button onClick={handleSave} disabled={structure.groups.length === 0}>
                  <Save className="h-4 w-4 ml-1" />
                  حفظ والمتابعة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
