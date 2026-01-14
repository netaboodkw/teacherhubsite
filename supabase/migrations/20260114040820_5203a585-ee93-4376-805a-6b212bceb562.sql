-- Drop and recreate the teachers_view to include users without roles (they are teachers by default)
-- Also exclude admins and department_heads

DROP VIEW IF EXISTS public.teachers_view;

CREATE VIEW public.teachers_view AS
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

-- Also make system_settings readable for non-sensitive settings
-- The RLS already allows this, but let's verify the is_sensitive flag
UPDATE system_settings 
SET is_sensitive = false 
WHERE key = 'subscriptions_enabled';