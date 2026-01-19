-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop and recreate the teachers_view to include email
DROP VIEW IF EXISTS public.teachers_view;

CREATE VIEW public.teachers_view AS
SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.phone,
    p.email,
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
    AND ur.role = ANY (ARRAY['admin'::app_role, 'department_head'::app_role])
);

-- Create a function to sync email from auth.users to profiles on signup
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;

-- Create trigger to sync email when user is created or updated
CREATE TRIGGER on_auth_user_email_sync
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email();

-- Update existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;