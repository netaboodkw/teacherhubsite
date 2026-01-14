-- Fix teachers_view to use security_invoker
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
    s.name_ar AS subject_name,
    e.name_ar AS education_level_name
FROM profiles p
LEFT JOIN subjects s ON p.subject_id = s.id
LEFT JOIN education_levels e ON p.education_level_id = e.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.user_id 
    AND ur.role IN ('admin', 'department_head')
);

-- Grant access to authenticated users
GRANT SELECT ON public.teachers_view TO authenticated;

-- Fix cleanup_expired_otps function to have search_path set
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
END;
$$;