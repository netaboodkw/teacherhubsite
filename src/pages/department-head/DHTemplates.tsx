import { useState } from 'react';
import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { 
  useTeacherTemplates, 
  useCreateTeacherTemplate, 
  useUpdateTeacherTemplate, 
  useDeleteTeacherTemplate, 
  useSharedTemplates,
  useShareTemplate,
  useUnshareTemplate,
  TeacherTemplate 
} from '@/hooks/useTeacherTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Loader2, Edit, Trash2, Copy, FileText, Calculator, Sigma, Share2, Link2, Link2Off, Check, Eye, User } from 'lucide-react';
import { GradingStructureData, GradingGroup, GradingColumn } from '@/hooks/useGradingStructures';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ألوان المجموعات - باستيل
const GROUP_COLORS = [
  { id: 'blue', color: '#bfdbfe', name: 'أزرق فاتح' },
  { id: 'green', color: '#bbf7d0', name: 'أخضر فاتح' },
  { id: 'yellow', color: '#fef08a', name: 'أصفر فاتح' },
  { id: 'pink', color: '#fbcfe8', name: 'وردي فاتح' },
  { id: 'purple', color: '#ddd6fe', name: 'بنفسجي فاتح' },
  { id: 'orange', color: '#fed7aa', name: 'برتقالي فاتح' },
  { id: 'cyan', color: '#a5f3fc', name: 'سماوي فاتح' },
  { id: 'rose', color: '#fecdd3', name: 'وردي داكن' },
];

// Simple Structure Editor
function StructureEditor({ 
  structure, 
  onChange 
}: { 
  structure: GradingStructureData; 
  onChange: (structure: GradingStructureData) => void;
}) {
  const [internalSumDialogOpen, setInternalSumDialogOpen] = useState(false);
  const [externalSumDialogOpen, setExternalSumDialogOpen] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [columnName, setColumnName] = useState('');

  const addGroup = () => {
    const usedColors = structure.groups?.map(g => g.color) || [];
    const availableColor = GROUP_COLORS.find(c => !usedColors.includes(c.color))?.color || '#3b82f6';
    
    const newGroup: GradingGroup = {
      id: `group_${Date.now()}`,
      name_ar: `مجموعة ${(structure.groups?.length || 0) + 1}`,
      color: availableColor,
      columns: []
    };
    onChange({
      ...structure,
      groups: [...(structure.groups || []), newGroup]
    });
  };

  const duplicateGroup = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    const usedColors = structure.groups?.map(g => g.color) || [];
    const availableColor = GROUP_COLORS.find(c => !usedColors.includes(c.color))?.color || group.color;
    
    const newGroup: GradingGroup = {
      id: `group_${Date.now()}`,
      name_ar: `${group.name_ar} (نسخة)`,
      color: availableColor,
      columns: group.columns.map(col => ({
        ...col,
        id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    onChange({
      ...structure,
      groups: [...structure.groups, newGroup]
    });
  };

  const updateGroup = (groupId: string, updates: Partial<GradingGroup>) => {
    onChange({
      ...structure,
      groups: structure.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    });
  };

  const deleteGroup = (groupId: string) => {
    onChange({
      ...structure,
      groups: structure.groups.filter(g => g.id !== groupId)
    });
  };

  const addColumn = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: `درجة ${group.columns.length + 1}`,
      type: 'score',
      max_score: 10
    };

    updateGroup(groupId, {
      columns: [...group.columns, newColumn]
    });
  };

  const updateColumn = (groupId: string, columnId: string, updates: Partial<GradingColumn>) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      columns: group.columns.map(c => c.id === columnId ? { ...c, ...updates } : c)
    });
  };

  const deleteColumn = (groupId: string, columnId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      columns: group.columns.filter(c => c.id !== columnId)
    });
  };

  const openInternalSumDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setColumnName('مجموع داخلي');
    setSelectedSources([]);
    setInternalSumDialogOpen(true);
  };

  const openExternalSumDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setColumnName('مجموع خارجي');
    setSelectedSources([]);
    setExternalSumDialogOpen(true);
  };

  const saveInternalSumColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: columnName || 'مجموع داخلي',
      type: 'internal_sum',
      max_score: 0,
      internalSourceColumns: selectedSources
    };
    updateGroup(currentGroupId, {
      columns: [...group.columns, newColumn]
    });
    setInternalSumDialogOpen(false);
  };

  const saveExternalSumColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: columnName || 'مجموع خارجي',
      type: 'external_sum',
      max_score: 0,
      externalSourceColumns: selectedSources
    };
    updateGroup(currentGroupId, {
      columns: [...group.columns, newColumn]
    });
    setExternalSumDialogOpen(false);
  };

  const getInternalColumns = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return group.columns
      .filter(c => c.type === 'score' || c.type === 'internal_sum')
      .map(c => ({ key: c.id, columnName: c.name_ar, type: c.type }));
  };

  const getAllColumnsForExternalSum = () => {
    return structure.groups.flatMap(g => 
      g.columns
        .filter(c => c.type === 'score' || c.type === 'internal_sum' || c.type === 'external_sum')
        .map(c => ({
          key: `${g.id}:${c.id}`,
          groupName: g.name_ar,
          columnName: c.name_ar,
          groupColor: g.color,
          type: c.type
        }))
    );
  };

  const getColumnTypeLabel = (type: string) => {
    switch (type) {
      case 'score': return 'درجة';
      case 'internal_sum': return 'مجموع داخلي';
      case 'external_sum': return 'مجموع خارجي';
      case 'group_sum': return 'مجموع مجموعات';
      case 'grand_total': return 'مجموع كلي';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>المجموعات والأعمدة</Label>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-4 w-4 ml-1" />
          إضافة مجموعة
        </Button>
      </div>

      <ScrollArea className="h-[400px] border rounded-lg p-3">
        {(!structure.groups || structure.groups.length === 0) ? (
          <div className="text-center text-muted-foreground py-8">
            لا توجد مجموعات. اضغط على "إضافة مجموعة" للبدء.
          </div>
        ) : (
          <div className="space-y-4">
            {structure.groups.map((group) => (
              <Card key={group.id} className="border-r-4" style={{ borderRightColor: group.color }}>
                <CardHeader className="py-3 px-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={group.name_ar}
                        onChange={(e) => updateGroup(group.id, { name_ar: e.target.value })}
                        className="h-8 flex-1"
                        placeholder="اسم المجموعة"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => duplicateGroup(group.id)}
                        title="نسخ المجموعة"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteGroup(group.id)}
                        title="حذف المجموعة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">اللون:</span>
                      {GROUP_COLORS.map((colorOption) => (
                        <button
                          key={colorOption.id}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            group.color === colorOption.color 
                              ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          onClick={() => updateGroup(group.id, { color: colorOption.color })}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {group.columns.map((col) => (
                      <div key={col.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={col.name_ar}
                            onChange={(e) => updateColumn(group.id, col.id, { name_ar: e.target.value })}
                            className="h-7 text-sm flex-1"
                            placeholder="اسم العمود"
                          />
                          {col.type === 'score' && (
                            <Input
                              type="number"
                              value={col.max_score}
                              onChange={(e) => updateColumn(group.id, col.id, { max_score: parseInt(e.target.value) || 0 })}
                              className="h-7 w-16 text-sm text-center"
                              placeholder="الدرجة"
                            />
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {getColumnTypeLabel(col.type)}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteColumn(group.id, col.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => addColumn(group.id)}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        درجة
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openInternalSumDialog(group.id)}
                      >
                        <Calculator className="h-3 w-3 ml-1" />
                        مجموع داخلي
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openExternalSumDialog(group.id)}
                      >
                        <Sigma className="h-3 w-3 ml-1" />
                        مجموع خارجي
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Internal Sum Dialog */}
      <Dialog open={internalSumDialogOpen} onOpenChange={setInternalSumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مجموع داخلي</DialogTitle>
            <DialogDescription>اختر الأعمدة من نفس المجموعة لجمعها</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم العمود</Label>
              <Input 
                value={columnName} 
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="مجموع داخلي"
              />
            </div>
            <div className="space-y-2">
              <Label>اختر الأعمدة</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {currentGroupId && getInternalColumns(currentGroupId).map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedSources.includes(col.key)}
                      onCheckedChange={(checked) => {
                        setSelectedSources(prev => 
                          checked 
                            ? [...prev, col.key]
                            : prev.filter(k => k !== col.key)
                        );
                      }}
                    />
                    <span className="text-sm">{col.columnName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInternalSumDialogOpen(false)}>إلغاء</Button>
            <Button onClick={saveInternalSumColumn} disabled={selectedSources.length === 0}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* External Sum Dialog */}
      <Dialog open={externalSumDialogOpen} onOpenChange={setExternalSumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مجموع خارجي</DialogTitle>
            <DialogDescription>اختر الأعمدة من أي مجموعة لجمعها</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم العمود</Label>
              <Input 
                value={columnName} 
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="مجموع خارجي"
              />
            </div>
            <div className="space-y-2">
              <Label>اختر الأعمدة</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {getAllColumnsForExternalSum().map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedSources.includes(col.key)}
                      onCheckedChange={(checked) => {
                        setSelectedSources(prev => 
                          checked 
                            ? [...prev, col.key]
                            : prev.filter(k => k !== col.key)
                        );
                      }}
                    />
                    <Badge variant="outline" style={{ borderColor: col.groupColor }}>
                      {col.groupName}
                    </Badge>
                    <span className="text-sm">{col.columnName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExternalSumDialogOpen(false)}>إلغاء</Button>
            <Button onClick={saveExternalSumColumn} disabled={selectedSources.length === 0}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Demo Student Data for Preview
const DEMO_STUDENT = {
  id: 'demo-student',
  name: 'طالب تجريبي',
  student_id: '0000'
};

// Template Preview Component with Demo Student
function TemplatePreview({ structure }: { structure: GradingStructureData }) {
  const [demoGrades, setDemoGrades] = useState<Record<string, number>>({});

  // Calculate column value based on type
  const calculateColumnValue = (column: GradingColumn, groupId: string): number | null => {
    if (column.type === 'score') {
      return demoGrades[column.id] ?? null;
    }
    
    if (column.type === 'internal_sum' && column.internalSourceColumns) {
      const group = structure.groups.find(g => g.id === groupId);
      if (!group) return null;
      
      let sum = 0;
      let hasValue = false;
      for (const sourceId of column.internalSourceColumns) {
        const sourceCol = group.columns.find(c => c.id === sourceId);
        if (sourceCol) {
          const val = calculateColumnValue(sourceCol, groupId);
          if (val !== null) {
            sum += val;
            hasValue = true;
          }
        }
      }
      return hasValue ? sum : null;
    }
    
    if (column.type === 'external_sum' && column.externalSourceColumns) {
      let sum = 0;
      let hasValue = false;
      for (const sourceKey of column.externalSourceColumns) {
        const [srcGroupId, srcColId] = sourceKey.split(':');
        const srcGroup = structure.groups.find(g => g.id === srcGroupId);
        if (srcGroup) {
          const srcCol = srcGroup.columns.find(c => c.id === srcColId);
          if (srcCol) {
            const val = calculateColumnValue(srcCol, srcGroupId);
            if (val !== null) {
              sum += val;
              hasValue = true;
            }
          }
        }
      }
      return hasValue ? sum : null;
    }
    
    return null;
  };

  // Calculate max score for a column
  const calculateMaxScore = (column: GradingColumn, groupId: string): number => {
    if (column.type === 'score') {
      return column.max_score || 0;
    }
    
    if (column.type === 'internal_sum' && column.internalSourceColumns) {
      const group = structure.groups.find(g => g.id === groupId);
      if (!group) return 0;
      
      return column.internalSourceColumns.reduce((sum, sourceId) => {
        const sourceCol = group.columns.find(c => c.id === sourceId);
        return sum + (sourceCol ? calculateMaxScore(sourceCol, groupId) : 0);
      }, 0);
    }
    
    if (column.type === 'external_sum' && column.externalSourceColumns) {
      return column.externalSourceColumns.reduce((sum, sourceKey) => {
        const [srcGroupId, srcColId] = sourceKey.split(':');
        const srcGroup = structure.groups.find(g => g.id === srcGroupId);
        if (srcGroup) {
          const srcCol = srcGroup.columns.find(c => c.id === srcColId);
          if (srcCol) {
            return sum + calculateMaxScore(srcCol, srcGroupId);
          }
        }
        return sum;
      }, 0);
    }
    
    return 0;
  };

  const handleGradeChange = (columnId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setDemoGrades(prev => ({ ...prev, [columnId]: numValue }));
    } else if (value === '') {
      setDemoGrades(prev => {
        const newGrades = { ...prev };
        delete newGrades[columnId];
        return newGrades;
      });
    }
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    let total = 0;
    let maxTotal = 0;
    
    for (const group of structure.groups) {
      for (const col of group.columns) {
        if (col.type === 'score') {
          const val = demoGrades[col.id];
          if (val !== undefined) total += val;
          maxTotal += col.max_score || 0;
        }
      }
    }
    
    return { total, maxTotal };
  };

  const { total, maxTotal } = calculateGrandTotal();

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Eye className="h-4 w-4" />
        معاينة القالب (طالب تجريبي)
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky right-0 bg-background z-10 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      الطالب
                    </div>
                  </TableHead>
                  {structure.groups.map(group => (
                    group.columns.map(col => (
                      <TableHead 
                        key={col.id} 
                        className="text-center min-w-[80px]"
                        style={{ backgroundColor: group.color + '40' }}
                      >
                        <div className="text-xs">
                          <div className="font-medium">{col.name_ar}</div>
                          <div className="text-muted-foreground">
                            ({calculateMaxScore(col, group.id)})
                          </div>
                        </div>
                      </TableHead>
                    ))
                  ))}
                  <TableHead className="text-center min-w-[80px] bg-primary/10">
                    <div className="text-xs">
                      <div className="font-medium">المجموع</div>
                      <div className="text-muted-foreground">({maxTotal})</div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="sticky right-0 bg-background z-10 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      {DEMO_STUDENT.name}
                    </div>
                  </TableCell>
                  {structure.groups.map(group => (
                    group.columns.map(col => (
                      <TableCell key={col.id} className="text-center p-1">
                        {col.type === 'score' ? (
                          <Input
                            type="number"
                            min="0"
                            max={col.max_score}
                            step="0.5"
                            value={demoGrades[col.id] ?? ''}
                            onChange={(e) => handleGradeChange(col.id, e.target.value)}
                            className="h-8 w-16 text-center mx-auto text-sm"
                            placeholder="-"
                          />
                        ) : (
                          <span className="font-medium text-primary">
                            {calculateColumnValue(col, group.id) ?? '-'}
                          </span>
                        )}
                      </TableCell>
                    ))
                  ))}
                  <TableCell className="text-center bg-primary/5">
                    <span className="font-bold text-primary text-lg">
                      {total > 0 ? total : '-'}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground text-center">
        جرب إدخال درجات للطالب التجريبي لمعاينة كيف سيعمل القالب
      </p>
    </div>
  );
}

function TemplatesContent() {
  const { data: templates = [], isLoading } = useTeacherTemplates();
  const { data: sharedTemplates = [] } = useSharedTemplates();
  const createTemplate = useCreateTeacherTemplate();
  const updateTemplate = useUpdateTeacherTemplate();
  const deleteTemplate = useDeleteTeacherTemplate();
  const shareTemplate = useShareTemplate();
  const unshareTemplate = useUnshareTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TeacherTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [currentShareTemplate, setCurrentShareTemplate] = useState<TeacherTemplate | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    description: '',
    structure: { groups: [], settings: { showGrandTotal: false, showPercentage: false, passingScore: 50 } } as GradingStructureData
  });

  const getShareInfo = (templateId: string) => {
    return sharedTemplates.find(s => s.template_id === templateId && s.is_active);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name_ar: '',
      description: '',
      structure: { groups: [], settings: { showGrandTotal: false, showPercentage: false, passingScore: 50 } }
    });
    setDialogOpen(true);
  };

  const openEditDialog = (template: TeacherTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name_ar: template.name_ar,
      description: template.description || '',
      structure: template.structure || { groups: [], settings: { showGrandTotal: false, showPercentage: false, passingScore: 50 } }
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (template: TeacherTemplate) => {
    setTemplateToDelete(template.id);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = async (template: TeacherTemplate) => {
    try {
      await createTemplate.mutateAsync({
        name: `${template.name} (نسخة)`,
        name_ar: `${template.name_ar} (نسخة)`,
        description: template.description || undefined,
        structure: template.structure
      });
      toast.success('تم نسخ القالب بنجاح');
    } catch (error: any) {
      toast.error('فشل في نسخ القالب');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          name: formData.name_ar,
          name_ar: formData.name_ar,
          description: formData.description || undefined,
          structure: formData.structure
        });
        toast.success('تم تحديث القالب بنجاح');
      } else {
        await createTemplate.mutateAsync({
          name: formData.name_ar,
          name_ar: formData.name_ar,
          description: formData.description || undefined,
          structure: formData.structure
        });
        toast.success('تم إنشاء القالب بنجاح');
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await deleteTemplate.mutateAsync(templateToDelete);
      toast.success('تم حذف القالب بنجاح');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      toast.error('فشل في حذف القالب');
    }
  };

  const handleShare = async (template: TeacherTemplate) => {
    try {
      const shared = await shareTemplate.mutateAsync(template.id);
      setShareCode(shared.share_code);
      setCurrentShareTemplate(template);
      setShareDialogOpen(true);
    } catch (error: any) {
      toast.error('فشل في مشاركة القالب');
    }
  };

  const handleUnshare = async (templateId: string) => {
    try {
      await unshareTemplate.mutateAsync(templateId);
      toast.success('تم إيقاف مشاركة القالب');
    } catch (error: any) {
      toast.error('فشل في إيقاف المشاركة');
    }
  };

  const copyShareCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    toast.success('تم نسخ الرمز');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">قوالب الدرجات</h1>
          <p className="text-muted-foreground mt-1">إنشاء ومشاركة قوالب الدرجات مع المعلمين</p>
        </div>
        
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء قالب جديد
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">لا توجد قوالب</h3>
            <p className="text-muted-foreground mb-4">
              قم بإنشاء قالب درجات جديد لمشاركته مع المعلمين
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء قالب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const shareInfo = getShareInfo(template.id);
            const groupCount = template.structure?.groups?.length || 0;
            const columnCount = template.structure?.groups?.reduce((acc, g) => acc + g.columns.length, 0) || 0;
            
            return (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name_ar}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    {shareInfo && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Link2 className="h-3 w-3 ml-1" />
                        مشترك
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{groupCount} مجموعات</span>
                    <span>{columnCount} أعمدة</span>
                  </div>
                  
                  {/* Preview colors */}
                  {template.structure?.groups && template.structure.groups.length > 0 && (
                    <div className="flex gap-1 mb-4">
                      {template.structure.groups.slice(0, 6).map((group) => (
                        <div
                          key={group.id}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: group.color }}
                          title={group.name_ar}
                        />
                      ))}
                      {template.structure.groups.length > 6 && (
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">
                          +{template.structure.groups.length - 6}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Share Code Display */}
                  {shareInfo && (
                    <div className="mb-4 p-2 bg-muted rounded-lg flex items-center justify-between">
                      <span className="text-sm font-mono">{shareInfo.share_code}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(shareInfo.share_code);
                          toast.success('تم نسخ الرمز');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4 ml-1" />
                      نسخ
                    </Button>
                    {shareInfo ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUnshare(template.id)}
                        className="text-orange-600"
                      >
                        <Link2Off className="h-4 w-4 ml-1" />
                        إيقاف
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleShare(template)}
                        className="text-green-600"
                      >
                        <Share2 className="h-4 w-4 ml-1" />
                        مشاركة
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleDeleteClick(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم القالب</Label>
                <Input
                  id="name"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="مثال: قالب الرياضيات"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للقالب"
                  rows={1}
                />
              </div>
            </div>
            
            <StructureEditor
              structure={formData.structure}
              onChange={(structure) => setFormData({ ...formData, structure })}
            />

            {/* Template Preview with Demo Student */}
            {formData.structure.groups && formData.structure.groups.length > 0 && (
              <TemplatePreview structure={formData.structure} />
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) && (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              )}
              {editingTemplate ? 'حفظ التغييرات' : 'إنشاء القالب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مشاركة القالب</DialogTitle>
            <DialogDescription>
              شارك هذا الرمز مع المعلمين لنسخ القالب
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {currentShareTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{currentShareTemplate.name_ar}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Input 
                value={shareCode} 
                readOnly 
                className="text-center text-2xl font-mono tracking-widest"
              />
              <Button onClick={copyShareCode} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              يمكن للمعلمين استخدام هذا الرمز لاستيراد القالب من صفحة القوالب
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DHTemplates() {
  return (
    <DepartmentHeadViewLayout requireTeacher={false} showTeacherSelector={false}>
      <TemplatesContent />
    </DepartmentHeadViewLayout>
  );
}