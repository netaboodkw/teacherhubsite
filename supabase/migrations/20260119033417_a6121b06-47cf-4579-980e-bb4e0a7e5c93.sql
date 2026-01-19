-- Fix the trigger function to use correct column (user_id instead of id)
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_days_setting integer;
BEGIN
  -- Only create trial if subscriptions are enabled (check system_settings)
  IF EXISTS (
    SELECT 1 FROM public.system_settings 
    WHERE key = 'subscriptions_enabled' AND (value->>'enabled')::boolean = true
  ) THEN
    -- Get trial days from settings, default to 10
    SELECT COALESCE((value->>'trial_days')::integer, 10) INTO trial_days_setting
    FROM public.system_settings 
    WHERE key = 'subscriptions_enabled';
    
    -- Use user_id from profiles table, not id
    INSERT INTO public.teacher_subscriptions (user_id, status, trial_started_at, trial_ends_at)
    VALUES (
      NEW.user_id, 
      'trial', 
      now(),
      now() + (trial_days_setting || ' days')::interval
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;