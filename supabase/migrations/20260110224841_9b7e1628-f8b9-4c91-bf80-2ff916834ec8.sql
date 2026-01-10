-- Create grading_periods table for period-based grading configuration
CREATE TABLE public.grading_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid NOT NULL REFERENCES public.education_levels(id) ON DELETE CASCADE,
    grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    name text NOT NULL,
    name_ar text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    max_score numeric NOT NULL DEFAULT 100,
    weight numeric NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create grading_templates table for reusable templates
CREATE TABLE public.grading_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    name_ar text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create grading_template_periods for template period definitions
CREATE TABLE public.grading_template_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES public.grading_templates(id) ON DELETE CASCADE,
    name text NOT NULL,
    name_ar text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    max_score numeric NOT NULL DEFAULT 100,
    weight numeric NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grading_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_template_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grading_periods
CREATE POLICY "Admins can manage grading periods"
ON public.grading_periods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active grading periods"
ON public.grading_periods
FOR SELECT
USING (is_active = true);

-- RLS Policies for grading_templates
CREATE POLICY "Admins can manage grading templates"
ON public.grading_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active grading templates"
ON public.grading_templates
FOR SELECT
USING (is_active = true);

-- RLS Policies for grading_template_periods
CREATE POLICY "Admins can manage grading template periods"
ON public.grading_template_periods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view grading template periods"
ON public.grading_template_periods
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.grading_templates t 
    WHERE t.id = template_id AND t.is_active = true
));