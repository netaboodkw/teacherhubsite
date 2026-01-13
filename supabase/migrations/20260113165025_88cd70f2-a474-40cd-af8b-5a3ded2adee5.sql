-- Allow users to read templates that have an active share
CREATE POLICY "Users can view shared templates via share code"
ON public.teacher_grading_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shared_templates st
    WHERE st.template_id = teacher_grading_templates.id
    AND st.is_active = true
  )
);