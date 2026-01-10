import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowRight, 
  GripVertical, 
  Calculator,
  Table,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';

interface GradeColumn {
  id: string;
  name: string;
  name_ar: string;
  type: 'score' | 'total' | 'percentage' | 'label';
  max_score: number;
  weight: number;
  formula?: string;
  parent_id?: string;
}

interface GradeRow {
  id: string;
  name: string;
  name_ar: string;
  type: 'period' | 'category' | 'item';
  columns: { [columnId: string]: { max_score: number; weight: number } };
  children?: GradeRow[];
}

interface GradingStructure {
  columns: GradeColumn[];
  rows: GradeRow[];
  settings: {
    showPercentage: boolean;
    showTotal: boolean;
    passingScore: number;
  };
}

const defaultStructure: GradingStructure = {
  columns: [
    { id: 'col1', name: 'Week 1', name_ar: 'الأسبوع 1', type: 'score', max_score: 10, weight: 1 },
    { id: 'col2', name: 'Week 2', name_ar: 'الأسبوع 2', type: 'score', max_score: 10, weight: 1 },
    { id: 'col3', name: 'Week 3', name_ar: 'الأسبوع 3', type: 'score', max_score: 10, weight: 1 },
    { id: 'col4', name: 'Week 4', name_ar: 'الأسبوع 4', type: 'score', max_score: 10, weight: 1 },
    { id: 'total1', name: 'Period Total', name_ar: 'مجموع الفترة', type: 'total', max_score: 40, weight: 1 },
  ],
  rows: [
    { 
      id: 'row1', 
      name: 'First Period', 
      name_ar: 'الفترة الأولى', 
      type: 'period',
      columns: {}
    },
    { 
      id: 'row2', 
      name: 'Second Period', 
      name_ar: 'الفترة الثانية', 
      type: 'period',
      columns: {}
    },
  ],
  settings: {
    showPercentage: true,
    showTotal: true,
    passingScore: 50,
  }
};

export default function SubjectGradingSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subject_id');
  const educationLevelId = searchParams.get('education_level_id');
  const gradeLevelId = searchParams.get('grade_level_id');

  const { data: subjects } = useSubjects(educationLevelId || undefined, gradeLevelId || undefined);
  const { data: levels } = useEducationLevels();
  const { data: gradeLevels } = useGradeLevels(educationLevelId || undefined);

  const subject = subjects?.find(s => s.id === subjectId);
  const educationLevel = levels?.find(l => l.id === educationLevelId);
  const gradeLevel = gradeLevels?.find(g => g.id === gradeLevelId);

  const [structure, setStructure] = useState<GradingStructure>(defaultStructure);
  const [activeTab, setActiveTab] = useState<'structure' | 'preview'>('structure');

  // Column management
  const addColumn = () => {
    const newId = `col${Date.now()}`;
    setStructure(prev => ({
      ...prev,
      columns: [...prev.columns, {
        id: newId,
        name: '',
        name_ar: `عمود ${prev.columns.length + 1}`,
        type: 'score',
        max_score: 10,
        weight: 1,
      }]
    }));
  };

  const updateColumn = (id: string, field: keyof GradeColumn, value: any) => {
    setStructure(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === id ? { ...col, [field]: value } : col
      )
    }));
  };

  const removeColumn = (id: string) => {
    setStructure(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== id)
    }));
  };

  // Row management
  const addRow = (type: 'period' | 'category' | 'item') => {
    const newId = `row${Date.now()}`;
    const typeNames = {
      period: 'فترة',
      category: 'فئة',
      item: 'عنصر',
    };
    setStructure(prev => ({
      ...prev,
      rows: [...prev.rows, {
        id: newId,
        name: '',
        name_ar: `${typeNames[type]} ${prev.rows.length + 1}`,
        type,
        columns: {},
      }]
    }));
  };

  const updateRow = (id: string, field: keyof GradeRow, value: any) => {
    setStructure(prev => ({
      ...prev,
      rows: prev.rows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    }));
  };

  const removeRow = (id: string) => {
    setStructure(prev => ({
      ...prev,
      rows: prev.rows.filter(row => row.id !== id)
    }));
  };

  const addTotalColumn = () => {
    const scoreColumns = structure.columns.filter(c => c.type === 'score');
    const totalMaxScore = scoreColumns.reduce((sum, col) => sum + col.max_score, 0);
    
    const newId = `total${Date.now()}`;
    setStructure(prev => ({
      ...prev,
      columns: [...prev.columns, {
        id: newId,
        name: 'Total',
        name_ar: 'المجموع',
        type: 'total',
        max_score: totalMaxScore,
        weight: 1,
      }]
    }));
  };

  const calculateTotalMaxScore = () => {
    return structure.columns
      .filter(c => c.type === 'score')
      .reduce((sum, col) => sum + col.max_score, 0);
  };

  const handleSave = () => {
    // Here we would save the grading structure to the database
    // For now, just show success and navigate back
    toast.success('تم حفظ نظام الدرجات بنجاح');
    navigate('/admin');
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
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            حفظ النظام
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'structure' ? 'default' : 'outline'}
            onClick={() => setActiveTab('structure')}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            بناء الهيكل
          </Button>
          <Button 
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('preview')}
            className="gap-2"
          >
            <Table className="h-4 w-4" />
            معاينة
          </Button>
        </div>

        {activeTab === 'structure' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columns Configuration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">الأعمدة (عناوين الدرجات)</CardTitle>
                  <CardDescription>حدد أنواع الدرجات مثل الأسابيع، الاختبارات، المجاميع</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addTotalColumn}>
                    <Calculator className="h-4 w-4 ml-1" />
                    مجموع
                  </Button>
                  <Button size="sm" onClick={addColumn}>
                    <Plus className="h-4 w-4 ml-1" />
                    عمود
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {structure.columns.map((column, index) => (
                  <div key={column.id} className="flex gap-2 items-center p-3 border rounded-lg bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        value={column.name_ar}
                        onChange={(e) => updateColumn(column.id, 'name_ar', e.target.value)}
                        placeholder="الاسم"
                        className="col-span-2"
                      />
                      <Select 
                        value={column.type} 
                        onValueChange={(v) => updateColumn(column.id, 'type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">درجة</SelectItem>
                          <SelectItem value="total">مجموع</SelectItem>
                          <SelectItem value="percentage">نسبة</SelectItem>
                          <SelectItem value="label">تصنيف</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={column.max_score}
                        onChange={(e) => updateColumn(column.id, 'max_score', parseInt(e.target.value) || 0)}
                        placeholder="الحد الأعلى"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeColumn(column.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {structure.columns.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    أضف أعمدة لتحديد هيكل الدرجات
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Rows Configuration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">الصفوف (الفترات والفئات)</CardTitle>
                  <CardDescription>حدد الفترات مثل الفصل الأول، الثاني، إلخ</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => addRow('category')}>
                    <Plus className="h-4 w-4 ml-1" />
                    فئة
                  </Button>
                  <Button size="sm" onClick={() => addRow('period')}>
                    <Plus className="h-4 w-4 ml-1" />
                    فترة
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {structure.rows.map((row, index) => (
                  <div key={row.id} className="flex gap-2 items-center p-3 border rounded-lg bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        value={row.name_ar}
                        onChange={(e) => updateRow(row.id, 'name_ar', e.target.value)}
                        placeholder="الاسم"
                        className="col-span-2"
                      />
                      <Badge variant={row.type === 'period' ? 'default' : 'secondary'} className="justify-center">
                        {row.type === 'period' ? 'فترة' : row.type === 'category' ? 'فئة' : 'عنصر'}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeRow(row.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {structure.rows.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    أضف صفوف لتحديد الفترات والفئات
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  ملخص النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-2xl font-bold text-primary">{structure.columns.length}</p>
                    <p className="text-sm text-muted-foreground">عدد الأعمدة</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <p className="text-2xl font-bold">{structure.rows.length}</p>
                    <p className="text-sm text-muted-foreground">عدد الصفوف</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <p className="text-2xl font-bold text-green-600">{calculateTotalMaxScore()}</p>
                    <p className="text-sm text-muted-foreground">مجموع الدرجات</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-orange-500/10">
                    <p className="text-2xl font-bold text-orange-600">
                      {structure.columns.filter(c => c.type === 'total').length}
                    </p>
                    <p className="text-sm text-muted-foreground">أعمدة المجاميع</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Preview Tab */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                معاينة سجل الدرجات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-3 text-right font-medium">الطالب</th>
                      {structure.columns.map(col => (
                        <th 
                          key={col.id} 
                          className={`border p-3 text-center font-medium min-w-[80px] ${
                            col.type === 'total' ? 'bg-primary/20' : ''
                          }`}
                        >
                          <div>{col.name_ar}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {col.max_score}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {structure.rows.map(row => (
                      <tr key={row.id} className="hover:bg-muted/50">
                        <td className="border p-3 font-medium bg-muted/30">
                          {row.name_ar}
                        </td>
                        {structure.columns.map(col => (
                          <td 
                            key={col.id} 
                            className={`border p-2 text-center ${
                              col.type === 'total' ? 'bg-primary/10 font-medium' : ''
                            }`}
                          >
                            <Input
                              type="number"
                              className="w-full text-center h-8"
                              placeholder="0"
                              max={col.max_score}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Example student rows */}
                    {[1, 2, 3].map(i => (
                      <tr key={`student-${i}`} className="hover:bg-muted/50">
                        <td className="border p-3">طالب {i}</td>
                        {structure.columns.map(col => (
                          <td 
                            key={col.id} 
                            className={`border p-2 text-center ${
                              col.type === 'total' ? 'bg-primary/10' : ''
                            }`}
                          >
                            <Input
                              type="number"
                              className="w-full text-center h-8"
                              placeholder="0"
                              max={col.max_score}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-medium">
                      <td className="border p-3">المجموع الكلي</td>
                      {structure.columns.map(col => (
                        <td key={col.id} className="border p-3 text-center">
                          {col.max_score}
                        </td>
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
                <Button variant="outline" onClick={() => setStructure(defaultStructure)}>
                  استعادة الافتراضي
                </Button>
                <Button onClick={handleSave}>
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
