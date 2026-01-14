import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { GradingStructureData, GradingColumn, GradingGroup } from '@/hooks/useGradingStructures';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TemplatePreviewProps {
  structure: GradingStructureData;
}

// Sample student data
const SAMPLE_STUDENT = {
  id: 'sample-1',
  name: 'طالب تجريبي',
  initials: 'ط ت'
};

export function TemplatePreview({ structure }: TemplatePreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  };

  // Generate random sample scores for preview
  const sampleGrades = useMemo(() => {
    const grades: Record<string, number> = {};
    structure.groups?.forEach(group => {
      group.columns.forEach(col => {
        if (col.type === 'score') {
          // Generate a random score between 60% and 100% of max
          grades[col.id] = Math.floor((0.6 + Math.random() * 0.4) * col.max_score);
        }
      });
    });
    return grades;
  }, [structure]);

  // Calculate column value (same logic as DHGrades)
  const calculateColumnValue = (column: GradingColumn, group: GradingGroup): number => {
    if (column.type === 'score') {
      return sampleGrades[column.id] || 0;
    }
    if (column.type === 'internal_sum') {
      const sourceIds = column.internalSourceColumns || [];
      return sourceIds.reduce((sum: number, colId: string) => {
        const col = group.columns.find(c => c.id === colId);
        return col ? sum + calculateColumnValue(col, group) : sum;
      }, 0);
    }
    if (column.type === 'external_sum' && column.externalSourceColumns) {
      let total = 0;
      column.externalSourceColumns.forEach(key => {
        const [grpId, colId] = key.split(':');
        const grp = structure.groups?.find(g => g.id === grpId);
        const col = grp?.columns.find(c => c.id === colId);
        if (col && grp) total += calculateColumnValue(col, grp);
      });
      return total;
    }
    if ((column.type === 'group_sum' || column.type === 'grand_total') && column.sourceGroupIds) {
      let total = 0;
      column.sourceGroupIds.forEach(key => {
        if (key.includes(':')) {
          const [grpId, colId] = key.split(':');
          const grp = structure.groups?.find(g => g.id === grpId);
          const col = grp?.columns.find(c => c.id === colId);
          if (col && grp) total += calculateColumnValue(col, grp);
        }
      });
      return total;
    }
    return 0;
  };

  const calculateGroupTotal = (group: GradingGroup): number => {
    return group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, col) => sum + (sampleGrades[col.id] || 0), 0);
  };

  const calculateGroupMaxScore = (group: GradingGroup): number => {
    return group.columns
      .filter(c => c.type === 'score')
      .reduce((sum, c) => sum + c.max_score, 0);
  };

  const calculateStudentTotal = (): number => {
    if (!structure.groups) return 0;
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, col) => s + (sampleGrades[col.id] || 0), 0);
    }, 0);
  };

  const calculateTotalMaxScore = (): number => {
    if (!structure.groups) return 100;
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, c) => s + c.max_score, 0);
    }, 0);
  };

  if (!structure.groups || structure.groups.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                معاينة الجدول
              </div>
              <Badge variant="secondary" className="text-xs">
                طالب تجريبي
              </Badge>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted text-right min-w-[140px] text-xs" rowSpan={2}>
                      اسم الطالب
                    </th>
                    {structure.groups.map((group) => {
                      const isCollapsed = collapsedGroups.has(group.id);
                      return (
                        <th 
                          key={group.id} 
                          colSpan={isCollapsed ? 1 : group.columns.length}
                          className="border p-2 text-center font-bold cursor-pointer hover:opacity-80 text-xs"
                          style={{ backgroundColor: group.color }}
                          onClick={() => toggleGroupCollapse(group.id)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {isCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {group.name_ar}
                            {isCollapsed && (
                              <Badge variant="secondary" className="text-[10px] px-1">
                                {group.columns.length}
                              </Badge>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="border p-2 bg-muted text-center min-w-[60px] text-xs" rowSpan={2}>
                      المجموع<br/>
                      <span className="text-[10px] text-muted-foreground">({calculateTotalMaxScore()})</span>
                    </th>
                  </tr>
                  <tr>
                    {structure.groups.map((group) => {
                      const isCollapsed = collapsedGroups.has(group.id);
                      if (isCollapsed) {
                        return (
                          <th 
                            key={`${group.id}-collapsed`} 
                            className="border p-1 text-center text-[10px]" 
                            style={{ backgroundColor: `${group.color}80` }}
                          >
                            المجموع<br/>({calculateGroupMaxScore(group)})
                          </th>
                        );
                      }
                      return group.columns.map((col) => (
                        <th 
                          key={col.id} 
                          className="border p-1 text-center text-[10px] min-w-[50px]" 
                          style={{ backgroundColor: `${group.color}80` }}
                        >
                          {col.name_ar}<br/>({col.max_score})
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/20">
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-4">1</span>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {SAMPLE_STUDENT.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs">{SAMPLE_STUDENT.name}</span>
                      </div>
                    </td>
                    {structure.groups.map((group) => {
                      const isCollapsed = collapsedGroups.has(group.id);
                      if (isCollapsed) {
                        const groupTotal = calculateGroupTotal(group);
                        const maxScore = calculateGroupMaxScore(group);
                        const pct = maxScore > 0 ? (groupTotal / maxScore) * 100 : 0;
                        return (
                          <td key={`${group.id}-sum`} className="border p-1 text-center">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                              pct >= 80 ? 'bg-green-100 text-green-700' : 
                              pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {groupTotal}
                            </div>
                          </td>
                        );
                      }
                      return group.columns.map((col) => {
                        const value = calculateColumnValue(col, group);
                        const pct = col.max_score > 0 ? (value / col.max_score) * 100 : 0;
                        const isCalculated = col.type !== 'score';
                        return (
                          <td key={col.id} className="border p-1 text-center">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                              isCalculated ? 'bg-muted' : 
                              pct >= 80 ? 'bg-green-100 text-green-700' : 
                              pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                              pct > 0 ? 'bg-red-100 text-red-700' : 
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {value || '-'}
                            </div>
                          </td>
                        );
                      });
                    })}
                    <td className="border p-2 text-center bg-primary/5">
                      <span className="font-bold text-sm text-primary">{calculateStudentTotal()}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-2 bg-muted/30 text-[10px] text-muted-foreground text-center">
              * الدرجات المعروضة تجريبية لأغراض المعاينة فقط
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
