import { GradingStructureData, GradingColumn, GradingGroup } from '@/hooks/useGradingStructures';

interface PrintableGradesTableProps {
  structure: GradingStructureData;
  students: any[];
  grades: any[];
  teacherName: string;
  classroomName: string;
  departmentHeadName?: string | null;
  templateName: string;
  useNormalFont?: boolean;
}

export function PrintableGradesTable({
  structure,
  students,
  grades,
  teacherName,
  classroomName,
  departmentHeadName,
  templateName,
  useNormalFont = false
}: PrintableGradesTableProps) {
  
  const calculateColumnValue = (studentId: string, column: GradingColumn, group: GradingGroup): number => {
    if (column.type === 'score') {
      const grade = grades.find(g => 
        g.student_id === studentId && 
        g.title === column.id
      );
      return grade?.score || 0;
    }
    
    // Handle internal_sum - sum selected columns from same group
    if (column.type === 'internal_sum') {
      let total = 0;
      
      // Use internalSourceColumns if available, otherwise sourceColumnIds
      const sourceIds = column.internalSourceColumns || column.sourceColumnIds || [];
      
      sourceIds.forEach(colId => {
        const col = group.columns.find(c => c.id === colId);
        if (col) {
          total += calculateColumnValue(studentId, col, group);
        }
      });
      
      return total;
    }
    
    if (column.type === 'total') {
      const sourceIds = column.sourceColumnIds || group.columns.filter(c => c.type === 'score').map(c => c.id);
      return sourceIds.reduce((sum, colId) => {
        const col = group.columns.find(c => c.id === colId);
        if (col) {
          // Allow summing any column type (score, internal_sum, etc.)
          return sum + calculateColumnValue(studentId, col, group);
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
                total += calculateColumnValue(studentId, col, grp);
              }
            }
          } else {
            const grp = structure.groups.find(g => g.id === key);
            if (grp) {
              const totalCol = grp.columns.find(c => c.type === 'total');
              if (totalCol) {
                total += calculateColumnValue(studentId, totalCol, grp);
              }
            }
          }
        });
      }
      
      if (column.sourceColumnIds) {
        column.sourceColumnIds.forEach(colId => {
          const col = group.columns.find(c => c.id === colId);
          if (col) {
            total += calculateColumnValue(studentId, col, group);
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
              total += calculateColumnValue(studentId, col, grp);
            }
          }
        });
      }
      
      return total;
    }
    
    return 0;
  };

  const calculateTotalMaxScore = () => {
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, c) => s + c.max_score, 0);
    }, 0);
  };

  const calculateStudentTotal = (studentId: string) => {
    return structure.groups.reduce((sum, group) => {
      return sum + group.columns
        .filter(c => c.type === 'score')
        .reduce((s, col) => {
          const grade = grades.find(g => g.student_id === studentId && g.title === col.id);
          return s + (grade?.score || 0);
        }, 0);
    }, 0);
  };

  return (
    <div className={`print-container ${useNormalFont ? 'print-normal-font' : 'print-arabic-font'}`} style={{ display: 'none' }} dir="rtl">
      {/* Print Header - Only Teacher, Classroom, and Department Head */}
      <div className="print-header">
        <h1>{templateName}</h1>
        <p><strong>المعلم:</strong> {teacherName}</p>
        <p><strong>الصف:</strong> {classroomName}</p>
        {departmentHeadName && (
          <p><strong>رئيس القسم:</strong> {departmentHeadName}</p>
        )}
      </div>
      
      {/* Print Table */}
      <table className="print-table">
        <thead>
          {/* Group headers row */}
          <tr>
            <th rowSpan={2} style={{ width: '100px' }}>
              اسم الطالب
            </th>
            {structure.groups.map(group => (
              <th 
                key={group.id}
                colSpan={group.columns.length}
                style={{ backgroundColor: group.color }}
              >
                {group.name_ar}
              </th>
            ))}
            {(structure.settings?.showGrandTotal !== false) && (
              <th rowSpan={2} style={{ width: '50px' }}>
                المجموع ({calculateTotalMaxScore()})
              </th>
            )}
          </tr>
          {/* Column headers row */}
          <tr>
            {structure.groups.map(group => (
              group.columns.map(column => (
                <th 
                  key={column.id}
                  style={{ 
                    backgroundColor: column.useGroupColor !== false ? group.color : '#f5f5f5',
                    fontSize: '7px'
                  }}
                >
                  {column.name_ar}
                  <br />
                  ({column.max_score})
                </th>
              ))
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const studentTotal = calculateStudentTotal(student.id);
            
            return (
              <tr key={student.id}>
                <td style={{ textAlign: 'right', paddingRight: '5px' }}>
                  {index + 1}. {student.name}
                </td>
                {structure.groups.map(group => (
                  group.columns.map(column => {
                    const value = calculateColumnValue(student.id, column, group);
                    return (
                      <td 
                        key={column.id}
                        style={{ 
                          backgroundColor: column.type === 'score' 
                            ? `${group.color}` 
                            : column.type === 'total' 
                              ? '#e8e8e8' 
                              : (column.type === 'grand_total' || column.type === 'group_sum' || column.type === 'external_sum')
                                ? '#d4edda'
                                : undefined,
                          fontWeight: column.type !== 'score' ? 'bold' : 'normal'
                        }}
                      >
                        {value}
                      </td>
                    );
                  })
                ))}
                {(structure.settings?.showGrandTotal !== false) && (
                  <td style={{ fontWeight: 'bold', backgroundColor: '#d4edda' }}>
                    {studentTotal}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
