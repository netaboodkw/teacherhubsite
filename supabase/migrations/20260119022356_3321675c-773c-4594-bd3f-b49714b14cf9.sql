-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  variables TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email settings table
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create broadcast emails table for mass emails
CREATE TABLE public.broadcast_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  recipient_filter TEXT NOT NULL DEFAULT 'all',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_emails ENABLE ROW LEVEL SECURITY;

-- Policies for email_templates (admin only)
CREATE POLICY "Admins can view email templates"
ON public.email_templates FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for email_settings (admin only)
CREATE POLICY "Admins can view email settings"
ON public.email_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email settings"
ON public.email_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for email_logs (admin only)
CREATE POLICY "Admins can view email logs"
ON public.email_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email logs"
ON public.email_logs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for broadcast_emails (admin only)
CREATE POLICY "Admins can view broadcast emails"
ON public.broadcast_emails FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage broadcast emails"
ON public.broadcast_emails FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broadcast_emails_updated_at
BEFORE UPDATE ON public.broadcast_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_key, name, name_ar, subject, body_html, variables, description) VALUES
('welcome', 'Welcome Email', 'إيميل ترحيبي', 'مرحباً بك في TeacherHub! 🎉', '', ARRAY['name', 'email'], 'يرسل تلقائياً عند تسجيل مستخدم جديد'),
('subscription_reminder', 'Subscription Reminder', 'تذكير انتهاء الاشتراك', 'تذكير: اشتراكك سينتهي قريباً ⏰', '', ARRAY['name', 'days_remaining', 'end_date'], 'يرسل قبل انتهاء الاشتراك بعدد أيام محدد'),
('subscription_expired', 'Subscription Expired', 'انتهاء الاشتراك', 'انتهى اشتراكك في TeacherHub', '', ARRAY['name', 'expired_date'], 'يرسل عند انتهاء الاشتراك'),
('payment_confirmation', 'Payment Confirmation', 'تأكيد الدفع', 'تأكيد الدفع - TeacherHub', '', ARRAY['name', 'package_name', 'amount', 'invoice_id', 'end_date', 'payment_method'], 'يرسل بعد نجاح عملية الدفع');

-- Insert default email settings
INSERT INTO public.email_settings (setting_key, value, description) VALUES
('reminder_days_before_expiry', '{"days": 7}', 'عدد الأيام قبل انتهاء الاشتراك لإرسال التذكير'),
('enable_welcome_email', '{"enabled": true}', 'تفعيل إيميل الترحيب'),
('enable_reminder_email', '{"enabled": true}', 'تفعيل إيميل التذكير'),
('enable_expired_email', '{"enabled": true}', 'تفعيل إيميل انتهاء الاشتراك'),
('enable_payment_email', '{"enabled": true}', 'تفعيل إيميل تأكيد الدفع');