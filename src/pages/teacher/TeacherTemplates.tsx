import { useState } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { 
  useTeacherTemplates, 
  useCreateTeacherTemplate, 
  useUpdateTeacherTemplate, 
  useDeleteTeacherTemplate, 
  useSharedTemplates,
  useShareTemplate,
  useUnshareTemplate,
  useImportTemplate,
  TeacherTemplate 
} from '@/hooks/useTeacherTemplates';
import { useTemplatesInUse } from '@/hooks/useClassrooms';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, Loader2, Edit, Trash2, Copy, FileText, LayoutGrid, Calculator, Sigma, ExternalLink, Share2, Download, Link2, Link2Off, Lock, AlertTriangle } from 'lucide-react';
import { GradingStructureData, GradingGroup, GradingColumn } from '@/hooks/useGradingStructures';

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

// Structure editor component with advanced options
function StructureEditor({ 
  structure, 
  onChange 
}: { 
  structure: GradingStructureData; 
  onChange: (structure: GradingStructureData) => void;
}) {
  const [externalSumDialogOpen, setExternalSumDialogOpen] = useState(false);
  const [groupSumDialogOpen, setGroupSumDialogOpen] = useState(false);
  const [grandTotalDialogOpen, setGrandTotalDialogOpen] = useState(false);
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

  const addColumn = (groupId: string, type: 'score' | 'total') => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: type === 'score' ? `درجة ${group.columns.length + 1}` : 'المجموع',
      type,
      max_score: type === 'score' ? 10 : 0
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

  // Open external sum dialog
  const openExternalSumDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setSelectedSources([]);
    setColumnName('مجموع خارجي');
    setExternalSumDialogOpen(true);
  };

  // Open group sum dialog
  const openGroupSumDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setSelectedSources([]);
    setColumnName('مجموع المجموعات');
    setGroupSumDialogOpen(true);
  };

  // Open grand total dialog
  const openGrandTotalDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setSelectedSources([]);
    setColumnName('المجموع الكلي');
    setGrandTotalDialogOpen(true);
  };

  // Add external sum column
  const addExternalSumColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: columnName || 'مجموع خارجي',
      type: 'external_sum',
      max_score: 0,
      externalSourceColumns: selectedSources
    };

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (group) {
      updateGroup(currentGroupId, {
        columns: [...group.columns, newColumn]
      });
    }
    setExternalSumDialogOpen(false);
  };

  // Add group sum column
  const addGroupSumColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: columnName || 'مجموع المجموعات',
      type: 'group_sum',
      max_score: 0,
      sourceGroupIds: selectedSources
    };

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (group) {
      updateGroup(currentGroupId, {
        columns: [...group.columns, newColumn]
      });
    }
    setGroupSumDialogOpen(false);
  };

  // Add grand total column
  const addGrandTotalColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: columnName || 'المجموع الكلي',
      type: 'grand_total',
      max_score: 0,
      sourceGroupIds: selectedSources
    };

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (group) {
      updateGroup(currentGroupId, {
        columns: [...group.columns, newColumn]
      });
    }
    setGrandTotalDialogOpen(false);
  };

  // Get all score columns from other groups
  const getExternalScoreColumns = (currentGroupId: string) => {
    return structure.groups
      .filter(g => g.id !== currentGroupId)
      .flatMap(g => g.columns
        .filter(c => c.type === 'score')
        .map(c => ({
          key: `${g.id}:${c.id}`,
          groupName: g.name_ar,
          columnName: c.name_ar,
          groupColor: g.color
        }))
      );
  };

  // Get all total columns from all groups
  const getTotalColumns = () => {
    return structure.groups.flatMap(g => 
      g.columns
        .filter(c => c.type === 'total' || c.type === 'group_sum' || c.type === 'external_sum')
        .map(c => ({
          key: `${g.id}:${c.id}`,
          groupName: g.name_ar,
          columnName: c.name_ar,
          groupColor: g.color
        }))
    );
  };

  // Calculate total score for a column
  const calculateColumnTotal = (column: GradingColumn) => {
    if (column.type === 'external_sum' && column.externalSourceColumns) {
      let total = 0;
      column.externalSourceColumns.forEach(key => {
        const [grpId, colId] = key.split(':');
        const group = structure.groups.find(g => g.id === grpId);
        const col = group?.columns.find(c => c.id === colId);
        if (col && col.type === 'score') {
          total += col.max_score;
        }
      });
      return total;
    }
    if ((column.type === 'group_sum' || column.type === 'grand_total') && column.sourceGroupIds) {
      let total = 0;
      column.sourceGroupIds.forEach(key => {
        if (key.includes(':')) {
          const [grpId, colId] = key.split(':');
          const group = structure.groups.find(g => g.id === grpId);
          const col = group?.columns.find(c => c.id === colId);
          if (col) {
            total += col.max_score;
          }
        }
      });
      return total;
    }
    return column.max_score;
  };

  // Get column type label
  const getColumnTypeLabel = (type: string) => {
    switch (type) {
      case 'score': return 'درجة';
      case 'total': return 'مجموع';
      case 'external_sum': return 'مجموع خارجي';
      case 'group_sum': return 'مجموع مجموعات';
      case 'grand_total': return 'مجموع كلي';
      default: return type;
    }
  };

  const getColumnTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'score': return 'secondary';
      case 'total': return 'default';
      case 'external_sum': return 'outline';
      case 'group_sum': return 'outline';
      case 'grand_total': return 'destructive';
      default: return 'secondary';
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
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Color Selection */}
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
                      {/* Custom color picker */}
                      <div className="relative">
                        <input
                          type="color"
                          value={GROUP_COLORS.some(c => c.color === group.color) ? '#888888' : group.color}
                          onChange={(e) => updateGroup(group.id, { color: e.target.value })}
                          className="w-6 h-6 rounded-full cursor-pointer border-2 border-dashed border-muted-foreground/50"
                          title="لون مخصص"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="space-y-2">
                    {group.columns.map((column) => (
                      <div key={column.id} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                        <Input
                          value={column.name_ar}
                          onChange={(e) => updateColumn(group.id, column.id, { name_ar: e.target.value })}
                          className="h-7 flex-1 text-sm"
                          placeholder="اسم العمود"
                        />
                        <Badge 
                          variant={getColumnTypeBadgeVariant(column.type) as any} 
                          className={`text-xs ${column.type === 'external_sum' ? 'border-green-500 text-green-600' : column.type === 'group_sum' ? 'border-amber-500 text-amber-600' : ''}`}
                        >
                          {getColumnTypeLabel(column.type)}
                        </Badge>
                        {column.type === 'score' ? (
                          <Input
                            type="number"
                            value={column.max_score}
                            onChange={(e) => updateColumn(group.id, column.id, { max_score: parseInt(e.target.value) || 0 })}
                            className="h-7 w-16 text-sm"
                            min={0}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground w-16 text-center">
                            {calculateColumnTotal(column)}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteColumn(group.id, column.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addColumn(group.id, 'score')}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        درجة
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addColumn(group.id, 'total')}
                      >
                        <Calculator className="h-3 w-3 ml-1" />
                        مجموع
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => openExternalSumDialog(group.id)}
                      >
                        <ExternalLink className="h-3 w-3 ml-1" />
                        مجموع خارجي
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={() => openGroupSumDialog(group.id)}
                      >
                        <Sigma className="h-3 w-3 ml-1" />
                        مجموع مجموعات
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-primary text-primary hover:bg-primary/10"
                        onClick={() => openGrandTotalDialog(group.id)}
                      >
                        <Sigma className="h-3 w-3 ml-1" />
                        مجموع كلي
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* External Sum Dialog */}
      <Dialog open={externalSumDialogOpen} onOpenChange={setExternalSumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مجموع درجات خارجي</DialogTitle>
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
              <Label>اختر الدرجات من المجموعات الأخرى</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {currentGroupId && getExternalScoreColumns(currentGroupId).map((col) => (
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
            <Button onClick={addExternalSumColumn} disabled={selectedSources.length === 0}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Sum Dialog */}
      <Dialog open={groupSumDialogOpen} onOpenChange={setGroupSumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مجموع من مجموعات سابقة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم العمود</Label>
              <Input 
                value={columnName} 
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="مجموع المجموعات"
              />
            </div>
            <div className="space-y-2">
              <Label>اختر أعمدة المجاميع</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {getTotalColumns().map((col) => (
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
            <Button variant="outline" onClick={() => setGroupSumDialogOpen(false)}>إلغاء</Button>
            <Button onClick={addGroupSumColumn} disabled={selectedSources.length === 0}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grand Total Dialog */}
      <Dialog open={grandTotalDialogOpen} onOpenChange={setGrandTotalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة المجموع الكلي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم العمود</Label>
              <Input 
                value={columnName} 
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="المجموع الكلي"
              />
            </div>
            <div className="space-y-2">
              <Label>اختر أعمدة المجاميع للجمع</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {getTotalColumns().map((col) => (
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
            <Button variant="outline" onClick={() => setGrandTotalDialogOpen(false)}>إلغاء</Button>
            <Button onClick={addGrandTotalColumn} disabled={selectedSources.length === 0}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeacherTemplates() {
  const { data: templates = [], isLoading } = useTeacherTemplates();
  const { data: sharedTemplates = [] } = useSharedTemplates();
  const { data: templatesInUse = {} } = useTemplatesInUse();
  const createTemplate = useCreateTeacherTemplate();
  const updateTemplate = useUpdateTeacherTemplate();
  const deleteTemplate = useDeleteTeacherTemplate();
  const shareTemplate = useShareTemplate();
  const unshareTemplate = useUnshareTemplate();
  const importTemplate = useImportTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [protectedWarningOpen, setProtectedWarningOpen] = useState(false);
  const [protectedTemplateInfo, setProtectedTemplateInfo] = useState<{ template: TeacherTemplate; action: 'edit' | 'delete' } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TeacherTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [currentShareTemplate, setCurrentShareTemplate] = useState<TeacherTemplate | null>(null);

  const [formData, setFormData] = useState({
    name_ar: '',
    description: '',
    structure: { groups: [], settings: { showGrandTotal: false, showPercentage: false, passingScore: 50 } } as GradingStructureData
  });

  // Check if template is in use
  const isTemplateInUse = (templateId: string) => {
    return templatesInUse[templateId] && templatesInUse[templateId].length > 0;
  };

  // Get classrooms using template
  const getClassroomsUsingTemplate = (templateId: string) => {
    return templatesInUse[templateId] || [];
  };

  // Get share info for a template
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
    // Check if template is in use
    if (isTemplateInUse(template.id)) {
      setProtectedTemplateInfo({ template, action: 'edit' });
      setProtectedWarningOpen(true);
      return;
    }
    
    setEditingTemplate(template);
    setFormData({
      name_ar: template.name_ar,
      description: template.description || '',
      structure: template.structure || { groups: [], settings: { showGrandTotal: false, showPercentage: false, passingScore: 50 } }
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (template: TeacherTemplate) => {
    // Check if template is in use
    if (isTemplateInUse(template.id)) {
      setProtectedTemplateInfo({ template, action: 'delete' });
      setProtectedWarningOpen(true);
      return;
    }
    
    setTemplateToDelete(template.id);
    setDeleteDialogOpen(true);
  };

  const handleDuplicateForEdit = async () => {
    if (!protectedTemplateInfo) return;
    
    try {
      await createTemplate.mutateAsync({
        name: `${protectedTemplateInfo.template.name} (نسخة للتعديل)`,
        name_ar: `${protectedTemplateInfo.template.name_ar} (نسخة للتعديل)`,
        description: protectedTemplateInfo.template.description || undefined,
        structure: protectedTemplateInfo.template.structure
      });
      toast.success('تم إنشاء نسخة من القالب، يمكنك تعديلها الآن');
      setProtectedWarningOpen(false);
      setProtectedTemplateInfo(null);
    } catch (error: any) {
      toast.error('فشل في نسخ القالب');
    }
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

  const handleImport = async () => {
    if (!importCode.trim()) {
      toast.error('يرجى إدخال رمز القالب');
      return;
    }
    try {
      await importTemplate.mutateAsync(importCode.trim());
      toast.success('تم استيراد القالب بنجاح');
      setImportDialogOpen(false);
      setImportCode('');
    } catch (error: any) {
      toast.error(error.message || 'فشل في استيراد القالب');
    }
  };

  const copyShareCode = () => {
    navigator.clipboard.writeText(shareCode);
    toast.success('تم نسخ الرمز');
  };

  const calculateTotalScore = (structure: GradingStructureData) => {
    if (!structure.groups) return 0;
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, c) => s + c.max_score, 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">قوالب الدرجات</h1>
            <p className="text-muted-foreground">أنشئ قوالب درجات خاصة بك وطبقها على فصولك</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Download className="h-4 w-4 ml-2" />
              استيراد قالب
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 ml-2" />
              قالب جديد
            </Button>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد قوالب</h3>
              <p className="text-muted-foreground text-center mb-4">
                أنشئ قالب درجات خاص بك لتطبيقه على فصولك
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء قالب
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const inUse = isTemplateInUse(template.id);
              const classroomsUsing = getClassroomsUsingTemplate(template.id);
              
              return (
              <Card key={template.id} className={`hover:shadow-md transition-shadow ${inUse ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {inUse && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-4 w-4 text-amber-600 mt-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>هذا القالب مستخدم في فصول ولا يمكن تعديله أو حذفه مباشرة</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div>
                        <CardTitle className="text-lg">{template.name_ar}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">{template.description}</CardDescription>
                        )}
                        {inUse && (
                          <p className="text-xs text-amber-600 mt-1">
                            مستخدم في: {classroomsUsing.slice(0, 2).join('، ')}{classroomsUsing.length > 2 ? ` و${classroomsUsing.length - 2} آخرين` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {calculateTotalScore(template.structure)} درجة
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Share Status Badge */}
                  {getShareInfo(template.id) && (
                    <div className="mb-3 flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary font-mono font-bold">{getShareInfo(template.id)?.share_code}</span>
                      <span className="text-xs text-muted-foreground">مشارك</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.structure.groups?.slice(0, 4).map((group) => (
                      <Badge
                        key={group.id}
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: group.color, color: group.color }}
                      >
                        {group.name_ar}
                      </Badge>
                    ))}
                    {(template.structure.groups?.length || 0) > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{(template.structure.groups?.length || 0) - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`flex-1 ${inUse ? 'opacity-60' : ''}`}
                            onClick={() => openEditDialog(template)}
                          >
                            {inUse ? <Lock className="h-4 w-4 ml-1" /> : <Edit className="h-4 w-4 ml-1" />}
                            تعديل
                          </Button>
                        </TooltipTrigger>
                        {inUse && (
                          <TooltipContent>
                            <p>القالب محمي - انقر لنسخه للتعديل</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {getShareInfo(template.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleUnshare(template.id)}
                        title="إيقاف المشاركة"
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(template)}
                        title="مشاركة القالب"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      title="نسخ"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`text-destructive hover:text-destructive ${inUse ? 'opacity-60' : ''}`}
                            onClick={() => handleDeleteClick(template)}
                            title="حذف"
                          >
                            {inUse ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        {inUse && (
                          <TooltipContent>
                            <p>لا يمكن حذف قالب مستخدم في فصول</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">اسم القالب *</Label>
              <Input
                id="name_ar"
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
                rows={2}
              />
            </div>

            {/* إعدادات القالب */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium">إعدادات العرض</Label>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="showGrandTotal"
                  checked={formData.structure.settings?.showGrandTotal ?? false}
                  onCheckedChange={(checked) => 
                    setFormData({
                      ...formData,
                      structure: {
                        ...formData.structure,
                        settings: {
                          ...formData.structure.settings,
                          showGrandTotal: !!checked
                        }
                      }
                    })
                  }
                />
                <Label htmlFor="showGrandTotal" className="text-sm cursor-pointer">
                  إظهار عمود المجموع الكلي التلقائي
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                يمكنك إضافة عمود مجموع كلي يدوياً بدلاً من ذلك للتحكم الكامل
              </p>
            </div>

            <StructureEditor
              structure={formData.structure}
              onChange={(structure) => setFormData({ ...formData, structure })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingTemplate ? (
                'حفظ التغييرات'
              ) : (
                'إنشاء القالب'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Protected Template Warning Dialog */}
      <AlertDialog open={protectedWarningOpen} onOpenChange={setProtectedWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              القالب محمي
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                هذا القالب مطبق على الفصول التالية:
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <ul className="list-disc list-inside text-sm space-y-1">
                  {protectedTemplateInfo && getClassroomsUsingTemplate(protectedTemplateInfo.template.id).map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
              <p>
                <strong>لحماية درجات الطلاب</strong>، لا يمكن {protectedTemplateInfo?.action === 'edit' ? 'تعديل' : 'حذف'} هذا القالب مباشرة.
              </p>
              {protectedTemplateInfo?.action === 'edit' && (
                <p className="text-primary">
                  يمكنك إنشاء نسخة من القالب والتعديل عليها بدلاً من ذلك.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setProtectedWarningOpen(false);
              setProtectedTemplateInfo(null);
            }}>
              إغلاق
            </AlertDialogCancel>
            {protectedTemplateInfo?.action === 'edit' && (
              <AlertDialogAction
                onClick={handleDuplicateForEdit}
                className="bg-primary"
              >
                <Copy className="h-4 w-4 ml-2" />
                إنشاء نسخة للتعديل
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>استيراد قالب</DialogTitle>
            <DialogDescription>
              أدخل رمز القالب الذي حصلت عليه من معلم آخر
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="importCode">رمز القالب</Label>
            <Input
              id="importCode"
              value={importCode}
              onChange={(e) => setImportCode(e.target.value.toUpperCase())}
              placeholder="مثال: ABC123"
              className="mt-2 text-center font-mono text-lg tracking-widest"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleImport} disabled={importTemplate.isPending}>
              {importTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 ml-2" />
                  استيراد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Code Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>مشاركة القالب</DialogTitle>
            <DialogDescription>
              شارك هذا الرمز مع معلم آخر ليستورد القالب "{currentShareTemplate?.name_ar}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="bg-muted p-4 rounded-xl border-2 border-dashed border-primary/30">
              <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary">
                {shareCode}
              </span>
            </div>
            <Button variant="outline" onClick={copyShareCode} className="w-full">
              <Copy className="h-4 w-4 ml-2" />
              نسخ الرمز
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              يمكنك إيقاف المشاركة في أي وقت من صفحة القوالب
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}
