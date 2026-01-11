import { useState, useCallback, useMemo } from 'react';
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
import {
  useGradingStructures,
  useCreateGradingStructure,
  useDeleteGradingStructure,
} from '@/hooks/useGradingStructures';
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

// ألوان المجموعات - Extended (unique colors only)
const GROUP_COLORS = [
  { id: 'yellow', color: '#fef3c7', name: 'أصفر', border: '#fbbf24' },
  { id: 'green', color: '#d1fae5', name: 'أخضر', border: '#34d399' },
  { id: 'blue', color: '#dbeafe', name: 'أزرق', border: '#60a5fa' },
  { id: 'red', color: '#fecaca', name: 'أحمر', border: '#f87171' },
  { id: 'purple', color: '#e9d5ff', name: 'بنفسجي', border: '#a78bfa' },
  { id: 'orange', color: '#fed7aa', name: 'برتقالي', border: '#fb923c' },
  { id: 'pink', color: '#fce7f3', name: 'وردي', border: '#f472b6' },
  { id: 'cyan', color: '#cffafe', name: 'سماوي', border: '#22d3d8' },
  { id: 'lime', color: '#ecfccb', name: 'ليموني', border: '#a3e635' },
  { id: 'teal', color: '#ccfbf1', name: 'أزرق مخضر', border: '#2dd4bf' },
  { id: 'indigo', color: '#e0e7ff', name: 'نيلي', border: '#818cf8' },
  { id: 'rose', color: '#ffe4e6', name: 'وردي داكن', border: '#fb7185' },
  { id: 'sky', color: '#e0f2fe', name: 'سماء', border: '#38bdf8' },
  { id: 'violet', color: '#ede9fe', name: 'بنفسجي فاتح', border: '#8b5cf6' },
  { id: 'gray', color: '#f3f4f6', name: 'رمادي', border: '#9ca3af' },
  { id: 'slate', color: '#e2e8f0', name: 'رمادي داكن', border: '#64748b' },
];

interface GradingColumn {
  id: string;
  name_ar: string;
  max_score: number;
  type: 'score' | 'total' | 'grand_total' | 'group_sum' | 'external_sum' | 'percentage' | 'label';
  sourceGroupIds?: string[]; // للمجموع الكلي - المجموعات المراد جمع مجاميعها
  sourceColumnIds?: string[]; // للمجموع - الأعمدة المراد جمعها
  externalSourceColumns?: string[]; // للجمع الخارجي - أعمدة درجات من مجموعات أخرى (format: "groupId:columnId")
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
    showGrandTotal: boolean;
  };
}

type ActiveTab = 'templates' | 'upload' | 'builder' | 'preview' | 'assignments';

// Sortable Column Item Component
interface SortableColumnProps {
  column: GradingColumn;
  groupId: string;
  group: GradingGroup;
  structure: GradingStructure;
  updateColumn: (groupId: string, columnId: string, field: keyof GradingColumn, value: any) => void;
  removeColumn: (groupId: string, columnId: string) => void;
  calculateGrandTotal: (sourceGroupIds?: string[], sourceColumnIds?: string[], externalSourceColumns?: string[]) => number;
  onEditColumn: (groupId: string, column: GradingColumn) => void;
}

function SortableColumn({ 
  column, 
  groupId, 
  group, 
  structure, 
  updateColumn, 
  removeColumn,
  calculateGrandTotal,
  onEditColumn
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
        {/* Show source groups and columns for grand total or group_sum */}
        {(column.type === 'grand_total' || column.type === 'group_sum') && (
          <div className="flex gap-1 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">يجمع:</span>
            {column.sourceGroupIds?.map(key => {
              // New format: "groupId:columnId"
              if (key.includes(':')) {
                const [grpId, colId] = key.split(':');
                const sourceGroup = structure.groups.find(g => g.id === grpId);
                const sourceCol = sourceGroup?.columns.find(c => c.id === colId);
                return sourceGroup && sourceCol ? (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    className="text-xs py-0"
                    style={{ borderColor: sourceGroup.border, backgroundColor: sourceGroup.color }}
                  >
                    {sourceGroup.name_ar} - {sourceCol.name_ar}
                  </Badge>
                ) : null;
              } else {
                // Old format: just groupId
                const sourceGroup = structure.groups.find(g => g.id === key);
                return sourceGroup ? (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    className="text-xs py-0"
                    style={{ borderColor: sourceGroup.border, backgroundColor: sourceGroup.color }}
                  >
                    {sourceGroup.name_ar}
                  </Badge>
                ) : null;
              }
            })}
            {column.type === 'grand_total' && column.sourceColumnIds?.map(scId => {
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
        {/* Show source columns for external_sum */}
        {column.type === 'external_sum' && column.externalSourceColumns && (
          <div className="flex gap-1 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">يجمع:</span>
            {column.externalSourceColumns.map(key => {
              const [grpId, colId] = key.split(':');
              const sourceGroup = structure.groups.find(g => g.id === grpId);
              const sourceCol = sourceGroup?.columns.find(c => c.id === colId);
              return sourceGroup && sourceCol ? (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className="text-xs py-0"
                  style={{ borderColor: sourceGroup.border, backgroundColor: sourceGroup.color }}
                >
                  {sourceGroup.name_ar} - {sourceCol.name_ar}
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
          value={column.type === 'grand_total' || column.type === 'group_sum' || column.type === 'external_sum' ? calculateGrandTotal(column.sourceGroupIds, column.sourceColumnIds, column.externalSourceColumns) : column.max_score}
          onChange={(e) => updateColumn(groupId, column.id, 'max_score', parseInt(e.target.value) || 0)}
          className="w-20"
          min={0}
          disabled={column.type === 'total' || column.type === 'grand_total' || column.type === 'group_sum' || column.type === 'external_sum'}
        />
      </div>
      <div className="flex items-center gap-1">
        <Badge variant={
          column.type === 'score' ? 'secondary' : 
          column.type === 'total' ? 'default' : 
          column.type === 'group_sum' ? 'outline' : 
          column.type === 'external_sum' ? 'outline' : 'destructive'
        } className={
          column.type === 'group_sum' ? 'border-amber-500 text-amber-600' : 
          column.type === 'external_sum' ? 'border-green-500 text-green-600' : ''
        }>
          {column.type === 'score' ? 'درجة' : 
           column.type === 'total' ? 'مجموع' : 
           column.type === 'group_sum' ? 'مجموع مجموعات' : 
           column.type === 'external_sum' ? 'مجموع خارجي' : 'مجموع كلي'}
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
        onClick={() => onEditColumn(groupId, column)}
        title="تعديل"
      >
        <Edit className="h-4 w-4" />
      </Button>
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

  // Get grading structures (applied templates)
  const [assignmentsFilterEducationLevel, setAssignmentsFilterEducationLevel] = useState<string>('');
  const { data: appliedStructures, isLoading: structuresLoading } = useGradingStructures(
    assignmentsFilterEducationLevel ? { education_level_id: assignmentsFilterEducationLevel } : undefined
  );

  // Mutations
  const createTemplate = useCreateGradingTemplate();
  const updateTemplate = useUpdateGradingTemplate();
  const deleteTemplate = useDeleteGradingTemplate();
  const createGradingStructure = useCreateGradingStructure();
  const deleteGradingStructure = useDeleteGradingStructure();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('templates');

  // Structure state
  const [structure, setStructure] = useState<GradingStructure>({
    groups: [],
    settings: {
      showPercentage: true,
      passingScore: 50,
      showGrandTotal: true,
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
  
  // Track which template is being edited in the builder
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Default template
  const defaultTemplateId = localStorage.getItem('default_grading_template');

  // Column configuration dialogs
  const [columnConfigDialogOpen, setColumnConfigDialogOpen] = useState(false);
  const [columnConfigType, setColumnConfigType] = useState<'score' | 'total' | 'grand_total' | 'group_sum' | 'external_sum'>('score');
  const [columnConfigGroupId, setColumnConfigGroupId] = useState<string>('');
  const [selectedSourceColumns, setSelectedSourceColumns] = useState<string[]>([]);
  const [selectedSourceGroups, setSelectedSourceGroups] = useState<string[]>([]);
  const [newColumnUseGroupColor, setNewColumnUseGroupColor] = useState(true);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null); // For editing existing columns
  const [selectedSameGroupColumns, setSelectedSameGroupColumns] = useState<string[]>([]); // For grand total from same group
  const [selectedExternalColumns, setSelectedExternalColumns] = useState<string[]>([]); // For external_sum - scores from other groups

  // Get filtered data based on selected education level
  const filteredGradeLevels = allGradeLevels?.filter(
    g => g.education_level_id === assignment.education_level_id
  ) || [];
  
  // Get unique subjects by name_ar (to avoid duplicates across grade levels)
  const filteredSubjects = useMemo(() => {
    const subjectsForLevel = allSubjects?.filter(
      s => s.education_level_id === assignment.education_level_id
    ) || [];
    
    // Create a map to get unique subjects by name_ar, keeping the first occurrence
    const uniqueSubjectsMap = new Map<string, typeof subjectsForLevel[0]>();
    subjectsForLevel.forEach(subject => {
      if (!uniqueSubjectsMap.has(subject.name_ar)) {
        uniqueSubjectsMap.set(subject.name_ar, subject);
      }
    });
    
    return Array.from(uniqueSubjectsMap.values());
  }, [allSubjects, assignment.education_level_id]);

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
    setEditingColumnId(null);
    setColumnConfigDialogOpen(true);
  };

  // Open dialog for total column
  const openTotalColumnDialog = (groupId: string, existingColumn?: GradingColumn) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const scoreColumns = group.columns.filter(c => c.type === 'score');
    setColumnConfigGroupId(groupId);
    setColumnConfigType('total');
    
    if (existingColumn) {
      setEditingColumnId(existingColumn.id);
      setSelectedSourceColumns(existingColumn.sourceColumnIds || scoreColumns.map(c => c.id));
      setNewColumnName(existingColumn.name_ar);
      setNewColumnUseGroupColor(existingColumn.useGroupColor !== false);
    } else {
      setEditingColumnId(null);
      setSelectedSourceColumns(scoreColumns.map(c => c.id)); // Select all by default
      setNewColumnName('المجموع');
      setNewColumnUseGroupColor(true);
    }
    setColumnConfigDialogOpen(true);
  };

  // Open dialog for grand total column - can now include columns from same group
  const openGrandTotalDialog = (groupId: string, existingColumn?: GradingColumn) => {
    const currentGroupIndex = structure.groups.findIndex(g => g.id === groupId);
    const previousGroups = structure.groups.slice(0, currentGroupIndex);
    const currentGroup = structure.groups[currentGroupIndex];
    
    setColumnConfigGroupId(groupId);
    setColumnConfigType('grand_total');
    
    if (existingColumn) {
      setEditingColumnId(existingColumn.id);
      // Existing column may have old or new format
      setSelectedSourceGroups(existingColumn.sourceGroupIds || []);
      setSelectedSameGroupColumns(existingColumn.sourceColumnIds || []);
      setNewColumnName(existingColumn.name_ar);
      setNewColumnUseGroupColor(existingColumn.useGroupColor !== false);
    } else {
      setEditingColumnId(null);
      // Default: select all total/grand_total columns from previous groups (new format)
      const defaultSelections: string[] = [];
      previousGroups.forEach(grp => {
        grp.columns
          .filter(c => c.type === 'total' || c.type === 'grand_total')
          .forEach(col => {
            defaultSelections.push(`${grp.id}:${col.id}`);
          });
      });
      setSelectedSourceGroups(defaultSelections);
      setSelectedSameGroupColumns([]); // No same-group columns by default
      setNewColumnName('المجموع الكلي');
      setNewColumnUseGroupColor(true);
    }
    setColumnConfigDialogOpen(true);
  };

  // Open dialog for group_sum column - sum from previous groups only
  const openGroupSumDialog = (groupId: string, existingColumn?: GradingColumn) => {
    const currentGroupIndex = structure.groups.findIndex(g => g.id === groupId);
    const previousGroups = structure.groups.slice(0, currentGroupIndex);
    
    setColumnConfigGroupId(groupId);
    setColumnConfigType('group_sum');
    
    if (existingColumn) {
      setEditingColumnId(existingColumn.id);
      setSelectedSourceGroups(existingColumn.sourceGroupIds || []);
      setNewColumnName(existingColumn.name_ar);
      setNewColumnUseGroupColor(existingColumn.useGroupColor !== false);
    } else {
      setEditingColumnId(null);
      // Default: select all total columns from previous groups
      const defaultSelections: string[] = [];
      previousGroups.forEach(grp => {
        grp.columns
          .filter(c => c.type === 'total' || c.type === 'grand_total' || c.type === 'group_sum')
          .forEach(col => {
            defaultSelections.push(`${grp.id}:${col.id}`);
          });
      });
      setSelectedSourceGroups(defaultSelections);
      setNewColumnName('مجموع المجموعات');
      setNewColumnUseGroupColor(true);
    }
    setColumnConfigDialogOpen(true);
  };

  // Open dialog for external_sum column - sum scores from other groups
  const openExternalSumDialog = (groupId: string, existingColumn?: GradingColumn) => {
    setColumnConfigGroupId(groupId);
    setColumnConfigType('external_sum');
    
    if (existingColumn) {
      setEditingColumnId(existingColumn.id);
      setSelectedExternalColumns(existingColumn.externalSourceColumns || []);
      setNewColumnName(existingColumn.name_ar);
      setNewColumnUseGroupColor(existingColumn.useGroupColor !== false);
    } else {
      setEditingColumnId(null);
      setSelectedExternalColumns([]);
      setNewColumnName('مجموع درجات');
      setNewColumnUseGroupColor(true);
    }
    setColumnConfigDialogOpen(true);
  };

  // Open edit dialog for existing column
  const openEditColumnDialog = (groupId: string, column: GradingColumn) => {
    if (column.type === 'score') {
      setColumnConfigGroupId(groupId);
      setColumnConfigType('score');
      setNewColumnName(column.name_ar);
      setNewColumnUseGroupColor(column.useGroupColor !== false);
      setEditingColumnId(column.id);
      setColumnConfigDialogOpen(true);
    } else if (column.type === 'total') {
      openTotalColumnDialog(groupId, column);
    } else if (column.type === 'grand_total') {
      openGrandTotalDialog(groupId, column);
    } else if (column.type === 'group_sum') {
      openGroupSumDialog(groupId, column);
    } else if (column.type === 'external_sum') {
      openExternalSumDialog(groupId, column);
    }
  };

  // Create or update column after configuration
  const handleCreateColumn = () => {
    const groupId = columnConfigGroupId;
    
    if (editingColumnId) {
      // Update existing column
      setStructure(prev => ({
        ...prev,
        groups: prev.groups.map(g => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            columns: g.columns.map(c => {
              if (c.id !== editingColumnId) return c;
              
              if (columnConfigType === 'score') {
                return {
                  ...c,
                  name_ar: newColumnName || c.name_ar,
                  useGroupColor: newColumnUseGroupColor
                };
              } else if (columnConfigType === 'total') {
                const totalScore = g.columns
                  .filter(col => selectedSourceColumns.includes(col.id))
                  .reduce((sum, col) => sum + col.max_score, 0);
                return {
                  ...c,
                  name_ar: newColumnName || c.name_ar,
                  max_score: totalScore,
                  sourceColumnIds: selectedSourceColumns,
                  useGroupColor: newColumnUseGroupColor
                };
              } else if (columnConfigType === 'grand_total' || columnConfigType === 'group_sum') {
                // grand_total or group_sum - calculate from selected group totals + same group columns
                let grandTotal = 0;
                
                // Calculate from selected source groups (format: "groupId:columnId")
                selectedSourceGroups.forEach(key => {
                  if (key.includes(':')) {
                    const [grpId, colId] = key.split(':');
                    const grp = prev.groups.find(gr => gr.id === grpId);
                    if (grp) {
                      const col = grp.columns.find(c => c.id === colId);
                      if (col) grandTotal += col.max_score;
                    }
                  } else {
                    // Backward compatibility: old format
                    const grp = prev.groups.find(gr => gr.id === key);
                    if (grp) {
                      const totalCol = grp.columns.find(col => col.type === 'total');
                      grandTotal += totalCol?.max_score || calculateGroupTotal(key);
                    }
                  }
                });
                
                // Add same-group columns (only for grand_total)
                if (columnConfigType === 'grand_total') {
                  grandTotal += g.columns
                    .filter(col => selectedSameGroupColumns.includes(col.id))
                    .reduce((sum, col) => sum + col.max_score, 0);
                }
                
                return {
                  ...c,
                  name_ar: newColumnName || c.name_ar,
                  max_score: grandTotal,
                  sourceGroupIds: selectedSourceGroups,
                  sourceColumnIds: columnConfigType === 'grand_total' ? selectedSameGroupColumns : undefined,
                  useGroupColor: newColumnUseGroupColor
                };
              } else if (columnConfigType === 'external_sum') {
                // external_sum - calculate from selected score columns from other groups
                let externalTotal = 0;
                selectedExternalColumns.forEach(key => {
                  const [grpId, colId] = key.split(':');
                  const grp = prev.groups.find(gr => gr.id === grpId);
                  if (grp) {
                    const col = grp.columns.find(c => c.id === colId);
                    if (col) externalTotal += col.max_score;
                  }
                });
                
                return {
                  ...c,
                  name_ar: newColumnName || c.name_ar,
                  max_score: externalTotal,
                  externalSourceColumns: selectedExternalColumns,
                  useGroupColor: newColumnUseGroupColor
                };
              }
            })
          };
        })
      }));
    } else {
      // Create new column
      if (columnConfigType === 'score') {
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
        const currentGroup = structure.groups.find(g => g.id === groupId);
        
        // Calculate from selected source groups (format: "groupId:columnId")
        let grandTotal = 0;
        selectedSourceGroups.forEach(key => {
          if (key.includes(':')) {
            const [grpId, colId] = key.split(':');
            const group = structure.groups.find(g => g.id === grpId);
            if (group) {
              const col = group.columns.find(c => c.id === colId);
              if (col) grandTotal += col.max_score;
            }
          } else {
            // Backward compatibility: old format
            const group = structure.groups.find(g => g.id === key);
            if (group) {
              const totalCol = group.columns.find(c => c.type === 'total');
              grandTotal += totalCol?.max_score || calculateGroupTotal(key);
            }
          }
        });
        
        // Add same-group columns
        if (currentGroup) {
          grandTotal += currentGroup.columns
            .filter(c => selectedSameGroupColumns.includes(c.id))
            .reduce((sum, c) => sum + c.max_score, 0);
        }
        
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
                sourceColumnIds: selectedSameGroupColumns,
                useGroupColor: newColumnUseGroupColor
              }]
            };
          })
        }));
      } else if (columnConfigType === 'group_sum') {
        // Calculate from selected source groups only (no same-group columns)
        let groupSumTotal = 0;
        selectedSourceGroups.forEach(key => {
          if (key.includes(':')) {
            const [grpId, colId] = key.split(':');
            const group = structure.groups.find(g => g.id === grpId);
            if (group) {
              const col = group.columns.find(c => c.id === colId);
              if (col) groupSumTotal += col.max_score;
            }
          } else {
            // Backward compatibility: old format
            const group = structure.groups.find(g => g.id === key);
            if (group) {
              const totalCol = group.columns.find(c => c.type === 'total');
              groupSumTotal += totalCol?.max_score || calculateGroupTotal(key);
            }
          }
        });
        
        setStructure(prev => ({
          ...prev,
          groups: prev.groups.map(g => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              columns: [...g.columns, {
                id: `groupsum${Date.now()}`,
                name_ar: newColumnName || 'مجموع المجموعات',
                max_score: groupSumTotal,
                type: 'group_sum' as const,
                sourceGroupIds: selectedSourceGroups,
                useGroupColor: newColumnUseGroupColor
              }]
            };
          })
        }));
      } else if (columnConfigType === 'external_sum') {
        // Calculate from selected external score columns
        let externalSumTotal = 0;
        selectedExternalColumns.forEach(key => {
          const [grpId, colId] = key.split(':');
          const group = structure.groups.find(g => g.id === grpId);
          if (group) {
            const col = group.columns.find(c => c.id === colId);
            if (col) externalSumTotal += col.max_score;
          }
        });
        
        setStructure(prev => ({
          ...prev,
          groups: prev.groups.map(g => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              columns: [...g.columns, {
                id: `externalsum${Date.now()}`,
                name_ar: newColumnName || 'مجموع درجات',
                max_score: externalSumTotal,
                type: 'external_sum' as const,
                externalSourceColumns: selectedExternalColumns,
                useGroupColor: newColumnUseGroupColor
              }]
            };
          })
        }));
      }
    }
    
    setColumnConfigDialogOpen(false);
    setEditingColumnId(null);
    setSelectedExternalColumns([]);
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

  // Add group sum column that sums from previous groups only
  const addGroupSumColumn = (groupId: string) => {
    openGroupSumDialog(groupId);
  };

  // Calculate group total
  const calculateGroupTotal = (groupId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return 0;
    return group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, c) => sum + c.max_score, 0);
  };

  // Calculate grand total from source groups (format: "groupId:columnId"), same-group columns, and external columns
  const calculateGrandTotal = (sourceGroupIds?: string[], sourceColumnIds?: string[], externalSourceColumns?: string[]) => {
    let total = 0;
    
    // Sum from other groups' total/grand_total columns (new format: "groupId:columnId")
    if (sourceGroupIds && sourceGroupIds.length > 0) {
      sourceGroupIds.forEach(key => {
        if (key.includes(':')) {
          // New format: groupId:columnId
          const [groupId, columnId] = key.split(':');
          const group = structure.groups.find(g => g.id === groupId);
          if (group) {
            const column = group.columns.find(c => c.id === columnId);
            if (column) {
              total += column.max_score;
            }
          }
        } else {
          // Old format: just groupId (backward compatibility)
          const group = structure.groups.find(g => g.id === key);
          if (group) {
            const totalCol = group.columns.find(c => c.type === 'total');
            total += totalCol?.max_score || calculateGroupTotal(key);
          }
        }
      });
    }
    
    // Sum from same-group columns (for grand_total that includes columns from its own group)
    if (sourceColumnIds && sourceColumnIds.length > 0) {
      // Find which group contains these columns
      for (const grp of structure.groups) {
        const columnsInGroup = grp.columns.filter(c => sourceColumnIds.includes(c.id));
        total += columnsInGroup.reduce((sum, c) => sum + c.max_score, 0);
      }
    }
    
    // Sum from external source columns (for external_sum - scores from other groups)
    if (externalSourceColumns && externalSourceColumns.length > 0) {
      externalSourceColumns.forEach(key => {
        const [groupId, columnId] = key.split(':');
        const group = structure.groups.find(g => g.id === groupId);
        if (group) {
          const column = group.columns.find(c => c.id === columnId);
          if (column) {
            total += column.max_score;
          }
        }
      });
    }
    
    return total;
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
                showGrandTotal: true,
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

  // Save structure as template (with full structure) - updates existing or creates new
  const handleSaveTemplate = async (saveAsNew: boolean = false) => {
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
      // Convert structure to template periods (for backward compatibility)
      const periods = structure.groups.flatMap((group, groupIndex) => 
        group.columns.map((col, colIndex) => ({
          name: col.name_ar,
          name_ar: col.name_ar,
          max_score: col.max_score,
          weight: 1,
          group_name: group.name_ar,
          type: col.type,
        }))
      );

      if (editingTemplateId && !saveAsNew) {
        // Update existing template
        await updateTemplate.mutateAsync({
          id: editingTemplateId,
          name: templateName,
          name_ar: templateName,
          description: JSON.stringify(structure), // Save structure as JSON
        });
        toast.success('تم تحديث القالب بنجاح');
      } else {
        // Create new template
        await createTemplate.mutateAsync({
          name: templateName,
          name_ar: templateName,
          description: templateDescription,
          periods,
          full_structure: structure, // Save the complete structure
        });
        toast.success('تم حفظ القالب بنجاح');
      }

      setSaveDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
      setEditingTemplateId(null);
      setActiveTab('templates');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل في حفظ القالب');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear editing state when starting fresh
  const startNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateDescription('');
    setStructure({
      groups: [],
      settings: {
        showPercentage: true,
        passingScore: 50,
        showGrandTotal: true,
      }
    });
    setActiveTab('builder');
  };

  // Load template into builder
  const loadTemplateToBuilder = async (template: GradingTemplate) => {
    // Track which template we're editing
    setEditingTemplateId(template.id);
    setTemplateName(template.name_ar);
    setTemplateDescription(''); // Will be overwritten with structure
    
    // Try to parse full structure from description first
    if (template.description) {
      try {
        const savedStructure = JSON.parse(template.description);
        if (savedStructure.groups && Array.isArray(savedStructure.groups)) {
          // Create ID mapping from old to new IDs
          const groupIdMap = new Map<string, string>();
          const columnIdMap = new Map<string, string>();
          const timestamp = Date.now();
          
          // First pass: generate new IDs and create mappings
          savedStructure.groups.forEach((g: GradingGroup, gi: number) => {
            const newGroupId = `group-${timestamp}-${gi}`;
            groupIdMap.set(g.id, newGroupId);
            
            g.columns.forEach((c: GradingColumn, ci: number) => {
              const newColId = `col-${timestamp}-${gi}-${ci}`;
              columnIdMap.set(c.id, newColId);
            });
          });
          
          // Helper to update reference key (format: "groupId:columnId")
          const updateReferenceKey = (key: string): string => {
            if (key.includes(':')) {
              const [grpId, colId] = key.split(':');
              const newGrpId = groupIdMap.get(grpId) || grpId;
              const newColId = columnIdMap.get(colId) || colId;
              return `${newGrpId}:${newColId}`;
            }
            // Just groupId
            return groupIdMap.get(key) || key;
          };
          
          // Second pass: build new structure with updated IDs and references
          const newStructure: GradingStructure = {
            groups: savedStructure.groups.map((g: GradingGroup, gi: number) => ({
              ...g,
              id: groupIdMap.get(g.id)!,
              columns: g.columns.map((c: GradingColumn, ci: number) => ({
                ...c,
                id: columnIdMap.get(c.id)!,
                // Update sourceGroupIds references
                sourceGroupIds: c.sourceGroupIds?.map(updateReferenceKey),
                // Update sourceColumnIds references  
                sourceColumnIds: c.sourceColumnIds?.map(id => columnIdMap.get(id) || id),
                // Update externalSourceColumns references
                externalSourceColumns: c.externalSourceColumns?.map(updateReferenceKey),
              }))
            })),
            settings: savedStructure.settings || {
              showPercentage: true,
              passingScore: 50,
              showGrandTotal: true,
            }
          };
          setStructure(newStructure);
          setActiveTab('builder');
          return;
        }
      } catch {
        // Not a valid JSON, fall back to periods
      }
    }

    // Fallback: Load from template periods
    const { data: templatePeriods } = await supabase
      .from('grading_template_periods')
      .select('*')
      .eq('template_id', template.id)
      .order('display_order', { ascending: true });

    if (templatePeriods && templatePeriods.length > 0) {
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
          showGrandTotal: true,
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
      // Parse full structure from template description
      let fullStructure: GradingStructure | null = null;
      if (selectedTemplate.description) {
        try {
          const parsed = JSON.parse(selectedTemplate.description);
          if (parsed.groups && Array.isArray(parsed.groups)) {
            fullStructure = parsed as GradingStructure;
          }
        } catch {
          // Not a valid JSON structure
        }
      }

      // If no full structure, try to build one from template periods
      if (!fullStructure) {
        const { data: templatePeriods } = await supabase
          .from('grading_template_periods')
          .select('*')
          .eq('template_id', selectedTemplate.id)
          .order('display_order', { ascending: true });

        if (templatePeriods && templatePeriods.length > 0) {
          fullStructure = {
            groups: [{
              id: `group-${Date.now()}`,
              name_ar: selectedTemplate.name_ar,
              color: GROUP_COLORS[0].color,
              border: GROUP_COLORS[0].border,
              columns: templatePeriods.map((p, i) => ({
                id: `col-${Date.now()}-${i}`,
                name_ar: p.name_ar,
                max_score: p.max_score,
                type: 'score' as const
              }))
            }],
            settings: { showPercentage: true, passingScore: 50, showGrandTotal: true }
          };
        }
      }

      if (!fullStructure) {
        toast.error('القالب لا يحتوي على هيكل صالح');
        return;
      }

      const gradeLevels = assignment.grade_level_ids.length > 0 
        ? assignment.grade_level_ids 
        : [null];
      const subjects = assignment.subject_ids.length > 0 
        ? assignment.subject_ids 
        : [null];

      // Insert into subject_grading_structures
      for (const gradeId of gradeLevels) {
        for (const subjectId of subjects) {
          await createGradingStructure.mutateAsync({
            education_level_id: assignment.education_level_id,
            grade_level_id: gradeId,
            subject_id: subjectId,
            template_id: selectedTemplate.id,
            name: selectedTemplate.name,
            name_ar: selectedTemplate.name_ar,
            structure: fullStructure,
            is_default: false,
          });
        }
      }

      const count = gradeLevels.length * subjects.length;
      toast.success(`تم تطبيق القالب على ${count} ${count === 1 ? 'عنصر' : 'عناصر'}`);
      setAssignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['grading_structures'] });
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
        <Button 
          variant={activeTab === 'assignments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('assignments')}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          التطبيقات
          {appliedStructures && appliedStructures.length > 0 && (
            <Badge variant="secondary" className="mr-1">{appliedStructures.length}</Badge>
          )}
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
            <Button onClick={startNewTemplate}>
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
                  <Button onClick={startNewTemplate}>
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
              <h3 className="text-lg font-semibold flex items-center gap-2">
                بناء هيكل سجل الدرجات
                {editingTemplateId && (
                  <Badge variant="secondary" className="font-normal">
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل: {templateName}
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">أضف مجموعات وأعمدة لتصميم السجل</p>
            </div>
            <div className="flex gap-2">
              {editingTemplateId && (
                <Button variant="ghost" onClick={startNewTemplate}>
                  <Plus className="h-4 w-4 ml-1" />
                  قالب جديد
                </Button>
              )}
              <Button variant="outline" onClick={addGroup}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة مجموعة
              </Button>
              {structure.groups.length > 0 && (
                <Button onClick={() => setSaveDialogOpen(true)}>
                  <Save className="h-4 w-4 ml-1" />
                  {editingTemplateId ? 'حفظ التعديلات' : 'حفظ كقالب'}
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
                        {/* Color picker - show only unused colors */}
                        <div className="flex gap-1">
                          {GROUP_COLORS.filter(colorData => {
                            // Show this color if it's the current group's color OR not used by any other group
                            const isCurrentGroupColor = group.color === colorData.color;
                            const usedByOtherGroup = structure.groups.some(
                              g => g.id !== group.id && g.color === colorData.color
                            );
                            return isCurrentGroupColor || !usedByOtherGroup;
                          }).map(colorData => (
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
                                onEditColumn={openEditColumnDialog}
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
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openExternalSumDialog(group.id)}
                              className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                              <Calculator className="h-4 w-4 ml-1" />
                              مجموع درجات خارجية
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addGroupSumColumn(group.id)}
                              className="border-amber-500 text-amber-600 hover:bg-amber-50"
                            >
                              <Calculator className="h-4 w-4 ml-1" />
                              مجموع من مجموعات سابقة
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addGrandTotalColumn(group.id)}
                              className="border-primary text-primary hover:bg-primary/10"
                            >
                              <Calculator className="h-4 w-4 ml-1" />
                              مجموع كلي
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Summary & Settings */}
              <Card className="bg-muted/50">
                <CardContent className="py-4 space-y-4">
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
                  
                  {/* Settings */}
                  <div className="flex items-center gap-6 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="showGrandTotal"
                        checked={structure.settings.showGrandTotal}
                        onCheckedChange={(checked) => 
                          setStructure(prev => ({
                            ...prev,
                            settings: { ...prev.settings, showGrandTotal: !!checked }
                          }))
                        }
                      />
                      <Label htmlFor="showGrandTotal" className="cursor-pointer">
                        إظهار المجموع الكلي
                      </Label>
                    </div>
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
                    {structure.settings.showGrandTotal && (
                      <th className="border p-3 bg-muted text-center">المجموع الكلي</th>
                    )}
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
                    {structure.settings.showGrandTotal && (
                      <th className="border p-2 bg-muted/50 text-center">
                        <div>المجموع</div>
                        <div className="text-xs text-muted-foreground">({calculateTotalMaxScore()})</div>
                      </th>
                    )}
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
                      {structure.settings.showGrandTotal && (
                        <td className="border p-2 text-center font-medium text-muted-foreground">-</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignments Tab - Show applied templates */}
      {activeTab === 'assignments' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                القوالب المطبقة
              </CardTitle>
              <CardDescription className="mt-1">
                عرض القوالب المطبقة على المراحل والصفوف والمواد
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">المرحلة:</Label>
              <Select 
                value={assignmentsFilterEducationLevel || "all"} 
                onValueChange={(v) => setAssignmentsFilterEducationLevel(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="جميع المراحل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المراحل</SelectItem>
                  {levels?.map(level => (
                    <SelectItem key={level.id} value={level.id}>{level.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {structuresLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !appliedStructures || appliedStructures.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">لا توجد تطبيقات</p>
                <p className="text-muted-foreground mb-4">قم بتطبيق قالب على مرحلة أو صف أو مادة</p>
                <Button onClick={() => setActiveTab('templates')}>
                  <FileText className="h-4 w-4 ml-1" />
                  عرض القوالب
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appliedStructures.map((struct) => {
                  const educationLevel = levels?.find(l => l.id === struct.education_level_id);
                  const gradeLevel = allGradeLevels?.find(g => g.id === struct.grade_level_id);
                  const subject = allSubjects?.find(s => s.id === struct.subject_id);
                  const template = templates?.find(t => t.id === struct.template_id);
                  
                  return (
                    <div 
                      key={struct.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{struct.name_ar}</div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {educationLevel && (
                            <Badge variant="outline">{educationLevel.name_ar}</Badge>
                          )}
                          {gradeLevel && (
                            <Badge variant="secondary">{gradeLevel.name_ar}</Badge>
                          )}
                          {subject && (
                            <Badge>{subject.name_ar}</Badge>
                          )}
                          {template && (
                            <Badge variant="outline" className="border-primary text-primary">
                              <FileText className="h-3 w-3 ml-1" />
                              {template.name_ar}
                            </Badge>
                          )}
                        </div>
                        {struct.structure && struct.structure.groups && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {struct.structure.groups.length} مجموعات • {' '}
                            {struct.structure.groups.reduce((s, g) => s + g.columns.length, 0)} أعمدة
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (struct.structure) {
                              // Convert to local GradingStructure format
                              const converted: GradingStructure = {
                                groups: struct.structure.groups.map(g => ({
                                  ...g,
                                  border: g.border || GROUP_COLORS.find(c => c.color === g.color)?.border || '#ccc'
                                })),
                                settings: struct.structure.settings
                              };
                              setStructure(converted);
                              setActiveTab('preview');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا التطبيق؟')) {
                              deleteGradingStructure.mutate(struct.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplateId ? 'تحديث القالب' : 'حفظ كقالب جديد'}</DialogTitle>
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
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              إلغاء
            </Button>
            {editingTemplateId && (
              <Button variant="outline" onClick={() => handleSaveTemplate(true)} disabled={isSaving}>
                <Save className="h-4 w-4 ml-1" />
                حفظ كقالب جديد
              </Button>
            )}
            <Button onClick={() => handleSaveTemplate(false)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
              {editingTemplateId ? 'تحديث القالب' : 'حفظ'}
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
              {editingColumnId ? 'تعديل العمود' : 
               columnConfigType === 'score' ? 'إضافة عمود جديد' : 
               columnConfigType === 'total' ? 'إضافة عمود مجموع' : 
               columnConfigType === 'group_sum' ? 'إضافة مجموع من مجموعات سابقة' : 
               columnConfigType === 'external_sum' ? 'إضافة مجموع درجات خارجية' : 'إضافة مجموع كلي'}
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
                             columnConfigType === 'total' ? 'المجموع' : 
                             columnConfigType === 'group_sum' ? 'مجموع المجموعات' : 
                             columnConfigType === 'external_sum' ? 'مجموع درجات' : 'المجموع الكلي'}
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

            {/* Source Groups Selection for Group Sum - only previous groups */}
            {columnConfigType === 'group_sum' && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">اختر المجاميع من المجموعات السابقة</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {(() => {
                      const currentGroupIndex = structure.groups.findIndex(g => g.id === columnConfigGroupId);
                      const previousGroups = structure.groups.slice(0, currentGroupIndex);
                      
                      // Collect all total, grand_total and group_sum columns from previous groups
                      const totalColumns: { groupId: string; groupName: string; column: GradingColumn; groupColor: string; groupBorder: string }[] = [];
                      previousGroups.forEach(grp => {
                        grp.columns
                          .filter(c => c.type === 'total' || c.type === 'grand_total' || c.type === 'group_sum')
                          .forEach(col => {
                            totalColumns.push({
                              groupId: grp.id,
                              groupName: grp.name_ar,
                              column: col,
                              groupColor: grp.color,
                              groupBorder: grp.border
                            });
                          });
                      });
                      
                      return totalColumns.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">اختر المجاميع للجمع</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedSourceGroups(totalColumns.map(tc => `${tc.groupId}:${tc.column.id}`))}
                            >
                              تحديد الكل
                            </Button>
                          </div>
                          {totalColumns.map(({ groupId, groupName, column, groupColor, groupBorder }) => {
                            const key = `${groupId}:${column.id}`;
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <Checkbox 
                                  checked={selectedSourceGroups.includes(key)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSourceGroups(prev => [...prev, key]);
                                    } else {
                                      setSelectedSourceGroups(prev => prev.filter(id => id !== key));
                                    }
                                  }}
                                />
                                <div 
                                  className="w-4 h-4 rounded-full border-2"
                                  style={{ backgroundColor: groupColor, borderColor: groupBorder }}
                                />
                                <span className="text-sm">{groupName} - {column.name_ar}</span>
                                <Badge 
                                  variant={column.type === 'grand_total' ? 'destructive' : column.type === 'group_sum' ? 'outline' : 'default'} 
                                  className={column.type === 'group_sum' ? 'text-xs border-amber-500 text-amber-600' : 'text-xs'}
                                >
                                  {column.max_score}
                                </Badge>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          لا توجد مجاميع في المجموعات السابقة. أضف عمود "مجموع المجموعة" في المجموعات السابقة أولاً.
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Total calculation for group_sum */}
                {selectedSourceGroups.length > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <span className="font-medium text-amber-700">المجموع: </span>
                    {(() => {
                      let total = 0;
                      selectedSourceGroups.forEach(key => {
                        if (key.includes(':')) {
                          const [grpId, colId] = key.split(':');
                          const grp = structure.groups.find(g => g.id === grpId);
                          if (grp) {
                            const col = grp.columns.find(c => c.id === colId);
                            if (col) total += col.max_score;
                          }
                        }
                      });
                      return total;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Source Groups Selection for Grand Total */}
            {columnConfigType === 'grand_total' && (
              <div className="space-y-4">
                {/* Previous groups - sum their totals/grand totals */}
                <div>
                  <Label className="mb-2 block">مجاميع المجموعات السابقة</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {(() => {
                      const currentGroupIndex = structure.groups.findIndex(g => g.id === columnConfigGroupId);
                      const previousGroups = structure.groups.slice(0, currentGroupIndex);
                      
                      // Collect all total and grand_total columns from previous groups
                      const totalColumns: { groupId: string; groupName: string; column: GradingColumn; groupColor: string; groupBorder: string }[] = [];
                      previousGroups.forEach(grp => {
                        grp.columns
                          .filter(c => c.type === 'total' || c.type === 'grand_total')
                          .forEach(col => {
                            totalColumns.push({
                              groupId: grp.id,
                              groupName: grp.name_ar,
                              column: col,
                              groupColor: grp.color,
                              groupBorder: grp.border
                            });
                          });
                      });
                      
                      return totalColumns.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">اختر المجاميع للجمع</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedSourceGroups(totalColumns.map(tc => `${tc.groupId}:${tc.column.id}`))}
                            >
                              تحديد الكل
                            </Button>
                          </div>
                          {totalColumns.map(({ groupId, groupName, column, groupColor, groupBorder }) => {
                            const key = `${groupId}:${column.id}`;
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <Checkbox 
                                  checked={selectedSourceGroups.includes(key)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSourceGroups(prev => [...prev, key]);
                                    } else {
                                      setSelectedSourceGroups(prev => prev.filter(id => id !== key));
                                    }
                                  }}
                                />
                                <div 
                                  className="w-4 h-4 rounded-full border-2"
                                  style={{ backgroundColor: groupColor, borderColor: groupBorder }}
                                />
                                <span className="text-sm">{groupName} - {column.name_ar}</span>
                                <Badge variant={column.type === 'grand_total' ? 'destructive' : 'default'} className="text-xs">
                                  {column.max_score}
                                </Badge>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          لا توجد مجاميع في المجموعات السابقة
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Same group columns */}
                <div>
                  <Label className="mb-2 block">أعمدة من نفس المجموعة (اختياري)</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                    {(() => {
                      const currentGroup = structure.groups.find(g => g.id === columnConfigGroupId);
                      const availableColumns = currentGroup?.columns.filter(c => 
                        c.type === 'score' || c.type === 'total'
                      ) || [];
                      return availableColumns.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">اختر الأعمدة</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedSameGroupColumns(availableColumns.map(c => c.id))}
                            >
                              تحديد الكل
                            </Button>
                          </div>
                          {availableColumns.map(col => (
                            <div key={col.id} className="flex items-center gap-2">
                              <Checkbox 
                                checked={selectedSameGroupColumns.includes(col.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSameGroupColumns(prev => [...prev, col.id]);
                                  } else {
                                    setSelectedSameGroupColumns(prev => prev.filter(id => id !== col.id));
                                  }
                                }}
                              />
                              <span className="text-sm">{col.name_ar}</span>
                              <Badge variant={col.type === 'total' ? 'default' : 'outline'} className="text-xs">
                                {col.max_score}
                              </Badge>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          لا توجد أعمدة
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Total calculation */}
                {(selectedSourceGroups.length > 0 || selectedSameGroupColumns.length > 0) && (
                  <div className="p-2 bg-muted rounded-lg text-sm">
                    <span className="font-medium">المجموع الكلي: </span>
                    {(() => {
                      let total = 0;
                      
                      // Sum from selected source groups (format: "groupId:columnId")
                      selectedSourceGroups.forEach(key => {
                        if (key.includes(':')) {
                          const [grpId, colId] = key.split(':');
                          const grp = structure.groups.find(g => g.id === grpId);
                          if (grp) {
                            const col = grp.columns.find(c => c.id === colId);
                            if (col) total += col.max_score;
                          }
                        } else {
                          // Backward compatibility
                          const grp = structure.groups.find(g => g.id === key);
                          if (grp) {
                            const totalCol = grp.columns.find(c => c.type === 'total');
                            total += totalCol?.max_score || calculateGroupTotal(key);
                          }
                        }
                      });
                      
                      const currentGroup = structure.groups.find(g => g.id === columnConfigGroupId);
                      if (currentGroup) {
                        total += currentGroup.columns
                          .filter(c => selectedSameGroupColumns.includes(c.id))
                          .reduce((sum, c) => sum + c.max_score, 0);
                      }
                      
                      return total;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* External Source Columns Selection for external_sum */}
            {columnConfigType === 'external_sum' && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">اختر الأعمدة من المجموعات الأخرى</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {(() => {
                      const currentGroupId = columnConfigGroupId;
                      const otherGroups = structure.groups.filter(g => g.id !== currentGroupId);
                      
                      // Collect all score and total columns from other groups
                      const allColumns: { groupId: string; groupName: string; column: GradingColumn; groupColor: string; groupBorder: string }[] = [];
                      otherGroups.forEach(grp => {
                        grp.columns
                          .filter(c => c.type === 'score' || c.type === 'total' || c.type === 'grand_total' || c.type === 'group_sum')
                          .forEach(col => {
                            allColumns.push({
                              groupId: grp.id,
                              groupName: grp.name_ar,
                              column: col,
                              groupColor: grp.color,
                              groupBorder: grp.border
                            });
                          });
                      });
                      
                      return allColumns.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">اختر الأعمدة للجمع</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedExternalColumns(allColumns.map(sc => `${sc.groupId}:${sc.column.id}`))}
                            >
                              تحديد الكل
                            </Button>
                          </div>
                          {otherGroups.map(grp => {
                            const groupColumns = grp.columns.filter(c => c.type === 'score' || c.type === 'total' || c.type === 'grand_total' || c.type === 'group_sum');
                            if (groupColumns.length === 0) return null;
                            return (
                              <div key={grp.id} className="mb-3">
                                <div 
                                  className="text-sm font-medium mb-1 px-2 py-1 rounded"
                                  style={{ backgroundColor: grp.color }}
                                >
                                  {grp.name_ar}
                                </div>
                                {groupColumns.map(col => {
                                  const key = `${grp.id}:${col.id}`;
                                  const isTotalType = col.type === 'total' || col.type === 'grand_total' || col.type === 'group_sum';
                                  return (
                                    <div key={key} className="flex items-center gap-2 mr-4">
                                      <Checkbox 
                                        checked={selectedExternalColumns.includes(key)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedExternalColumns(prev => [...prev, key]);
                                          } else {
                                            setSelectedExternalColumns(prev => prev.filter(id => id !== key));
                                          }
                                        }}
                                      />
                                      <span className="text-sm">{col.name_ar}</span>
                                      <Badge 
                                        variant={isTotalType ? 'default' : 'outline'} 
                                        className={`text-xs ${col.type === 'grand_total' ? 'bg-primary' : col.type === 'group_sum' ? 'border-amber-500 text-amber-600 bg-amber-50' : ''}`}
                                      >
                                        {isTotalType ? 'مجموع' : ''} {col.max_score}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          لا توجد أعمدة في المجموعات الأخرى. أضف أعمدة في مجموعات أخرى أولاً.
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Total calculation for external_sum */}
                {selectedExternalColumns.length > 0 && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <span className="font-medium text-green-700">المجموع: </span>
                    {(() => {
                      let total = 0;
                      selectedExternalColumns.forEach(key => {
                        const [grpId, colId] = key.split(':');
                        const grp = structure.groups.find(g => g.id === grpId);
                        if (grp) {
                          const col = grp.columns.find(c => c.id === colId);
                          if (col) total += col.max_score;
                        }
                      });
                      return total;
                    })()}
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
                (columnConfigType === 'grand_total' && selectedSourceGroups.length === 0 && selectedSameGroupColumns.length === 0) ||
                (columnConfigType === 'group_sum' && selectedSourceGroups.length === 0) ||
                (columnConfigType === 'external_sum' && selectedExternalColumns.length === 0)
              }
            >
              {editingColumnId ? (
                <>
                  <Save className="h-4 w-4 ml-1" />
                  حفظ
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
