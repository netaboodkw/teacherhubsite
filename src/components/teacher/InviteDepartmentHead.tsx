import { useState } from 'react';
import { useTeacherInvitations, useInviteDepartmentHead, useDeleteInvitation } from '@/hooks/useDepartmentHeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, Mail, Loader2, Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

export function InviteDepartmentHead() {
  const { data: invitations = [], isLoading } = useTeacherInvitations();
  const inviteMutation = useInviteDepartmentHead();
  const deleteMutation = useDeleteInvitation();
  
  const [email, setEmail] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (!email.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    try {
      await inviteMutation.mutateAsync(email);
      setEmail('');
      setDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (invitationId: string) => {
    await deleteMutation.mutateAsync(invitationId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 ml-1" />
            قيد الانتظار
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 ml-1" />
            مقبولة
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 ml-1" />
            مرفوضة
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              رئيس القسم
            </CardTitle>
            <CardDescription>
              قم بدعوة رئيس القسم ليتمكن من الاطلاع على فصولك وطلابك
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة دعوة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>دعوة رئيس القسم</DialogTitle>
                <DialogDescription>
                  أدخل البريد الإلكتروني لرئيس القسم ليتمكن من الإشراف على بياناتك
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="department.head@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'إرسال الدعوة'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لم ترسل أي دعوات بعد</p>
            <p className="text-sm">قم بدعوة رئيس القسم ليتابع تقدمك</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm" dir="ltr">
                      {invitation.department_head_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invitation.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(invitation.status)}
                  {(invitation.status === 'pending' || invitation.status === 'accepted') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(invitation.id)}
                      disabled={deleteMutation.isPending}
                      title={invitation.status === 'accepted' ? 'إيقاف الدعوة' : 'حذف الدعوة'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
