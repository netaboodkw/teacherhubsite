-- Fix the teachers_view security definer issue
-- Drop and recreate with security_invoker
DROP VIEW IF EXISTS public.teachers_view;

CREATE VIEW public.teachers_view
WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.phone,
  p.school_name,
  p.subject,
  p.avatar_url,
  p.is_profile_complete,
  p.created_at,
  s.name_ar as subject_name,
  e.name_ar as education_level_name
FROM profiles p
LEFT JOIN subjects s ON p.subject_id = s.id
LEFT JOIN education_levels e ON p.education_level_id = e.id
WHERE EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = p.user_id AND ur.role = 'user'
);

-- Add rate limiting column for OTP if not exists (already added in previous migration)
-- Add max attempts constant check
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;