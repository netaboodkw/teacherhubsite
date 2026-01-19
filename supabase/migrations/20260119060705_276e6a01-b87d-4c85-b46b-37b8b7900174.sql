-- Create notification_templates table for admin to manage notification messages
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  body TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification templates
CREATE POLICY "Admins can view notification templates" 
ON public.notification_templates 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notification templates" 
ON public.notification_templates 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notification templates" 
ON public.notification_templates 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notification templates" 
ON public.notification_templates 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default notification templates
INSERT INTO public.notification_templates (key, title, title_ar, body, body_ar, category, description) VALUES
('fingerprint_start', 'Fingerprint Period Started', 'بدأت فترة بصمة التواجد!', 'Please proceed to the fingerprint device now', 'يرجى التوجه لجهاز البصمة الآن', 'fingerprint', 'إشعار بداية فترة البصمة'),
('fingerprint_warning', 'Urgent Warning', 'تنبيه عاجل!', '{minutes} minutes remaining for fingerprint', 'متبقي {minutes} دقيقة على انتهاء فترة البصمة', 'fingerprint', 'إشعار تحذيري قبل انتهاء الفترة'),
('fingerprint_5min', 'Last 5 Minutes', 'آخر 5 دقائق!', 'Hurry! Fingerprint period ending soon!', 'أسرع! البصمة على وشك الانتهاء!', 'fingerprint', 'إشعار آخر 5 دقائق'),
('fingerprint_1min', 'One Minute Left', 'دقيقة واحدة متبقية!', 'This is the last reminder - fingerprint NOW!', 'هذا آخر تذكير - البصمة الآن!', 'fingerprint', 'إشعار آخر دقيقة'),
('schedule_reminder', 'Class Starting Soon', 'الحصة على وشك البدء', 'Class {className} starting in {minutes} minutes', 'حصة {className} ستبدأ بعد {minutes} دقيقة', 'schedule', 'تذكير بموعد الحصة'),
('welcome_back', 'Welcome Back', 'مرحباً بعودتك', 'Welcome back {teacherName}!', 'مرحباً بعودتك {teacherName}!', 'general', 'رسالة الترحيب بالعودة');