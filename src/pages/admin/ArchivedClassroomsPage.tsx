import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Search, 
  Loader2, 
  GraduationCap,
  User,
  Calendar,
  School,
  AlertTriangle
} from 'lucide-react';
import { 
  useArchivedClassrooms, 
  useRestoreClassroom, 
  useDeleteClassroom 
} from '@/hooks/useClassrooms';
import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ArchivedClassroomsPage() {
  const { data: archivedClassrooms = [], isLoading } = useArchivedClassrooms();
  const restoreClassroom = useRestoreClassroom();
  const deleteClassroom = useDeleteClassroom();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<string | null>(null);

  const filteredClassrooms = archivedClassrooms.filter(c => 
    c.name.includes(searchTerm) || 
    c.subject.includes(searchTerm) ||
    c.teacher_name?.includes(searchTerm) ||
    c.teacher_school?.includes(searchTerm)
  );

  const handleRestore = (id: string) => {
    restoreClassroom.mutate(id);
  };

  const handleDelete = (id: string) => {
    setClassroomToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (classroomToDelete) {
      deleteClassroom.mutate(classroomToDelete);
      setDeleteDialogOpen(false);
      setClassroomToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Archive className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">الصفوف المؤرشفة</h1>
            <p className="text-muted-foreground">إدارة الصفوف المؤرشفة من قبل المعلمين</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن صف أو معلم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">لا توجد صفوف مؤرشفة</p>
              <p className="text-muted-foreground">
                عندما يقوم المعلم بأرشفة صف، سيظهر هنا
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredClassrooms.map((classroom) => (
              <Card key={classroom.id} className="overflow-hidden">
                <div className="flex">
                  {/* Color indicator */}
                  <div className={`w-2 ${classroom.color}`} />
                  
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{classroom.name}</h3>
                          <Badge variant="outline">{classroom.subject}</Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{classroom.teacher_name || 'غير معروف'}</span>
                          </div>
                          {classroom.teacher_school && (
                            <div className="flex items-center gap-1">
                              <School className="h-4 w-4" />
                              <span>{classroom.teacher_school}</span>
                            </div>
                          )}
                          {classroom.archived_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                أُرشف في {format(new Date(classroom.archived_at), 'dd MMMM yyyy', { locale: ar })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRestore(classroom.id)}
                          disabled={restoreClassroom.isPending}
                        >
                          <RotateCcw className="h-4 w-4 ml-1" />
                          استعادة
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(classroom.id)}
                          disabled={deleteClassroom.isPending}
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          حذف نهائي
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredClassrooms.length > 0 && (
          <div className="text-sm text-muted-foreground">
            إجمالي الصفوف المؤرشفة: {filteredClassrooms.length}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد الحذف النهائي
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الصف نهائياً؟ سيتم حذف جميع البيانات المرتبطة به بما في ذلك:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>جميع الطلاب المسجلين</li>
                <li>جميع الدرجات والتقييمات</li>
                <li>جميع سجلات الحضور</li>
                <li>جميع الملاحظات السلوكية</li>
              </ul>
              <p className="mt-3 font-medium text-destructive">
                هذا الإجراء لا يمكن التراجع عنه!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
