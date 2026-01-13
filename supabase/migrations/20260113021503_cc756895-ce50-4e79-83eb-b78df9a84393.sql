-- Update the handle_new_user trigger function to include education_level_id from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    education_level_id, 
    phone, 
    school_name, 
    subject,
    is_profile_complete
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'معلم جديد'),
    (NEW.raw_user_meta_data->>'education_level_id')::uuid,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'school_name',
    NEW.raw_user_meta_data->>'subject',
    CASE WHEN NEW.raw_user_meta_data->>'education_level_id' IS NOT NULL THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;