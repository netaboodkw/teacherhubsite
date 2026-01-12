-- Allow department heads to create their own templates
CREATE POLICY "Department heads can create templates"
ON public.teacher_grading_templates
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);

-- Allow department heads to update their own templates
CREATE POLICY "Department heads can update own templates"
ON public.teacher_grading_templates
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);

-- Allow department heads to delete their own templates
CREATE POLICY "Department heads can delete own templates"
ON public.teacher_grading_templates
FOR DELETE
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);

-- Allow department heads to view their own templates
CREATE POLICY "Department heads can view own templates"
ON public.teacher_grading_templates
FOR SELECT
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);

-- Allow department heads to share templates
CREATE POLICY "Department heads can share templates"
ON public.shared_templates
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);

-- Allow department heads to view shared templates
CREATE POLICY "Department heads can view shared templates"
ON public.shared_templates
FOR SELECT
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);

-- Allow department heads to update shared templates
CREATE POLICY "Department heads can update shared templates"
ON public.shared_templates
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid()
  )
);