-- Create shared_templates table for template sharing via codes
CREATE TABLE public.shared_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.teacher_grading_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_code VARCHAR(8) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_shared_templates_code ON public.shared_templates(share_code);
CREATE INDEX idx_shared_templates_template ON public.shared_templates(template_id);
CREATE INDEX idx_shared_templates_user ON public.shared_templates(user_id);

-- Enable Row Level Security
ALTER TABLE public.shared_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own shared templates
CREATE POLICY "Users can view their own shared templates" 
ON public.shared_templates 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create shared templates
CREATE POLICY "Users can create shared templates" 
ON public.shared_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shared templates
CREATE POLICY "Users can update their own shared templates" 
ON public.shared_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own shared templates
CREATE POLICY "Users can delete their own shared templates" 
ON public.shared_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Anyone can lookup active shared templates by code (for importing)
CREATE POLICY "Anyone can lookup active shared templates" 
ON public.shared_templates 
FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_shared_templates_updated_at
BEFORE UPDATE ON public.shared_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();