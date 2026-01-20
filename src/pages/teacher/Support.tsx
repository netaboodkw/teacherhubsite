import { useState, useRef, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassButton } from '@/components/ui/glass-button';
import { Button } from '@/components/ui/button';
import { GlassInput } from '@/components/ui/glass-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMyTickets, useTicketMessages, useCreateTicket, useSendMessage, useMarkMessagesAsRead, SupportTicket } from '@/hooks/useSupportTickets';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Support() {
  const { isLiquidGlass } = useTheme();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets, isLoading: ticketsLoading } = useMyTickets();
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(selectedTicket?.id || null);
  const createTicket = useCreateTicket();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  // Component aliases based on theme
  const ContentCard = isLiquidGlass ? GlassCard : Card;
  const ContentCardHeader = isLiquidGlass ? GlassCardHeader : CardHeader;
  const ContentCardTitle = isLiquidGlass ? GlassCardTitle : CardTitle;
  const ContentCardContent = isLiquidGlass ? GlassCardContent : CardContent;
  const ActionButton = isLiquidGlass ? GlassButton : Button;
  const TextInput = isLiquidGlass ? GlassInput : Input;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark admin messages as read when viewing ticket
  useEffect(() => {
    if (selectedTicket) {
      markAsRead.mutate({ ticketId: selectedTicket.id, senderType: 'admin' });
    }
  }, [selectedTicket?.id]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      const ticket = await createTicket.mutateAsync({
        subject: newSubject,
        message: newMessage,
      });
      setShowNewTicket(false);
      setNewSubject('');
      setNewMessage('');
      setSelectedTicket(ticket as SupportTicket);
      toast.success('تم إرسال طلب الدعم بنجاح');
    } catch (error) {
      toast.error('فشل في إرسال الطلب');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      await sendMessage.mutateAsync({
        ticketId: selectedTicket.id,
        message: replyMessage,
        senderType: 'user',
      });
      setReplyMessage('');
    } catch (error) {
      toast.error('فشل في إرسال الرسالة');
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30">جديد</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30">قيد المعالجة</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">تم الحل</Badge>;
      case 'closed':
        return <Badge variant="outline">مغلق</Badge>;
      default:
        return null;
    }
  };

  // Show new ticket form
  if (showNewTicket) {
    return (
      <TeacherLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader
            icon={Headphones}
            title="طلب دعم جديد"
            subtitle="اكتب رسالتك وسنرد عليك في أقرب وقت"
            iconVariant="purple"
          />

          <ContentCard>
            <ContentCardHeader>
              <ContentCardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                تفاصيل الطلب
              </ContentCardTitle>
            </ContentCardHeader>
            <ContentCardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الموضوع</label>
                <TextInput
                  placeholder="مثال: مشكلة في إضافة الدرجات"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الرسالة</label>
                <Textarea
                  placeholder="اشرح مشكلتك بالتفصيل..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <ActionButton
                  onClick={handleCreateTicket}
                  disabled={createTicket.isPending}
                  className="flex-1"
                >
                  {createTicket.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Send className="h-4 w-4 ml-2" />
                  )}
                  إرسال الطلب
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => setShowNewTicket(false)}
                >
                  إلغاء
                </ActionButton>
              </div>
            </ContentCardContent>
          </ContentCard>
        </div>
      </TeacherLayout>
    );
  }

  // Show conversation view
  if (selectedTicket) {
    return (
      <TeacherLayout>
        <div className="max-w-2xl mx-auto space-y-4 h-[calc(100vh-8rem)] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3">
            <ActionButton
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTicket(null)}
            >
              <ArrowRight className="h-5 w-5" />
            </ActionButton>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selectedTicket.created_at), 'dd MMM yyyy', { locale: ar })}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ContentCard className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3",
                          msg.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          msg.sender_type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Reply Input */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <TextInput
                    placeholder="اكتب رسالتك..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="flex-1"
                  />
                  <ActionButton
                    size="icon"
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </ActionButton>
                </div>
              </div>
            )}
          </ContentCard>
        </div>
      </TeacherLayout>
    );
  }

  // Show tickets list
  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          icon={Headphones}
          title="الدعم الفني"
          subtitle="تواصل مع فريق الدعم الفني"
          iconVariant="purple"
        />

        {/* New Ticket Button */}
        <ActionButton
          onClick={() => setShowNewTicket(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 ml-2" />
          طلب دعم جديد
        </ActionButton>

        {/* Tickets List */}
        <ContentCard>
          <ContentCardHeader>
            <ContentCardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              طلباتي السابقة
            </ContentCardTitle>
          </ContentCardHeader>
          <ContentCardContent>
            {ticketsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !tickets?.length ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لا توجد طلبات سابقة</p>
                <p className="text-sm text-muted-foreground/70">
                  اضغط على "طلب دعم جديد" للتواصل معنا
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(ticket.updated_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                        </p>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ContentCardContent>
        </ContentCard>
      </div>
    </TeacherLayout>
  );
}
