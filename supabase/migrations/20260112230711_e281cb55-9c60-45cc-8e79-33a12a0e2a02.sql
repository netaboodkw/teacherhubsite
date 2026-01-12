-- Allow department heads to view teacher grading templates of supervised teachers
CREATE POLICY "Department heads can view supervised teacher templates"
ON public.teacher_grading_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_department_head_invitations inv
    JOIN department_heads dh ON dh.email = inv.department_head_email
    WHERE inv.teacher_id = teacher_grading_templates.user_id
    AND inv.status = 'accepted'
    AND dh.user_id = auth.uid()
  )
);