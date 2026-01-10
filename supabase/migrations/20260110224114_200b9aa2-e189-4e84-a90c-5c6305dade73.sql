-- Create grade_levels table for each education level
CREATE TABLE public.grade_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid NOT NULL REFERENCES public.education_levels(id) ON DELETE CASCADE,
    name text NOT NULL,
    name_ar text NOT NULL,
    grade_number integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(education_level_id, grade_number)
);

-- Enable RLS
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage grade levels"
ON public.grade_levels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active grade levels"
ON public.grade_levels
FOR SELECT
USING (is_active = true);

-- Add foreign key to classrooms table
ALTER TABLE public.classrooms
ADD COLUMN grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL;