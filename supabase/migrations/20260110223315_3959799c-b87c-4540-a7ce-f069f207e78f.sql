
-- Fix security definer view issue by using SECURITY INVOKER
DROP VIEW IF EXISTS public.teachers_view;

CREATE VIEW public.teachers_view WITH (security_invoker = true) AS
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

-- Grant access to the view
GRANT SELECT ON public.teachers_view TO authenticated;

-- Add RLS policy to profiles for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
