-- Add teacher_template_id column to classrooms table
ALTER TABLE public.classrooms 
ADD COLUMN teacher_template_id UUID REFERENCES public.teacher_grading_templates(id) ON DELETE SET NULL;