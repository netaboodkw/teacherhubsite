-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read all settings
CREATE POLICY "Admins can read settings" 
ON public.system_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update settings
CREATE POLICY "Admins can update settings" 
ON public.system_settings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert settings
CREATE POLICY "Admins can insert settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teachers can read certain settings (for UI behavior)
CREATE POLICY "Teachers can read public settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default setting for template editing
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'allow_edit_linked_templates',
  'true',
  'السماح بتعديل القوالب المرتبطة بالصفوف'
);