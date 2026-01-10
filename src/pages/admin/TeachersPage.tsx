import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeachers } from '@/hooks/useTeachers';

export default function TeachersPage() {
  const { data: teachers, isLoading } = useTeachers();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">المعلمون</h1>
            <p className="text-muted-foreground">عرض المعلمين المسجلين في النظام</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              المعلمون المسجلون
              <Badge variant="secondary">{teachers?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teachers?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا يوجد معلمون مسجلون بعد
              </p>
            ) : (
              <div className="space-y-3">
                {teachers?.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={teacher.avatar_url || ''} />
                        <AvatarFallback>
                          {teacher.full_name?.charAt(0) || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{teacher.full_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {teacher.school_name && (
                            <Badge variant="outline" className="text-xs">
                              {teacher.school_name}
                            </Badge>
                          )}
                          {teacher.education_level_name && (
                            <Badge variant="secondary" className="text-xs">
                              {teacher.education_level_name}
                            </Badge>
                          )}
                          {teacher.subject_name && (
                            <Badge className="text-xs">
                              {teacher.subject_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          تاريخ التسجيل: {new Date(teacher.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!teacher.is_profile_complete && (
                        <Badge variant="destructive" className="text-xs">
                          غير مكتمل
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" title="عرض التفاصيل">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
