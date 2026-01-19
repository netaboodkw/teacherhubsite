-- Add is_watched column to students table for follow/watch functionality
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_watched boolean NOT NULL DEFAULT false;