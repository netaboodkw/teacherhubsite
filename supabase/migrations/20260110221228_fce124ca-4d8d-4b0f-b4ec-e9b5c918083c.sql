-- Add class_schedule JSONB column to classrooms for storing schedule configuration
-- Format: { "sunday": [1, 3], "monday": [2, 5], ... } - days and period numbers
ALTER TABLE public.classrooms 
ADD COLUMN class_schedule jsonb DEFAULT '{}'::jsonb;