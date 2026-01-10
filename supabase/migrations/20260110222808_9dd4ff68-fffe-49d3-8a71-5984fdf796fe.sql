
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create education_levels table (المراحل التعليمية)
CREATE TABLE public.education_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    name_ar text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on education_levels
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;

-- Everyone can view active education levels
CREATE POLICY "Anyone can view active education levels"
ON public.education_levels
FOR SELECT
USING (is_active = true);

-- Admins can manage education levels
CREATE POLICY "Admins can manage education levels"
ON public.education_levels
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create subjects table (المواد)
CREATE TABLE public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id uuid REFERENCES public.education_levels(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    name_ar text NOT NULL,
    weeks_count integer NOT NULL DEFAULT 18,
    max_score numeric NOT NULL DEFAULT 100,
    grade_types jsonb NOT NULL DEFAULT '["exam", "assignment", "participation", "project"]'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Everyone can view active subjects
CREATE POLICY "Anyone can view active subjects"
ON public.subjects
FOR SELECT
USING (is_active = true);

-- Admins can manage subjects
CREATE POLICY "Admins can manage subjects"
ON public.subjects
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add education_level_id and subject_id to profiles
ALTER TABLE public.profiles
ADD COLUMN education_level_id uuid REFERENCES public.education_levels(id),
ADD COLUMN subject_id uuid REFERENCES public.subjects(id);

-- Insert default education levels
INSERT INTO public.education_levels (name, name_ar, display_order) VALUES
('primary', 'المرحلة الابتدائية', 1),
('middle', 'المرحلة المتوسطة', 2),
('high', 'المرحلة الثانوية', 3);

-- Create triggers for updated_at
CREATE TRIGGER update_education_levels_updated_at
BEFORE UPDATE ON public.education_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
