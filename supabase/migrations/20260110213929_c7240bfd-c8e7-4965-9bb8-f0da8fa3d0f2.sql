-- Add school and subject columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- Create a table for student positions in classroom
CREATE TABLE IF NOT EXISTS public.student_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, classroom_id)
);

-- Enable RLS on student_positions
ALTER TABLE public.student_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_positions
CREATE POLICY "Users can view their own student positions"
ON public.student_positions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own student positions"
ON public.student_positions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student positions"
ON public.student_positions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own student positions"
ON public.student_positions FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_student_positions_updated_at
BEFORE UPDATE ON public.student_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();