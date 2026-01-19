-- Add UNIQUE constraint on user_id column in teacher_subscriptions table  
-- This is required for the create_trial_subscription trigger ON CONFLICT to work properly
ALTER TABLE public.teacher_subscriptions 
ADD CONSTRAINT teacher_subscriptions_user_id_key UNIQUE (user_id);