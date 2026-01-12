-- Drop and recreate the teachers_view to exclude admins and department heads
DROP VIEW IF EXISTS public.teachers_view;

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
    el.name_ar AS education_level_name,
    s.name_ar AS subject_name
FROM profiles p
LEFT JOIN education_levels el ON p.education_level_id = el.id
LEFT JOIN subjects s ON p.subject_id = s.id
WHERE NOT EXISTS (
    -- Exclude users who have admin or department_head role
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.user_id 
    AND ur.role IN ('admin', 'department_head')
)
AND NOT EXISTS (
    -- Also exclude users who have department_heads profile
    SELECT 1 FROM department_heads dh 
    WHERE dh.user_id = p.user_id
)
AND NOT EXISTS (
    -- Also exclude users who have admin_profiles
    SELECT 1 FROM admin_profiles ap 
    WHERE ap.user_id = p.user_id
);