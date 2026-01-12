import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartmentHeadProfile, useDepartmentHeadInvitations, useSupervisedTeachers, useRespondToInvitation } from '@/hooks/useDepartmentHeads';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Users, User, LogOut, Check, X, Loader2, 
  School, BookOpen, Clock, CheckCircle, XCircle, Mail
} from 'lucide-react';

export default function DepartmentHeadDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useDepartmentHeadProfile();
  const { data: invitations = [], isLoading: loadingInvitations } = useDepartmentHeadInvitations();
  const { data: teachers = [], isLoading: loadingTeachers } = useSupervisedTeachers();
  const respondToInvitation = useRespondToInvitation();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/department-head');
  };

  const handleAcceptInvitation = (invitationId: string) => {
    respondToInvitation.mutate({ invitationId, status: 'accepted' });
  };

  const handleRejectInvitation = (invitationId: string) => {
    respondToInvitation.mutate({ invitationId, status: 'rejected' });
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    navigate('/auth/department-head');
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">لوحة تحكم رئيس القسم</h1>
              <p className="text-sm text-muted-foreground">{profile.full_name}</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                  <p className="text-sm text-muted-foreground">المعلمون المشرف عليهم</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingInvitations.length}</p>
                  <p className="text-sm text-muted-foreground">دعوات معلقة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedInvitations.length}</p>
                  <p className="text-sm text-muted-foreground">دعوات مقبولة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="teachers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teachers">المعلمون</TabsTrigger>
            <TabsTrigger value="invitations" className="relative">
              الدعوات
              {pendingInvitations.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            {loadingTeachers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : teachers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">لا يوجد معلمون</h3>
                  <p className="text-muted-foreground">
                    عندما يرسل لك المعلمون دعوات وتقبلها، ستظهر بياناتهم هنا
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((teacher: any) => (
                  <Card 
                    key={teacher.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/department-head/teacher/${teacher.user_id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{teacher.full_name}</h3>
                          {teacher.subject && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{teacher.subject}</span>
                            </div>
                          )}
                          {teacher.school_name && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <School className="h-3 w-3" />
                              <span className="truncate">{teacher.school_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            {loadingInvitations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">لا توجد دعوات</h3>
                  <p className="text-muted-foreground">
                    عندما يدعوك المعلمون للإشراف على فصولهم، ستظهر الدعوات هنا
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      دعوات معلقة
                    </h3>
                    <div className="grid gap-3">
                      {pendingInvitations.map((invitation) => (
                        <Card key={invitation.id}>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  دعوة من معلم بتاريخ {new Date(invitation.created_at).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectInvitation(invitation.id)}
                                  disabled={respondToInvitation.isPending}
                                >
                                  <X className="h-4 w-4 ml-1" />
                                  رفض
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptInvitation(invitation.id)}
                                  disabled={respondToInvitation.isPending}
                                >
                                  <Check className="h-4 w-4 ml-1" />
                                  قبول
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accepted/Rejected Invitations */}
                {invitations.filter(inv => inv.status !== 'pending').length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">سجل الدعوات</h3>
                    <div className="grid gap-3">
                      {invitations.filter(inv => inv.status !== 'pending').map((invitation) => (
                        <Card key={invitation.id} className="opacity-70">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(invitation.created_at).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                              <Badge variant={invitation.status === 'accepted' ? 'default' : 'destructive'}>
                                {invitation.status === 'accepted' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    مقبولة
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 ml-1" />
                                    مرفوضة
                                  </>
                                )}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
