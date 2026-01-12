-- Allow department heads to view profiles of teachers they supervise
CREATE POLICY "Department heads can view supervised teacher profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM teacher_department_head_invitations inv
    JOIN department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = profiles.user_id
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);