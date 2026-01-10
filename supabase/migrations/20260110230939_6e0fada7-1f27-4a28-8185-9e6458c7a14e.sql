-- Create storage bucket for grading templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('grading-templates', 'grading-templates', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Admins can upload grading templates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'grading-templates' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to read their uploaded files
CREATE POLICY "Admins can read grading templates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'grading-templates'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete grading templates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'grading-templates'
  AND has_role(auth.uid(), 'admin'::app_role)
);