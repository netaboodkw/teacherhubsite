import { DepartmentHeadViewLayout } from '@/components/layout/DepartmentHeadViewLayout';
import { useDepartmentHeadInvitations, useRespondToInvitation } from '@/hooks/useDepartmentHeads';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';

function InvitationsContent() {
  const { data: invitations = [], isLoading } = useDepartmentHeadInvitations();
  const respondToInvitation = useRespondToInvitation();

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const processedInvitations = invitations.filter(inv => inv.status !== 'pending');

  const handleAcceptInvitation = (invitationId: string) => {
    respondToInvitation.mutate({ invitationId, status: 'accepted' });
  };

  const handleRejectInvitation = (invitationId: string) => {
    respondToInvitation.mutate({ invitationId, status: 'rejected' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">الدعوات</h1>
        <p className="text-muted-foreground mt-1">إدارة دعوات المعلمين للإشراف</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'accepted').length}</p>
                <p className="text-sm text-muted-foreground">مقبولة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'rejected').length}</p>
                <p className="text-sm text-muted-foreground">مرفوضة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {invitations.length === 0 ? (
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
        <div className="space-y-6">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                دعوات معلقة ({pendingInvitations.length})
              </h3>
              <div className="grid gap-3">
                {pendingInvitations.map((invitation) => (
                  <Card key={invitation.id} className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-yellow-500/10">
                            <Mail className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">دعوة جديدة من معلم</p>
                            <p className="text-sm text-muted-foreground">
                              بتاريخ {new Date(invitation.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
                            {respondToInvitation.isPending ? (
                              <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 ml-1" />
                            )}
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

          {/* Processed Invitations */}
          {processedInvitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">سجل الدعوات</h3>
              <div className="grid gap-3">
                {processedInvitations.map((invitation) => (
                  <Card key={invitation.id} className="opacity-80">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            invitation.status === 'accepted' 
                              ? 'bg-green-500/10' 
                              : 'bg-red-500/10'
                          }`}>
                            {invitation.status === 'accepted' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">دعوة من معلم</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(invitation.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={invitation.status === 'accepted' ? 'default' : 'destructive'}>
                          {invitation.status === 'accepted' ? 'مقبولة' : 'مرفوضة'}
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
    </div>
  );
}

export default function DHInvitations() {
  return (
    <DepartmentHeadViewLayout showTeacherSelector={false}>
      <InvitationsContent />
    </DepartmentHeadViewLayout>
  );
}