-- Add special_needs column to students table
ALTER TABLE public.students 
ADD COLUMN special_needs boolean NOT NULL DEFAULT false;

-- Create storage bucket for student avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-avatars', 'student-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own student avatars
CREATE POLICY "Users can upload student avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'student-avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to student avatars
CREATE POLICY "Public can view student avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'student-avatars');

-- Allow users to update their uploaded avatars
CREATE POLICY "Users can update student avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'student-avatars' AND auth.role() = 'authenticated');

-- Allow users to delete their uploaded avatars
CREATE POLICY "Users can delete student avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'student-avatars' AND auth.role() = 'authenticated');