import { forwardRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, UserX, X } from 'lucide-react';

interface WelcomeBackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string | null;
  avatarUrl: string | null;
  onReLogin: () => void;
  onClearAndExit: () => void;
  onDismiss?: () => void;
}

export const WelcomeBackDialog = forwardRef<HTMLDivElement, WelcomeBackDialogProps>(({
  open,
  onOpenChange,
  teacherName,
  avatarUrl,
  onReLogin,
  onClearAndExit,
  onDismiss,
}, ref) => {
  const getInitials = (name: string | null) => {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const handleDismiss = () => {
    onOpenChange(false);
    onDismiss?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className="sm:max-w-md text-center" dir="rtl">
        <DialogHeader className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || ''} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(teacherName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <DialogTitle className="text-2xl">
            مرحباً {teacherName || 'بك'} 👋
          </DialogTitle>
          <DialogDescription className="text-base">
            هل تريد الدخول مرة أخرى؟
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button 
            onClick={onReLogin} 
            className="w-full text-lg h-12"
            size="lg"
          >
            <LogIn className="w-5 h-5 ml-2" />
            الدخول للوحة التحكم
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClearAndExit}
            className="w-full"
          >
            <UserX className="w-4 h-4 ml-2" />
            تسجيل دخول بحساب آخر
          </Button>

          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full text-muted-foreground"
          >
            <X className="w-4 h-4 ml-2" />
            تجاهل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

WelcomeBackDialog.displayName = 'WelcomeBackDialog';
