import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Headphones,
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  User,
  Mail,
  Filter,
  Search,
  Circle
} from 'lucide-react';
import { useAllTickets, useTicketMessages, useSendMessage, useUpdateTicketStatus, useMarkMessagesAsRead, SupportTicket } from '@/hooks/useSupportTickets';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function SupportManagementPage() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets, isLoading: ticketsLoading } = useAllTickets();
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(selectedTicket?.id || null);
  const sendMessage = useSendMessage();
  const updateStatus = useUpdateTicketStatus();
  const markAsRead = useMarkMessagesAsRead();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark user messages as read when viewing ticket
  useEffect(() => {
    if (selectedTicket) {
      markAsRead.mutate({ ticketId: selectedTicket.id, senderType: 'user' });
    }
  }, [selectedTicket?.id]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      await sendMessage.mutateAsync({
        ticketId: selectedTicket.id,
        message: replyMessage,
        senderType: 'admin',
      });
      setReplyMessage('');
      
      // Auto update status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await updateStatus.mutateAsync({
          ticketId: selectedTicket.id,
          status: 'in_progress',
        });
      }
    } catch (error) {
      toast.error('فشل في إرسال الرسالة');
    }
  };

  const handleStatusChange = async (status: SupportTicket['status']) => {
    if (!selectedTicket) return;

    try {
      await updateStatus.mutateAsync({
        ticketId: selectedTicket.id,
        status,
      });
      setSelectedTicket({ ...selectedTicket, status });
      toast.success('تم تحديث حالة الطلب');
    } catch (error) {
      toast.error('فشل في تحديث الحالة');
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30">جديد</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/30">قيد المعالجة</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30">تم الحل</Badge>;
      case 'closed':
        return <Badge variant="outline">مغلق</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">عاجل</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">مرتفع</Badge>;
      case 'normal':
        return null;
      case 'low':
        return <Badge variant="secondary">منخفض</Badge>;
      default:
        return null;
    }
  };

  // Filter tickets
  const filteredTickets = tickets?.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Count by status
  const statusCounts = {
    all: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Headphones}
          title="إدارة الدعم الفني"
          subtitle="الرد على استفسارات المستخدمين"
          iconVariant="purple"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Tickets List */}
          <Card className="lg:col-span-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                الطلبات
                {statusCounts.open > 0 && (
                  <Badge variant="destructive" className="mr-auto">
                    {statusCounts.open} جديد
                  </Badge>
                )}
              </CardTitle>
              
              {/* Search & Filter */}
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل ({statusCounts.all})</SelectItem>
                    <SelectItem value="open">جديد ({statusCounts.open})</SelectItem>
                    <SelectItem value="in_progress">قيد المعالجة ({statusCounts.in_progress})</SelectItem>
                    <SelectItem value="resolved">تم الحل ({statusCounts.resolved})</SelectItem>
                    <SelectItem value="closed">مغلق ({statusCounts.closed})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                {ticketsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !filteredTickets?.length ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">لا توجد طلبات</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={cn(
                          "w-full p-4 text-right transition-colors hover:bg-muted/50",
                          selectedTicket?.id === ticket.id && "bg-muted"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Unread indicator */}
                          {ticket.unread_count && ticket.unread_count > 0 ? (
                            <Circle className="h-2.5 w-2.5 mt-2 fill-primary text-primary flex-shrink-0" />
                          ) : (
                            <div className="w-2.5 flex-shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate text-sm">{ticket.user_name}</span>
                              {ticket.unread_count && ticket.unread_count > 0 && (
                                <Badge variant="destructive" className="h-5 text-xs px-1.5">
                                  {ticket.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium truncate">{ticket.subject}</p>
                            {ticket.last_message && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {ticket.last_message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                              <span className="text-[10px] text-muted-foreground mr-auto">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ar })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Conversation View */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {!selectedTicket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">اختر طلب للعرض</p>
                </div>
              </div>
            ) : (
              <>
                {/* Ticket Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{selectedTicket.subject}</CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {selectedTicket.user_name}
                        </span>
                        {selectedTicket.user_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {selectedTicket.user_email}
                          </span>
                        )}
                      </div>
                    </div>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => handleStatusChange(value as SupportTicket['status'])}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">جديد</SelectItem>
                        <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                        <SelectItem value="resolved">تم الحل</SelectItem>
                        <SelectItem value="closed">مغلق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
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
                              msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3",
                                msg.sender_type === 'admin'
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className={cn(
                                "text-[10px] mt-1",
                                msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}>
                                {format(new Date(msg.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Reply Input */}
                {selectedTicket.status !== 'closed' && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="اكتب ردك..."
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
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || sendMessage.isPending}
                      >
                        {sendMessage.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
