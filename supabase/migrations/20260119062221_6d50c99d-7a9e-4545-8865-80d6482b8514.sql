-- Add UNIQUE constraint on user_id column in profiles table
-- This is required for the trigger to work properly and prevents duplicate profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);