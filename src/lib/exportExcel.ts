import { GradingStructureData, GradingColumn, GradingGroup } from '@/hooks/useGradingStructures';

interface ExportExcelOptions {
  structure: GradingStructureData;
  students: any[];
  grades: any[];
  teacherName: string;
  classroomName: string;
  templateName: string;
  schoolName?: string | null;
  principalName?: string | null;
  departmentHeadName?: string | null;
  showSchoolName?: boolean;
  showPrincipalName?: boolean;
  showDepartmentHeadName?: boolean;
}

// Helper to calculate column value
function calculateColumnValue(
  studentId: string, 
  column: GradingColumn, 
  group: GradingGroup,
  structure: GradingStructureData,
  grades: any[]
): number {
  if (column.type === 'score') {
    const grade = grades.find(g => 
      g.student_id === studentId && 
      g.title === column.id
    );
    return grade?.score || 0;
  }
  
  if (column.type === 'internal_sum') {
    let total = 0;
    const sourceIds = column.internalSourceColumns || column.sourceColumnIds || [];
    
    sourceIds.forEach(colId => {
      const col = group.columns.find(c => c.id === colId);
      if (col) {
        total += calculateColumnValue(studentId, col, group, structure, grades);
      }
    });
    
    return total;
  }
  
  if (column.type === 'total') {
    const sourceIds = column.sourceColumnIds || group.columns.filter(c => c.type === 'score').map(c => c.id);
    return sourceIds.reduce((sum, colId) => {
      const col = group.columns.find(c => c.id === colId);
      if (col) {
        return sum + calculateColumnValue(studentId, col, group, structure, grades);
      }
      return sum;
    }, 0);
  }
  
  if (column.type === 'grand_total' || column.type === 'group_sum') {
    let total = 0;
    
    if (column.sourceGroupIds) {
      column.sourceGroupIds.forEach(key => {
        if (key.includes(':')) {
          const [grpId, colId] = key.split(':');
          const grp = structure.groups.find(g => g.id === grpId);
          if (grp) {
            const col = grp.columns.find(c => c.id === colId);
            if (col) {
              total += calculateColumnValue(studentId, col, grp, structure, grades);
            }
          }
        } else {
          const grp = structure.groups.find(g => g.id === key);
          if (grp) {
            const totalCol = grp.columns.find(c => c.type === 'total');
            if (totalCol) {
              total += calculateColumnValue(studentId, totalCol, grp, structure, grades);
            }
          }
        }
      });
    }
    
    if (column.sourceColumnIds) {
      column.sourceColumnIds.forEach(colId => {
        const col = group.columns.find(c => c.id === colId);
        if (col) {
          total += calculateColumnValue(studentId, col, group, structure, grades);
        }
      });
    }
    
    return total;
  }
  
  if (column.type === 'external_sum') {
    let total = 0;
    
    if (column.externalSourceColumns) {
      column.externalSourceColumns.forEach(key => {
        const [grpId, colId] = key.split(':');
        const grp = structure.groups.find(g => g.id === grpId);
        if (grp) {
          const col = grp.columns.find(c => c.id === colId);
          if (col) {
            total += calculateColumnValue(studentId, col, grp, structure, grades);
          }
        }
      });
    }
    
    return total;
  }
  
  return 0;
}

function calculateStudentTotal(studentId: string, structure: GradingStructureData, grades: any[]): number {
  return structure.groups.reduce((sum, group) => {
    return sum + group.columns
      .filter(c => c.type === 'score')
      .reduce((s, col) => {
        const grade = grades.find(g => g.student_id === studentId && g.title === col.id);
        return s + (grade?.score || 0);
      }, 0);
  }, 0);
}

function calculateTotalMaxScore(structure: GradingStructureData): number {
  return structure.groups.reduce((sum, group) => {
    return sum + group.columns
      .filter(c => c.type === 'score')
      .reduce((s, c) => s + c.max_score, 0);
  }, 0);
}

export function exportGradesToExcel(options: ExportExcelOptions) {
  const {
    structure,
    students,
    grades,
    teacherName,
    classroomName,
    templateName,
    schoolName,
    principalName,
    departmentHeadName,
    showSchoolName = true,
    showPrincipalName = true,
    showDepartmentHeadName = true,
  } = options;

  // Build CSV content (Excel-compatible)
  const rows: string[][] = [];
  
  // Header info
  rows.push([templateName]);
  rows.push([`المعلم: ${teacherName}`]);
  rows.push([`الصف: ${classroomName}`]);
  rows.push([]); // Empty row
  
  // Build column headers
  const headerRow1: string[] = ['اسم الطالب'];
  const headerRow2: string[] = [''];
  
  structure.groups.forEach(group => {
    // First header row - group names with colspan simulation
    headerRow1.push(group.name_ar);
    for (let i = 1; i < group.columns.length; i++) {
      headerRow1.push('');
    }
    
    // Second header row - column names
    group.columns.forEach(column => {
      headerRow2.push(`${column.name_ar} (${column.max_score})`);
    });
  });
  
  if (structure.settings?.showGrandTotal !== false) {
    headerRow1.push('المجموع الكلي');
    headerRow2.push(`(${calculateTotalMaxScore(structure)})`);
  }
  
  rows.push(headerRow1);
  rows.push(headerRow2);
  
  // Student data rows
  students.forEach((student, index) => {
    const row: string[] = [`${index + 1}. ${student.name}`];
    
    structure.groups.forEach(group => {
      group.columns.forEach(column => {
        const value = calculateColumnValue(student.id, column, group, structure, grades);
        row.push(value.toString());
      });
    });
    
    if (structure.settings?.showGrandTotal !== false) {
      const total = calculateStudentTotal(student.id, structure, grades);
      row.push(total.toString());
    }
    
    rows.push(row);
  });
  
  // Footer info
  rows.push([]); // Empty row
  rows.push([]); // Empty row
  
  const footerItems: string[] = [];
  if (showSchoolName && schoolName) {
    footerItems.push(`المدرسة: ${schoolName}`);
  }
  if (showPrincipalName && principalName) {
    footerItems.push(`مدير/ة المدرسة: ${principalName}`);
  }
  if (showDepartmentHeadName && departmentHeadName) {
    footerItems.push(`رئيس/ة القسم: ${departmentHeadName}`);
  }
  
  if (footerItems.length > 0) {
    rows.push(footerItems);
  }
  
  // Convert to CSV with BOM for Excel Arabic support
  const BOM = '\uFEFF';
  const csvContent = BOM + rows.map(row => 
    row.map(cell => {
      // Escape cells containing commas or quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `درجات_${classroomName}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
