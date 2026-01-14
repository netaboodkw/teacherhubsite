import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Mail, UserPlus, UserMinus, Clock, BookOpen, GraduationCap, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  useSupervisionNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  SupervisionNotification,
} from '@/hooks/useSupervisionNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const notificationIcons: Record<SupervisionNotification['type'], React.ReactNode> = {
  invitation_sent: <Mail className="h-4 w-4 text-blue-500" />,
  invitation_accepted: <UserPlus className="h-4 w-4 text-green-500" />,
  invitation_rejected: <UserMinus className="h-4 w-4 text-red-500" />,
  invitation_deleted: <X className="h-4 w-4 text-orange-500" />,
  invitation_reminder: <Clock className="h-4 w-4 text-yellow-500" />,
  new_classroom: <BookOpen className="h-4 w-4 text-purple-500" />,
  new_grades: <GraduationCap className="h-4 w-4 text-indigo-500" />,
  subscription_expired: <AlertTriangle className="h-4 w-4 text-red-500" />,
  department_head_note: <MessageSquare className="h-4 w-4 text-cyan-500" />,
};

const notificationColors: Record<SupervisionNotification['type'], string> = {
  invitation_sent: 'bg-blue-500/10',
  invitation_accepted: 'bg-green-500/10',
  invitation_rejected: 'bg-red-500/10',
  invitation_deleted: 'bg-orange-500/10',
  invitation_reminder: 'bg-yellow-500/10',
  new_classroom: 'bg-purple-500/10',
  new_grades: 'bg-indigo-500/10',
  subscription_expired: 'bg-red-500/10',
  department_head_note: 'bg-cyan-500/10',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useSupervisionNotifications();
  const unreadCount = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: SupervisionNotification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">الإشعارات</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 ml-1" />
              قراءة الكل
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${notificationColors[notification.type]}`}>
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(e, notification.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
