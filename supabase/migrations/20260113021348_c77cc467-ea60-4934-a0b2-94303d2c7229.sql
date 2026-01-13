-- Remove unique constraint on phone column as it causes issues
-- Phone numbers don't need to be unique across all profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;