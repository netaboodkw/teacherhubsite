
-- Add new columns to profiles for teacher settings
ALTER TABLE public.profiles
ADD COLUMN principal_name text,
ADD COLUMN department_head_name text;
