-- Create notifications table for teacher-department head communication
CREATE TABLE public.supervision_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invitation_sent', 'invitation_accepted', 'invitation_rejected', 'invitation_deleted', 'invitation_reminder', 'new_classroom', 'new_grades', 'subscription_expired', 'department_head_note')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supervision_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.supervision_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.supervision_notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.supervision_notifications
FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);

-- Policy: Authenticated users can insert notifications (sender validation in app)
CREATE POLICY "Authenticated users can create notifications"
ON public.supervision_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Create index for faster queries
CREATE INDEX idx_supervision_notifications_recipient ON public.supervision_notifications(recipient_id, is_read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.supervision_notifications;