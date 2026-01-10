
-- Add education_level_id and subject_id to classrooms
ALTER TABLE public.classrooms
ADD COLUMN education_level_id uuid REFERENCES public.education_levels(id),
ADD COLUMN subject_id uuid REFERENCES public.subjects(id),
ADD COLUMN grade_level integer DEFAULT 1;

-- Create view for admins to see all teachers
CREATE OR REPLACE VIEW public.teachers_view AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.school_name,
  p.subject,
  p.phone,
  p.avatar_url,
  p.is_profile_complete,
  p.created_at,
  el.name_ar as education_level_name,
  s.name_ar as subject_name
FROM public.profiles p
LEFT JOIN public.education_levels el ON p.education_level_id = el.id
LEFT JOIN public.subjects s ON p.subject_id = s.id;

-- Grant access to the view for authenticated users (admins will check role)
GRANT SELECT ON public.teachers_view TO authenticated;
