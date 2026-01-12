-- Create subscription courses table (الكورسات التعليمية)
CREATE TABLE public.subscription_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription packages table (باقات الاشتراك)
CREATE TABLE public.subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  courses_count INTEGER NOT NULL DEFAULT 1, -- 1, 2, or 4 courses
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discount codes table (أكواد الخصم)
CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER, -- null = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher subscriptions table (اشتراكات المعلمين)
CREATE TABLE public.teacher_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id UUID REFERENCES public.subscription_packages(id),
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'expired', 'cancelled'
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  courses_remaining INTEGER NOT NULL DEFAULT 0,
  is_read_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table (سجل الدفعات)
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.teacher_subscriptions(id),
  package_id UUID REFERENCES public.subscription_packages(id),
  discount_code_id UUID REFERENCES public.discount_codes(id),
  amount NUMERIC NOT NULL,
  original_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  payment_method TEXT,
  payment_reference TEXT, -- MyFatoorah reference
  invoice_id TEXT, -- MyFatoorah invoice ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription notifications table (إشعارات الاشتراك)
CREATE TABLE public.subscription_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'trial_ending', 'subscription_ending', 'subscription_expired'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_courses
CREATE POLICY "Admins can manage courses" ON public.subscription_courses
  FOR ALL USING (has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Anyone can view active courses" ON public.subscription_courses
  FOR SELECT USING (is_active = true);

-- RLS policies for subscription_packages
CREATE POLICY "Admins can manage packages" ON public.subscription_packages
  FOR ALL USING (has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Anyone can view active packages" ON public.subscription_packages
  FOR SELECT USING (is_active = true);

-- RLS policies for discount_codes
CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Anyone can validate discount codes" ON public.discount_codes
  FOR SELECT USING (is_active = true);

-- RLS policies for teacher_subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON public.teacher_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Users can view own subscription" ON public.teacher_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for subscription_payments  
CREATE POLICY "Admins can manage all payments" ON public.subscription_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own payments" ON public.subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON public.subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for subscription_notifications
CREATE POLICY "Admins can manage all notifications" ON public.subscription_notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own notifications" ON public.subscription_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.subscription_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_courses_updated_at
  BEFORE UPDATE ON public.subscription_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_packages_updated_at
  BEFORE UPDATE ON public.subscription_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_subscriptions_updated_at
  BEFORE UPDATE ON public.teacher_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create trial subscription for new users
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create trial if subscriptions are enabled (check system_settings)
  IF EXISTS (
    SELECT 1 FROM public.system_settings 
    WHERE key = 'subscriptions_enabled' AND (value->>'enabled')::boolean = true
  ) THEN
    INSERT INTO public.teacher_subscriptions (user_id, status, trial_started_at, trial_ends_at)
    VALUES (
      NEW.id, 
      'trial', 
      now(),
      now() + interval '10 days'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to create trial on new user signup (attached to profiles since that's created for teachers)
CREATE TRIGGER on_profile_created_create_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_subscription();