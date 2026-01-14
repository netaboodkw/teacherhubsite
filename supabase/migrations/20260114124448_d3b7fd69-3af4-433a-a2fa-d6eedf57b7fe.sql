-- Add parent_name and parent_phone columns to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT;