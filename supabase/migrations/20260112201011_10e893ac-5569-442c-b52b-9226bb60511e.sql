
-- Create department_heads table
CREATE TABLE public.department_heads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'رئيس قسم',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_department_head_invitations table (for linking teachers to department heads)
CREATE TABLE public.teacher_department_head_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  department_head_email TEXT NOT NULL,
  department_head_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, department_head_email)
);

-- Add department_head role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_head';

-- Enable Row Level Security
ALTER TABLE public.department_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_department_head_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_heads
CREATE POLICY "Department heads can view their own profile"
ON public.department_heads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Department heads can update their own profile"
ON public.department_heads
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Department heads can insert their own profile"
ON public.department_heads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all department heads"
ON public.department_heads
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for teacher_department_head_invitations
CREATE POLICY "Teachers can view their own invitations"
ON public.teacher_department_head_invitations
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create invitations"
ON public.teacher_department_head_invitations
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own invitations"
ON public.teacher_department_head_invitations
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own invitations"
ON public.teacher_department_head_invitations
FOR DELETE
USING (auth.uid() = teacher_id);

CREATE POLICY "Department heads can view invitations for them"
ON public.teacher_department_head_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.department_heads dh
    WHERE dh.user_id = auth.uid() AND dh.email = teacher_department_head_invitations.department_head_email
  )
);

CREATE POLICY "Department heads can update invitations for them"
ON public.teacher_department_head_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.department_heads dh
    WHERE dh.user_id = auth.uid() AND dh.email = teacher_department_head_invitations.department_head_email
  )
);

-- Allow department heads to view teacher data they supervise
CREATE POLICY "Department heads can view supervised teacher classrooms"
ON public.classrooms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_department_head_invitations inv
    JOIN public.department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = classrooms.user_id 
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);

CREATE POLICY "Department heads can view supervised teacher students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_department_head_invitations inv
    JOIN public.department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = students.user_id 
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);

CREATE POLICY "Department heads can view supervised teacher grades"
ON public.grades
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_department_head_invitations inv
    JOIN public.department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = grades.user_id 
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);

CREATE POLICY "Department heads can view supervised teacher attendance"
ON public.attendance_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_department_head_invitations inv
    JOIN public.department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = attendance_records.user_id 
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);

CREATE POLICY "Department heads can view supervised teacher behavior notes"
ON public.behavior_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_department_head_invitations inv
    JOIN public.department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = behavior_notes.user_id 
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_department_heads_updated_at
BEFORE UPDATE ON public.department_heads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_department_head_invitations_updated_at
BEFORE UPDATE ON public.teacher_department_head_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
