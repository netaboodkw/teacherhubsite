-- Create table to store grading structures/templates for subjects
CREATE TABLE public.subject_grading_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.grading_templates(id) ON DELETE SET NULL,
  education_level_id UUID REFERENCES public.education_levels(id) ON DELETE CASCADE,
  grade_level_id UUID REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subject_grading_structures ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage grading structures"
  ON public.subject_grading_structures
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view grading structures"
  ON public.subject_grading_structures
  FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_subject_grading_structures_updated_at
  BEFORE UPDATE ON public.subject_grading_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();