import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Loader2, 
  Upload, 
  Settings, 
  Star, 
  GripVertical,
  Palette,
  Calculator,
  Table,
  Sparkles,
  CheckCircle2,
  Image,
  RefreshCw,
  Save,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';
import {
  useGradingTemplates,
  useCreateGradingTemplate,
  useUpdateGradingTemplate,
  useDeleteGradingTemplate,
  GradingTemplate,
} from '@/hooks/useGradingSystem';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ألوان المجموعات
const GROUP_COLORS = [
  { id: 'yellow', color: '#fef3c7', name: 'أصفر', border: '#fbbf24' },
  { id: 'green', color: '#d1fae5', name: 'أخضر', border: '#34d399' },
  { id: 'blue', color: '#dbeafe', name: 'أزرق', border: '#60a5fa' },
  { id: 'red', color: '#fecaca', name: 'أحمر', border: '#f87171' },
  { id: 'purple', color: '#e9d5ff', name: 'بنفسجي', border: '#a78bfa' },
  { id: 'orange', color: '#fed7aa', name: 'برتقالي', border: '#fb923c' },
];

interface GradingColumn {
  id: string;
  name_ar: string;
  max_score: number;
  type: 'score' | 'total' | 'grand_total';
  sourceGroupIds?: string[]; // للمجموع الكلي - المجموعات المراد جمع مجاميعها
  sourceColumnIds?: string[]; // للمجموع - الأعمدة المراد جمعها
  useGroupColor?: boolean; // هل يستخدم لون المجموعة أم أبيض
}

interface GradingGroup {
  id: string;
  name_ar: string;
  color: string;
  border: string;
  columns: GradingColumn[];
}

interface GradingStructure {
  groups: GradingGroup[];
  settings: {
    showPercentage: boolean;
    passingScore: number;
  };
}

type ActiveTab = 'templates' | 'upload' | 'builder' | 'preview';

// Sortable Column Item Component
interface SortableColumnProps {
  column: GradingColumn;
  groupId: string;
  group: GradingGroup;
  structure: GradingStructure;
  updateColumn: (groupId: string, columnId: string, field: keyof GradingColumn, value: any) => void;
  removeColumn: (groupId: string, columnId: string) => void;
  calculateGrandTotal: (sourceGroupIds?: string[]) => number;
}

function SortableColumn({ 
  column, 
  groupId, 
  group, 
  structure, 
  updateColumn, 
  removeColumn,
  calculateGrandTotal 
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: column.useGroupColor === false ? 'var(--card)' : undefined
      }}
      className={`flex items-center gap-3 p-3 rounded-lg border ${column.useGroupColor === false ? 'bg-card' : ''} ${column.type === 'grand_total' ? 'border-primary bg-primary/5' : ''} ${isDragging ? 'shadow-lg z-50' : ''}`}
    >
      <button 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <Input 
          value={column.name_ar}
          onChange={(e) => updateColumn(groupId, column.id, 'name_ar', e.target.value)}
          className="w-full"
          placeholder="اسم العمود"
        />
        {/* Show source columns for total */}
        {column.type === 'total' && column.sourceColumnIds && (
          <div className="flex gap-1 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">يجمع:</span>
            {column.sourceColumnIds.map(scId => {
              const sourceCol = group.columns.find(c => c.id === scId);
              return sourceCol ? (
                <Badge 
                  key={scId} 
                  variant="outline" 
                  className="text-xs py-0"
                >
                  {sourceCol.name_ar}
                </Badge>
              ) : null;
            })}
          </div>
        )}
        {/* Show source groups for grand total */}
        {column.type === 'grand_total' && column.sourceGroupIds && (
          <div className="flex gap-1 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">يجمع:</span>
            {column.sourceGroupIds.map(sgId => {
              const sourceGroup = structure.groups.find(g => g.id === sgId);
              return sourceGroup ? (
                <Badge 
                  key={sgId} 
                  variant="outline" 
                  className="text-xs py-0"
                  style={{ borderColor: sourceGroup.border, backgroundColor: sourceGroup.color }}
                >
                  {sourceGroup.name_ar}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs whitespace-nowrap">الدرجة:</Label>
        <Input 
          type="number"
          value={column.type === 'grand_total' ? calculateGrandTotal(column.sourceGroupIds) : column.max_score}
          onChange={(e) => updateColumn(groupId, column.id, 'max_score', parseInt(e.target.value) || 0)}
          className="w-20"
          min={0}
          disabled={column.type === 'total' || column.type === 'grand_total'}
        />
      </div>
      <div className="flex items-center gap-1">
        <Badge variant={column.type === 'score' ? 'secondary' : column.type === 'total' ? 'default' : 'destructive'}>
          {column.type === 'score' ? 'درجة' : column.type === 'total' ? 'مجموع' : 'مجموع كلي'}
        </Badge>
        {column.useGroupColor === false && (
          <Badge variant="outline" className="text-xs py-0">
            <Palette className="h-3 w-3" />
          </Badge>
        )}
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => removeColumn(groupId, column.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function GradingSystemManager() {
  const queryClient = useQueryClient();
  const { data: levels } = useEducationLevels();
  const { data: allGradeLevels } = useGradeLevels();
  const { data: allSubjects } = useSubjects();
  const { data: templates, isLoading: templatesLoading } = useGradingTemplates();

  // Mutations
  const createTemplate = useCreateGradingTemplate();
  const updateTemplate = useUpdateGradingTemplate();
  const deleteTemplate = useDeleteGradingTemplate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('templates');

  // Structure state
  const [structure, setStructure] = useState<GradingStructure>({
    groups: [],
    settings: {
      showPercentage: true,
      passingScore: 50,
    }
  });

  // Upload state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Assignment Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GradingTemplate | null>(null);
  const [assignment, setAssignment] = useState({
    education_level_id: '',
    grade_level_ids: [] as string[],
    subject_ids: [] as string[],
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Edit template dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GradingTemplate | null>(null);

  // Default template
  const defaultTemplateId = localStorage.getItem('default_grading_template');

  // Column configuration dialogs
  const [columnConfigDialogOpen, setColumnConfigDialogOpen] = useState(false);
  const [columnConfigType, setColumnConfigType] = useState<'score' | 'total' | 'grand_total'>('score');
  const [columnConfigGroupId, setColumnConfigGroupId] = useState<string>('');
  const [selectedSourceColumns, setSelectedSourceColumns] = useState<string[]>([]);
  const [selectedSourceGroups, setSelectedSourceGroups] = useState<string[]>([]);
  const [newColumnUseGroupColor, setNewColumnUseGroupColor] = useState(true);
  const [newColumnName, setNewColumnName] = useState('');

  // Get filtered data based on selected education level
  const filteredGradeLevels = allGradeLevels?.filter(
    g => g.education_level_id === assignment.education_level_id
  ) || [];
  const filteredSubjects = allSubjects?.filter(
    s => s.education_level_id === assignment.education_level_id
  ) || [];

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle column reorder within a group
  const handleColumnDragEnd = (groupId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setStructure(prev => ({
        ...prev,
        groups: prev.groups.map(g => {
          if (g.id !== groupId) return g;
          
          const oldIndex = g.columns.findIndex(c => c.id === active.id);
          const newIndex = g.columns.findIndex(c => c.id === over.id);
          
          return {
            ...g,
            columns: arrayMove(g.columns, oldIndex, newIndex)
          };
        })
      }));
    }
  };

  // Group management
  const addGroup = () => {
    const usedColors = structure.groups.map(g => g.color);
    const availableColor = GROUP_COLORS.find(c => !usedColors.includes(c.color)) || GROUP_COLORS[0];
    
    const newGroup: GradingGroup = {
      id: `group${Date.now()}`,
      name_ar: `مجموعة ${structure.groups.length + 1}`,
      color: availableColor.color,
      border: availableColor.border,
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

  const changeGroupColor = (groupId: string, colorData: typeof GROUP_COLORS[0]) => {
    setStructure(prev => ({
      ...prev,
      groups: prev.groups.map(g => 
        g.id === groupId ? { ...g, color: colorData.color, border: colorData.border } : g
      )
    }));
  };

  // Column management - open dialog for new score column
  const openNewColumnDialog = (groupId: string) => {
    setColumnConfigGroupId(groupId);
    setColumnConfigType('score');
    setNewColumnName('');
    setNewColumnUseGroupColor(true);
    setColumnConfigDialogOpen(true);
  };

  // Open dialog for total column
  const openTotalColumnDialog = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const scoreColumns = group.columns.filter(c => c.type === 'score');
    setColumnConfigGroupId(groupId);
    setColumnConfigType('total');
    setSelectedSourceColumns(scoreColumns.map(c => c.id)); // Select all by default
    setNewColumnName('المجموع');
    setNewColumnUseGroupColor(true);
    setColumnConfigDialogOpen(true);
  };

  // Open dialog for grand total column
  const openGrandTotalDialog = (groupId: string) => {
    const currentGroupIndex = structure.groups.findIndex(g => g.id === groupId);
    const previousGroups = structure.groups.slice(0, currentGroupIndex);
    
    setColumnConfigGroupId(groupId);
    setColumnConfigType('grand_total');
    setSelectedSourceGroups(previousGroups.map(g => g.id)); // Select all previous by default
    setNewColumnName('المجموع الكلي');
    setNewColumnUseGroupColor(true);
    setColumnConfigDialogOpen(true);
  };

  // Create column after configuration
  const handleCreateColumn = () => {
    const groupId = columnConfigGroupId;
    
    if (columnConfigType === 'score') {
      // Add regular score column
      setStructure(prev => ({
        ...prev,
        groups: prev.groups.map(g => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            columns: [...g.columns, {
              id: `col${Date.now()}`,
              name_ar: newColumnName || `عمود ${g.columns.length + 1}`,
              max_score: 1,
              type: 'score' as const,
              useGroupColor: newColumnUseGroupColor
            }]
          };
        })
      }));
    } else if (columnConfigType === 'total') {
      // Calculate total from selected columns
      const group = structure.groups.find(g => g.id === groupId);
      if (!group) return;
      
      const totalScore = group.columns
        .filter(c => selectedSourceColumns.includes(c.id))
        .reduce((sum, c) => sum + c.max_score, 0);
      
      setStructure(prev => ({
        ...prev,
        groups: prev.groups.map(g => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            columns: [...g.columns, {
              id: `total${Date.now()}`,
              name_ar: newColumnName || 'المجموع',
              max_score: totalScore,
              type: 'total' as const,
              sourceColumnIds: selectedSourceColumns,
              useGroupColor: newColumnUseGroupColor
            }]
          };
        })
      }));
    } else if (columnConfigType === 'grand_total') {
      // Calculate grand total from selected groups
      const grandTotal = selectedSourceGroups.reduce((sum, gid) => {
        const group = structure.groups.find(g => g.id === gid);
        if (!group) return sum;
        const totalCol = group.columns.find(c => c.type === 'total');
        return sum + (totalCol?.max_score || calculateGroupTotal(gid));
      }, 0);
      
      setStructure(prev => ({
        ...prev,
        groups: prev.groups.map(g => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            columns: [...g.columns, {
              id: `grandtotal${Date.now()}`,
              name_ar: newColumnName || 'المجموع الكلي',
              max_score: grandTotal,
              type: 'grand_total' as const,
              sourceGroupIds: selectedSourceGroups,
              useGroupColor: newColumnUseGroupColor
            }]
          };
        })
      }));
    }
    
    setColumnConfigDialogOpen(false);
  };

  const addColumn = (groupId: string) => {
    openNewColumnDialog(groupId);
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
    openTotalColumnDialog(groupId);
  };

  // Add grand total column that sums totals from selected groups
  const addGrandTotalColumn = (groupId: string) => {
    openGrandTotalDialog(groupId);
  };

  // Calculate group total
  const calculateGroupTotal = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return 0;
    return group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, c) => sum + c.max_score, 0);
  };

  // Calculate grand total from source groups
  const calculateGrandTotal = (sourceGroupIds?: string[]) => {
    if (!sourceGroupIds || sourceGroupIds.length === 0) return 0;
    return sourceGroupIds.reduce((sum, gid) => {
      const group = structure.groups.find(g => g.id === gid);
      if (!group) return sum;
      const totalCol = group.columns.find(c => c.type === 'total');
      return sum + (totalCol?.max_score || calculateGroupTotal(gid));
    }, 0);
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
            const groups: GradingGroup[] = data.structure.groups.map((group: any, index: number) => ({
              id: `group-${Date.now()}-${index}`,
              name_ar: group.name || `مجموعة ${index + 1}`,
              color: GROUP_COLORS[index % GROUP_COLORS.length].color,
              border: GROUP_COLORS[index % GROUP_COLORS.length].border,
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
            
            setActiveTab('builder');
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

  // Save structure as template
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    if (structure.groups.length === 0) {
      toast.error('يجب إضافة مجموعة واحدة على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      // Convert structure to template periods
      const periods = structure.groups.flatMap((group, groupIndex) => 
        group.columns.filter(col => col.type === 'score').map((col, colIndex) => ({
          name: col.name_ar,
          name_ar: col.name_ar,
          max_score: col.max_score,
          weight: 1,
        }))
      );

      await createTemplate.mutateAsync({
        name: templateName,
        name_ar: templateName,
        description: templateDescription,
        periods,
      });

      setSaveDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
      setActiveTab('templates');
      toast.success('تم حفظ القالب بنجاح');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل في حفظ القالب');
    } finally {
      setIsSaving(false);
    }
  };

  // Load template into builder
  const loadTemplateToBuilder = async (template: GradingTemplate) => {
    const { data: templatePeriods } = await supabase
      .from('grading_template_periods')
      .select('*')
      .eq('template_id', template.id)
      .order('display_order', { ascending: true });

    if (templatePeriods && templatePeriods.length > 0) {
      // Create a single group with all periods as columns
      const group: GradingGroup = {
        id: `group-${Date.now()}`,
        name_ar: template.name_ar,
        color: GROUP_COLORS[0].color,
        border: GROUP_COLORS[0].border,
        columns: templatePeriods.map((p, index) => ({
          id: `col-${Date.now()}-${index}`,
          name_ar: p.name_ar,
          max_score: p.max_score,
          type: 'score' as const
        }))
      };

      setStructure({
        groups: [group],
        settings: {
          showPercentage: true,
          passingScore: 50,
        }
      });
      setActiveTab('builder');
    }
  };

  // Assignment handlers
  const openAssignDialog = (template: GradingTemplate) => {
    setSelectedTemplate(template);
    setAssignment({
      education_level_id: '',
      grade_level_ids: [],
      subject_ids: [],
    });
    setAssignDialogOpen(true);
  };

  const toggleGradeLevel = (gradeId: string) => {
    setAssignment(prev => ({
      ...prev,
      grade_level_ids: prev.grade_level_ids.includes(gradeId)
        ? prev.grade_level_ids.filter(id => id !== gradeId)
        : [...prev.grade_level_ids, gradeId],
    }));
  };

  const toggleSubject = (subjectId: string) => {
    setAssignment(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId],
    }));
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplate || !assignment.education_level_id) return;
    
    setIsAssigning(true);
    try {
      const { data: templatePeriods } = await supabase
        .from('grading_template_periods')
        .select('*')
        .eq('template_id', selectedTemplate.id)
        .order('display_order', { ascending: true });

      if (!templatePeriods || templatePeriods.length === 0) {
        toast.error('القالب لا يحتوي على فترات');
        return;
      }

      const gradeLevels = assignment.grade_level_ids.length > 0 
        ? assignment.grade_level_ids 
        : [null];
      const subjects = assignment.subject_ids.length > 0 
        ? assignment.subject_ids 
        : [null];

      const periodsToInsert = [];
      for (const gradeId of gradeLevels) {
        for (const subjectId of subjects) {
          for (const period of templatePeriods) {
            periodsToInsert.push({
              education_level_id: assignment.education_level_id,
              grade_level_id: gradeId,
              subject_id: subjectId,
              name: period.name,
              name_ar: period.name_ar,
              max_score: period.max_score,
              weight: period.weight,
              display_order: period.display_order,
              is_active: true,
            });
          }
        }
      }

      const { error } = await supabase
        .from('grading_periods')
        .insert(periodsToInsert);

      if (error) throw error;

      toast.success(`تم تطبيق القالب بنجاح`);
      setAssignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['grading_periods'] });
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('فشل في تطبيق القالب');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      await deleteTemplate.mutateAsync(templateId);
    }
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    localStorage.setItem('default_grading_template', templateId);
    toast.success('تم تعيين القالب الافتراضي');
    queryClient.invalidateQueries({ queryKey: ['grading_templates'] });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={activeTab === 'templates' ? 'default' : 'outline'}
          onClick={() => setActiveTab('templates')}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          القوالب المحفوظة
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
          variant={activeTab === 'builder' ? 'default' : 'outline'}
          onClick={() => setActiveTab('builder')}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          بناء مخصص
        </Button>
        <Button 
          variant={activeTab === 'preview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('preview')}
          className="gap-2"
          disabled={structure.groups.length === 0}
        >
          <Eye className="h-4 w-4" />
          معاينة
        </Button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                قوالب سجل الدرجات
              </CardTitle>
              <CardDescription className="mt-1">
                اختر قالب وقم بتطبيقه أو تعديله
              </CardDescription>
            </div>
            <Button onClick={() => setActiveTab('builder')}>
              <Plus className="h-4 w-4 ml-1" />
              قالب جديد
            </Button>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">لا توجد قوالب</p>
                <p className="text-muted-foreground mb-4">ابدأ ببناء قالب جديد أو ارفع صورة نموذج</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setActiveTab('builder')}>
                    <Plus className="h-4 w-4 ml-1" />
                    بناء قالب
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    <Sparkles className="h-4 w-4 ml-1" />
                    رفع نموذج
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                  <Card key={template.id} className={`relative ${defaultTemplateId === template.id ? 'ring-2 ring-primary' : ''}`}>
                    {defaultTemplateId === template.id && (
                      <Badge className="absolute -top-2 -right-2" variant="default">
                        <Star className="h-3 w-3 ml-1" />
                        افتراضي
                      </Badge>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{template.name_ar}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          onClick={() => openAssignDialog(template)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 ml-1" />
                          تطبيق
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => loadTemplateToBuilder(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {defaultTemplateId !== template.id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetDefaultTemplate(template.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    <p className="text-muted-foreground mt-2">يتم التعرف على الأعمدة والصفوف تلقائياً</p>
                  </div>
                ) : (
                  <>
                    <div className="relative inline-block mb-4">
                      <Upload className="h-16 w-16 text-muted-foreground" />
                      <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
                    </div>
                    <p className="text-xl font-medium mb-2">ارفع صورة نموذج سجل الدرجات</p>
                    <p className="text-muted-foreground text-center max-w-md">
                      الذكاء الاصطناعي سيتعرف على الأعمدة والصفوف ويحوّلها لسجل درجات قابل للتعديل
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
              <Button onClick={() => setActiveTab('builder')}>
                تعديل الهيكل
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('preview')}>
                معاينة
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">بناء هيكل سجل الدرجات</h3>
              <p className="text-sm text-muted-foreground">أضف مجموعات وأعمدة لتصميم السجل</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addGroup}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة مجموعة
              </Button>
              {structure.groups.length > 0 && (
                <Button onClick={() => setSaveDialogOpen(true)}>
                  <Save className="h-4 w-4 ml-1" />
                  حفظ كقالب
                </Button>
              )}
            </div>
          </div>

          {structure.groups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Table className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">ابدأ ببناء السجل</p>
                <p className="text-muted-foreground mb-4">أضف مجموعات لتنظيم أعمدة الدرجات</p>
                <Button onClick={addGroup}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة مجموعة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {structure.groups.map((group, groupIndex) => (
                <Card 
                  key={group.id} 
                  className="overflow-hidden"
                  style={{ borderColor: group.border, borderWidth: '2px' }}
                >
                  <CardHeader 
                    className="py-3"
                    style={{ backgroundColor: group.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <Input 
                          value={group.name_ar}
                          onChange={(e) => updateGroup(group.id, 'name_ar', e.target.value)}
                          className="w-48 bg-background/80"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Color picker */}
                        <div className="flex gap-1">
                          {GROUP_COLORS.map(colorData => (
                            <button
                              key={colorData.id}
                              onClick={() => changeGroupColor(group.id, colorData)}
                              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                              style={{ 
                                backgroundColor: colorData.color,
                                borderColor: group.color === colorData.color ? colorData.border : 'transparent'
                              }}
                              title={colorData.name}
                            />
                          ))}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Columns with DnD */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleColumnDragEnd(group.id)}
                      >
                        <SortableContext
                          items={group.columns.map(c => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="grid gap-2">
                            {group.columns.map((column) => (
                              <SortableColumn
                                key={column.id}
                                column={column}
                                groupId={group.id}
                                group={group}
                                structure={structure}
                                updateColumn={updateColumn}
                                removeColumn={removeColumn}
                                calculateGrandTotal={calculateGrandTotal}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                      
                      {/* Add column buttons */}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addColumn(group.id)}
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          عمود جديد
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addTotalColumn(group.id)}
                        >
                          <Calculator className="h-4 w-4 ml-1" />
                          مجموع المجموعة
                        </Button>
                        {groupIndex > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addGrandTotalColumn(group.id)}
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            <Calculator className="h-4 w-4 ml-1" />
                            مجموع المجموعات السابقة
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Summary */}
              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-base py-1 px-3">
                        <Calculator className="h-4 w-4 ml-1" />
                        مجموع الدرجات: {calculateTotalMaxScore()}
                      </Badge>
                      <Badge variant="outline">
                        {structure.groups.length} مجموعات
                      </Badge>
                      <Badge variant="outline">
                        {structure.groups.reduce((s, g) => s + g.columns.length, 0)} أعمدة
                      </Badge>
                    </div>
                    <Button onClick={() => setActiveTab('preview')}>
                      <Eye className="h-4 w-4 ml-1" />
                      معاينة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && structure.groups.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">معاينة سجل الدرجات</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('builder')}>
                <Edit className="h-4 w-4 ml-1" />
                تعديل
              </Button>
              <Button onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-4 w-4 ml-1" />
                حفظ كقالب
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-3 bg-muted text-right min-w-[150px]">اسم الطالب</th>
                    {structure.groups.map(group => (
                      <th 
                        key={group.id}
                        colSpan={group.columns.length}
                        className="border p-2 text-center font-bold"
                        style={{ backgroundColor: group.color }}
                      >
                        {group.name_ar}
                      </th>
                    ))}
                    <th className="border p-3 bg-muted text-center">المجموع الكلي</th>
                  </tr>
                  <tr>
                    <th className="border p-2 bg-muted/50"></th>
                    {structure.groups.flatMap(group => 
                      group.columns.map(col => (
                        <th 
                          key={col.id}
                          className="border p-2 text-center text-sm"
                          style={{ backgroundColor: group.color + '80' }}
                        >
                          <div>{col.name_ar}</div>
                          <div className="text-xs text-muted-foreground">({col.max_score})</div>
                        </th>
                      ))
                    )}
                    <th className="border p-2 bg-muted/50 text-center">
                      <div>المجموع</div>
                      <div className="text-xs text-muted-foreground">({calculateTotalMaxScore()})</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(i => (
                    <tr key={i}>
                      <td className="border p-3 text-muted-foreground">طالب {i}</td>
                      {structure.groups.flatMap(group => 
                        group.columns.map(col => (
                          <td key={col.id} className="border p-2 text-center text-muted-foreground">
                            -
                          </td>
                        ))
                      )}
                      <td className="border p-2 text-center font-medium text-muted-foreground">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حفظ كقالب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم القالب</Label>
              <Input 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="مثال: سجل درجات المرحلة الابتدائية"
              />
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Input 
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="وصف مختصر للقالب"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تطبيق القالب: {selectedTemplate?.name_ar}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المرحلة التعليمية</Label>
              <Select 
                value={assignment.education_level_id}
                onValueChange={(value) => setAssignment(prev => ({ 
                  ...prev, 
                  education_level_id: value,
                  grade_level_ids: [],
                  subject_ids: []
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map(level => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assignment.education_level_id && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>الصفوف الدراسية</Label>
                    <Button variant="ghost" size="sm" onClick={() => setAssignment(prev => ({ ...prev, grade_level_ids: filteredGradeLevels.map(g => g.id) }))}>
                      تحديد الكل
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {filteredGradeLevels.map(grade => (
                      <div key={grade.id} className="flex items-center gap-2">
                        <Checkbox 
                          checked={assignment.grade_level_ids.includes(grade.id)}
                          onCheckedChange={() => toggleGradeLevel(grade.id)}
                        />
                        <span className="text-sm">{grade.name_ar}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>المواد الدراسية</Label>
                    <Button variant="ghost" size="sm" onClick={() => setAssignment(prev => ({ ...prev, subject_ids: filteredSubjects.map(s => s.id) }))}>
                      تحديد الكل
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {filteredSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center gap-2">
                        <Checkbox 
                          checked={assignment.subject_ids.includes(subject.id)}
                          onCheckedChange={() => toggleSubject(subject.id)}
                        />
                        <span className="text-sm">{subject.name_ar}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAssignTemplate} disabled={isAssigning || !assignment.education_level_id}>
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Settings className="h-4 w-4 ml-1" />}
              تطبيق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Configuration Dialog */}
      <Dialog open={columnConfigDialogOpen} onOpenChange={setColumnConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {columnConfigType === 'score' ? 'إضافة عمود جديد' : 
               columnConfigType === 'total' ? 'إضافة عمود مجموع' : 'إضافة مجموع كلي'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Column Name */}
            <div>
              <Label>اسم العمود</Label>
              <Input 
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder={columnConfigType === 'score' ? 'مثال: التفاعل' : 
                             columnConfigType === 'total' ? 'المجموع' : 'المجموع الكلي'}
              />
            </div>

            {/* Source Columns Selection for Total */}
            {columnConfigType === 'total' && (
              <div>
                <Label className="mb-2 block">ما هي الأعمدة التي تريد جمعها؟</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {(() => {
                    const group = structure.groups.find(g => g.id === columnConfigGroupId);
                    const scoreColumns = group?.columns.filter(c => c.type === 'score') || [];
                    return scoreColumns.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">اختر الأعمدة</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedSourceColumns(scoreColumns.map(c => c.id))}
                          >
                            تحديد الكل
                          </Button>
                        </div>
                        {scoreColumns.map(col => (
                          <div key={col.id} className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedSourceColumns.includes(col.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSourceColumns(prev => [...prev, col.id]);
                                } else {
                                  setSelectedSourceColumns(prev => prev.filter(id => id !== col.id));
                                }
                              }}
                            />
                            <span className="text-sm">{col.name_ar}</span>
                            <Badge variant="outline" className="text-xs">{col.max_score}</Badge>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        لا توجد أعمدة درجات في هذه المجموعة
                      </p>
                    );
                  })()}
                </div>
                {selectedSourceColumns.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    المجموع: {structure.groups.find(g => g.id === columnConfigGroupId)?.columns
                      .filter(c => selectedSourceColumns.includes(c.id))
                      .reduce((sum, c) => sum + c.max_score, 0) || 0}
                  </div>
                )}
              </div>
            )}

            {/* Source Groups Selection for Grand Total */}
            {columnConfigType === 'grand_total' && (
              <div>
                <Label className="mb-2 block">ما هي المجموعات التي تريد جمع مجاميعها؟</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {(() => {
                    const currentGroupIndex = structure.groups.findIndex(g => g.id === columnConfigGroupId);
                    const previousGroups = structure.groups.slice(0, currentGroupIndex);
                    return previousGroups.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">اختر المجموعات</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedSourceGroups(previousGroups.map(g => g.id))}
                          >
                            تحديد الكل
                          </Button>
                        </div>
                        {previousGroups.map(grp => {
                          const groupTotal = grp.columns.find(c => c.type === 'total');
                          const totalScore = groupTotal?.max_score || calculateGroupTotal(grp.id);
                          return (
                            <div key={grp.id} className="flex items-center gap-2">
                              <Checkbox 
                                checked={selectedSourceGroups.includes(grp.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSourceGroups(prev => [...prev, grp.id]);
                                  } else {
                                    setSelectedSourceGroups(prev => prev.filter(id => id !== grp.id));
                                  }
                                }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border-2"
                                style={{ backgroundColor: grp.color, borderColor: grp.border }}
                              />
                              <span className="text-sm">{grp.name_ar}</span>
                              <Badge variant="outline" className="text-xs">{totalScore}</Badge>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        لا توجد مجموعات سابقة للجمع منها
                      </p>
                    );
                  })()}
                </div>
                {selectedSourceGroups.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    المجموع الكلي: {selectedSourceGroups.reduce((sum, gid) => {
                      const grp = structure.groups.find(g => g.id === gid);
                      if (!grp) return sum;
                      const totalCol = grp.columns.find(c => c.type === 'total');
                      return sum + (totalCol?.max_score || calculateGroupTotal(gid));
                    }, 0)}
                  </div>
                )}
              </div>
            )}

            {/* Color Option */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label>استخدام لون المجموعة</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={newColumnUseGroupColor ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewColumnUseGroupColor(true)}
                >
                  ملون
                </Button>
                <Button
                  variant={!newColumnUseGroupColor ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewColumnUseGroupColor(false)}
                >
                  أبيض
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColumnConfigDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleCreateColumn} 
              disabled={
                (columnConfigType === 'total' && selectedSourceColumns.length === 0) ||
                (columnConfigType === 'grand_total' && selectedSourceGroups.length === 0)
              }
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
