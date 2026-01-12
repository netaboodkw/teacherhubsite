import { useState } from 'react';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, Copy, Edit, Calculator, ExternalLink, Sigma, GripVertical } from 'lucide-react';
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

// Sortable Column Component
function SortableColumn({ 
  column, 
  groupId,
  groupColor,
  onUpdate,
  onDelete,
  onEditSum,
  calculateTotal,
  getTypeLabel,
  getTypeBadgeVariant
}: { 
  column: GradingColumn;
  groupId: string;
  groupColor: string;
  onUpdate: (updates: Partial<GradingColumn>) => void;
  onDelete: () => void;
  onEditSum: () => void;
  calculateTotal: () => number;
  getTypeLabel: (type: string) => string;
  getTypeBadgeVariant: (type: string) => string;
}) {
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
      style={style}
      className="flex items-center gap-2 bg-muted/50 rounded p-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        value={column.name_ar}
        onChange={(e) => onUpdate({ name_ar: e.target.value })}
        className="h-7 flex-1 text-sm"
        placeholder="اسم العمود"
      />
      <Badge 
        variant={getTypeBadgeVariant(column.type) as any} 
        className={`text-xs cursor-pointer ${
          column.type === 'external_sum' ? 'border-green-500 text-green-600' : 
          column.type === 'internal_sum' ? 'border-blue-500 text-blue-600' :
          column.type === 'group_sum' ? 'border-amber-500 text-amber-600' : ''
        }`}
        onClick={() => {
          if (column.type === 'internal_sum' || column.type === 'external_sum') {
            onEditSum();
          }
        }}
      >
        {getTypeLabel(column.type)}
        {(column.type === 'internal_sum' || column.type === 'external_sum') && (
          <Edit className="h-3 w-3 mr-1 inline" />
        )}
      </Badge>
      {column.type === 'score' ? (
        <Input
          type="number"
          value={column.max_score}
          onChange={(e) => onUpdate({ max_score: parseInt(e.target.value) || 0 })}
          className="h-7 w-16 text-sm"
          min={0}
        />
      ) : (
        <span className="text-sm text-muted-foreground w-16 text-center">
          {calculateTotal()}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Sortable Group Component
function SortableGroup({
  group,
  structure,
  onUpdateGroup,
  onDeleteGroup,
  onDuplicateGroup,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
  openInternalSumDialog,
  openExternalSumDialog,
  openGroupSumDialog,
  openGrandTotalDialog,
  calculateColumnTotal,
  getColumnTypeLabel,
  getColumnTypeBadgeVariant,
}: {
  group: GradingGroup;
  structure: GradingStructureData;
  onUpdateGroup: (updates: Partial<GradingGroup>) => void;
  onDeleteGroup: () => void;
  onDuplicateGroup: () => void;
  onAddColumn: (type: 'score') => void;
  onUpdateColumn: (columnId: string, updates: Partial<GradingColumn>) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumns: (activeId: string, overId: string) => void;
  openInternalSumDialog: (editColumn?: { columnId: string; name: string; sources: string[] }) => void;
  openExternalSumDialog: (editColumn?: { columnId: string; name: string; sources: string[] }) => void;
  openGroupSumDialog: () => void;
  openGrandTotalDialog: () => void;
  calculateColumnTotal: (column: GradingColumn) => number;
  getColumnTypeLabel: (type: string) => string;
  getColumnTypeBadgeVariant: (type: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderColumns(active.id as string, over.id as string);
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={{ ...style, borderRightColor: group.color }}
      className="border-r-4"
    >
      <CardHeader className="py-3 px-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
              type="button"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <Input
              value={group.name_ar}
              onChange={(e) => onUpdateGroup({ name_ar: e.target.value })}
              className="h-8 flex-1"
              placeholder="اسم المجموعة"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={onDuplicateGroup}
              title="نسخ المجموعة"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDeleteGroup}
              title="حذف المجموعة"
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
                onClick={() => onUpdateGroup({ color: colorOption.color })}
                title={colorOption.name}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={GROUP_COLORS.some(c => c.color === group.color) ? '#888888' : group.color}
                onChange={(e) => onUpdateGroup({ color: e.target.value })}
                className="w-6 h-6 rounded-full cursor-pointer border-2 border-dashed border-muted-foreground/50"
                title="لون مخصص"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
        >
          <SortableContext items={group.columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {group.columns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  groupId={group.id}
                  groupColor={group.color}
                  onUpdate={(updates) => onUpdateColumn(column.id, updates)}
                  onDelete={() => onDeleteColumn(column.id)}
                  onEditSum={() => {
                    if (column.type === 'internal_sum') {
                      openInternalSumDialog({
                        columnId: column.id,
                        name: column.name_ar,
                        sources: column.internalSourceColumns || []
                      });
                    } else if (column.type === 'external_sum') {
                      openExternalSumDialog({
                        columnId: column.id,
                        name: column.name_ar,
                        sources: column.externalSourceColumns || []
                      });
                    }
                  }}
                  calculateTotal={() => calculateColumnTotal(column)}
                  getTypeLabel={getColumnTypeLabel}
                  getTypeBadgeVariant={getColumnTypeBadgeVariant}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="flex gap-2 pt-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onAddColumn('score')}
          >
            <Plus className="h-3 w-3 ml-1" />
            درجة
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
            onClick={() => openInternalSumDialog()}
          >
            <Calculator className="h-3 w-3 ml-1" />
            مجموع داخلي
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs border-green-500 text-green-600 hover:bg-green-50"
            onClick={() => openExternalSumDialog()}
          >
            <ExternalLink className="h-3 w-3 ml-1" />
            مجموع خارجي
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs border-amber-500 text-amber-600 hover:bg-amber-50"
            onClick={openGroupSumDialog}
          >
            <Sigma className="h-3 w-3 ml-1" />
            مجموع مجموعات
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs border-primary text-primary hover:bg-primary/10"
            onClick={openGrandTotalDialog}
          >
            <Sigma className="h-3 w-3 ml-1" />
            مجموع كلي
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DraggableStructureEditorProps {
  structure: GradingStructureData;
  onChange: (structure: GradingStructureData) => void;
}

export function DraggableStructureEditor({ structure, onChange }: DraggableStructureEditorProps) {
  const [internalSumDialogOpen, setInternalSumDialogOpen] = useState(false);
  const [externalSumDialogOpen, setExternalSumDialogOpen] = useState(false);
  const [groupSumDialogOpen, setGroupSumDialogOpen] = useState(false);
  const [grandTotalDialogOpen, setGrandTotalDialogOpen] = useState(false);
  const [editingSumColumn, setEditingSumColumn] = useState<{ groupId: string; columnId: string; type: string } | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [columnName, setColumnName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = structure.groups.findIndex(g => g.id === active.id);
      const newIndex = structure.groups.findIndex(g => g.id === over.id);
      onChange({
        ...structure,
        groups: arrayMove(structure.groups, oldIndex, newIndex)
      });
    }
  };

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

  const addColumn = (groupId: string, type: 'score') => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    const newColumn: GradingColumn = {
      id: `col_${Date.now()}`,
      name_ar: `درجة ${group.columns.length + 1}`,
      type,
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

  const reorderColumns = (groupId: string, activeId: string, overId: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return;

    const oldIndex = group.columns.findIndex(c => c.id === activeId);
    const newIndex = group.columns.findIndex(c => c.id === overId);
    
    updateGroup(groupId, {
      columns: arrayMove(group.columns, oldIndex, newIndex)
    });
  };

  // Dialog openers
  const openInternalSumDialog = (groupId: string, editColumn?: { columnId: string; name: string; sources: string[] }) => {
    setCurrentGroupId(groupId);
    if (editColumn) {
      setEditingSumColumn({ groupId, columnId: editColumn.columnId, type: 'internal_sum' });
      setColumnName(editColumn.name);
      setSelectedSources(editColumn.sources);
    } else {
      setEditingSumColumn(null);
      setColumnName('مجموع داخلي');
      setSelectedSources([]);
    }
    setInternalSumDialogOpen(true);
  };

  const openExternalSumDialog = (groupId: string, editColumn?: { columnId: string; name: string; sources: string[] }) => {
    setCurrentGroupId(groupId);
    if (editColumn) {
      setEditingSumColumn({ groupId, columnId: editColumn.columnId, type: 'external_sum' });
      setColumnName(editColumn.name);
      setSelectedSources(editColumn.sources);
    } else {
      setEditingSumColumn(null);
      setColumnName('مجموع خارجي');
      setSelectedSources([]);
    }
    setExternalSumDialogOpen(true);
  };

  const openGroupSumDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setSelectedSources([]);
    setColumnName('مجموع المجموعات');
    setEditingSumColumn(null);
    setGroupSumDialogOpen(true);
  };

  const openGrandTotalDialog = (groupId: string) => {
    setCurrentGroupId(groupId);
    setSelectedSources([]);
    setColumnName('المجموع الكلي');
    setEditingSumColumn(null);
    setGrandTotalDialogOpen(true);
  };

  // Save functions
  const saveInternalSumColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (!group) return;

    if (editingSumColumn) {
      updateColumn(currentGroupId, editingSumColumn.columnId, {
        name_ar: columnName || 'مجموع داخلي',
        internalSourceColumns: selectedSources
      });
    } else {
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
    }
    setInternalSumDialogOpen(false);
    setEditingSumColumn(null);
  };

  const saveExternalSumColumn = () => {
    if (!currentGroupId || selectedSources.length === 0) return;

    const group = structure.groups.find(g => g.id === currentGroupId);
    if (!group) return;

    if (editingSumColumn) {
      updateColumn(currentGroupId, editingSumColumn.columnId, {
        name_ar: columnName || 'مجموع خارجي',
        externalSourceColumns: selectedSources
      });
    } else {
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
    }
    setExternalSumDialogOpen(false);
    setEditingSumColumn(null);
  };

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

  // Helper functions
  const getInternalColumns = (groupId: string, excludeColumnId?: string) => {
    const group = structure.groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return group.columns
      .filter(c => c.id !== excludeColumnId && (c.type === 'score' || c.type === 'internal_sum'))
      .map(c => ({
        key: c.id,
        columnName: c.name_ar,
        type: c.type
      }));
  };

  const getAllColumnsForExternalSum = (currentGroupId: string, excludeColumnId?: string) => {
    return structure.groups.flatMap(g => 
      g.columns
        .filter(c => c.id !== excludeColumnId && (c.type === 'score' || c.type === 'internal_sum' || c.type === 'external_sum'))
        .map(c => ({
          key: `${g.id}:${c.id}`,
          groupName: g.name_ar,
          columnName: c.name_ar,
          groupColor: g.color,
          type: c.type
        }))
    );
  };

  const getTotalColumns = () => {
    return structure.groups.flatMap(g => 
      g.columns
        .filter(c => c.type === 'internal_sum' || c.type === 'group_sum' || c.type === 'external_sum')
        .map(c => ({
          key: `${g.id}:${c.id}`,
          groupName: g.name_ar,
          columnName: c.name_ar,
          groupColor: g.color
        }))
    );
  };

  const calculateColumnTotal = (column: GradingColumn, groupId: string): number => {
    if (column.type === 'internal_sum' && column.internalSourceColumns) {
      let total = 0;
      const group = structure.groups.find(g => g.id === groupId);
      if (group) {
        column.internalSourceColumns.forEach(colId => {
          const col = group.columns.find(c => c.id === colId);
          if (col) {
            if (col.type === 'score') {
              total += col.max_score;
            } else if (col.type === 'internal_sum') {
              total += calculateColumnTotal(col, groupId);
            }
          }
        });
      }
      return total;
    }
    if (column.type === 'external_sum' && column.externalSourceColumns) {
      let total = 0;
      column.externalSourceColumns.forEach(key => {
        const [grpId, colId] = key.split(':');
        const group = structure.groups.find(g => g.id === grpId);
        const col = group?.columns.find(c => c.id === colId);
        if (col) {
          if (col.type === 'score') {
            total += col.max_score;
          } else {
            total += calculateColumnTotal(col, grpId);
          }
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
            total += calculateColumnTotal(col, grpId);
          }
        }
      });
      return total;
    }
    return column.max_score;
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

  const getColumnTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'score': return 'secondary';
      case 'internal_sum': return 'default';
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext items={structure.groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {structure.groups.map((group) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    structure={structure}
                    onUpdateGroup={(updates) => updateGroup(group.id, updates)}
                    onDeleteGroup={() => deleteGroup(group.id)}
                    onDuplicateGroup={() => duplicateGroup(group.id)}
                    onAddColumn={(type) => addColumn(group.id, type)}
                    onUpdateColumn={(columnId, updates) => updateColumn(group.id, columnId, updates)}
                    onDeleteColumn={(columnId) => deleteColumn(group.id, columnId)}
                    onReorderColumns={(activeId, overId) => reorderColumns(group.id, activeId, overId)}
                    openInternalSumDialog={(editCol) => openInternalSumDialog(group.id, editCol)}
                    openExternalSumDialog={(editCol) => openExternalSumDialog(group.id, editCol)}
                    openGroupSumDialog={() => openGroupSumDialog(group.id)}
                    openGrandTotalDialog={() => openGrandTotalDialog(group.id)}
                    calculateColumnTotal={(col) => calculateColumnTotal(col, group.id)}
                    getColumnTypeLabel={getColumnTypeLabel}
                    getColumnTypeBadgeVariant={getColumnTypeBadgeVariant}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </ScrollArea>

      {/* Internal Sum Dialog */}
      <Dialog open={internalSumDialogOpen} onOpenChange={setInternalSumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSumColumn ? 'تعديل المجموع الداخلي' : 'إضافة مجموع داخلي'}</DialogTitle>
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
              <Label>اختر الأعمدة للجمع</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {currentGroupId && getInternalColumns(currentGroupId, editingSumColumn?.columnId).map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedSources.includes(col.key)}
                      onCheckedChange={(checked) => {
                        setSelectedSources(prev => 
                          checked ? [...prev, col.key] : prev.filter(k => k !== col.key)
                        );
                      }}
                    />
                    <Badge variant="outline" className={col.type === 'internal_sum' ? 'border-blue-500' : ''}>
                      {col.type === 'internal_sum' ? 'مجموع' : 'درجة'}
                    </Badge>
                    <span className="text-sm">{col.columnName}</span>
                  </div>
                ))}
                {currentGroupId && getInternalColumns(currentGroupId, editingSumColumn?.columnId).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">لا توجد أعمدة في هذه المجموعة</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInternalSumDialogOpen(false); setEditingSumColumn(null); }}>إلغاء</Button>
            <Button onClick={saveInternalSumColumn} disabled={selectedSources.length === 0}>
              {editingSumColumn ? 'حفظ' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* External Sum Dialog */}
      <Dialog open={externalSumDialogOpen} onOpenChange={setExternalSumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSumColumn ? 'تعديل المجموع الخارجي' : 'إضافة مجموع خارجي'}</DialogTitle>
            <DialogDescription>اختر أعمدة الدرجات أو المجاميع من أي مجموعة</DialogDescription>
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
              <Label>اختر الأعمدة للجمع</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                {currentGroupId && getAllColumnsForExternalSum(currentGroupId, editingSumColumn?.columnId).map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedSources.includes(col.key)}
                      onCheckedChange={(checked) => {
                        setSelectedSources(prev => 
                          checked ? [...prev, col.key] : prev.filter(k => k !== col.key)
                        );
                      }}
                    />
                    <Badge variant="outline" style={{ borderColor: col.groupColor }}>{col.groupName}</Badge>
                    <span className="text-sm">{col.columnName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {col.type === 'score' ? 'درجة' : 'مجموع'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExternalSumDialogOpen(false); setEditingSumColumn(null); }}>إلغاء</Button>
            <Button onClick={saveExternalSumColumn} disabled={selectedSources.length === 0}>
              {editingSumColumn ? 'حفظ' : 'إضافة'}
            </Button>
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
                          checked ? [...prev, col.key] : prev.filter(k => k !== col.key)
                        );
                      }}
                    />
                    <Badge variant="outline" style={{ borderColor: col.groupColor }}>{col.groupName}</Badge>
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
                          checked ? [...prev, col.key] : prev.filter(k => k !== col.key)
                        );
                      }}
                    />
                    <Badge variant="outline" style={{ borderColor: col.groupColor }}>{col.groupName}</Badge>
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
