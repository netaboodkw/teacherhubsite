-- Add RLS policy for admins to view all classrooms (for dependency checks)
CREATE POLICY "Admins can view all classrooms" 
ON public.classrooms 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));