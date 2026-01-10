-- Add week_number column to grades table
ALTER TABLE public.grades ADD COLUMN week_number integer NOT NULL DEFAULT 1;