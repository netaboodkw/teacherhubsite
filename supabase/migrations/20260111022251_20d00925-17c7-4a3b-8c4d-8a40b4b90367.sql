-- Add is_archived column to classrooms table
ALTER TABLE public.classrooms 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Add archived_at timestamp to track when it was archived
ALTER TABLE public.classrooms 
ADD COLUMN archived_at timestamp with time zone DEFAULT NULL;

-- Create index for faster queries on archived status
CREATE INDEX idx_classrooms_is_archived ON public.classrooms(is_archived);

-- Update RLS policies to filter out archived classrooms for regular users
-- Drop existing select policy for users
DROP POLICY IF EXISTS "Users can view their own classrooms" ON public.classrooms;

-- Create new policy that excludes archived classrooms for regular users
CREATE POLICY "Users can view their own non-archived classrooms" 
ON public.classrooms 
FOR SELECT 
USING (auth.uid() = user_id AND is_archived = false);

-- Create policy for users to view their archived classrooms (for archive management if needed)
CREATE POLICY "Users can view their own archived classrooms" 
ON public.classrooms 
FOR SELECT 
USING (auth.uid() = user_id AND is_archived = true);

-- Update the admin view policy to see all classrooms including archived
DROP POLICY IF EXISTS "Admins can view all classrooms" ON public.classrooms;

CREATE POLICY "Admins can view all classrooms including archived" 
ON public.classrooms 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Remove delete permission for regular users (they can only archive now)
DROP POLICY IF EXISTS "Users can delete their own classrooms" ON public.classrooms;

-- Admins can delete classrooms (for permanent deletion)
CREATE POLICY "Admins can delete classrooms" 
ON public.classrooms 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));