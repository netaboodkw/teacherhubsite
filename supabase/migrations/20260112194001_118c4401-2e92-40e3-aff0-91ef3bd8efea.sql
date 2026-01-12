-- Create teacher grading templates table
CREATE TABLE public.teacher_grading_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_grading_templates ENABLE ROW LEVEL SECURITY;

-- Policies: Teachers can only manage their own templates
CREATE POLICY "Users can view their own templates"
ON public.teacher_grading_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.teacher_grading_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.teacher_grading_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.teacher_grading_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_teacher_grading_templates_updated_at
BEFORE UPDATE ON public.teacher_grading_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();