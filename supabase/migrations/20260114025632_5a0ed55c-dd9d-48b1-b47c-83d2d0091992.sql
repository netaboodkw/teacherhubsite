-- Drop the overly permissive public access policy for student avatars
DROP POLICY IF EXISTS "Public can view student avatars" ON storage.objects;

-- Create a more secure policy: Only the teacher who owns the student can view their avatar
-- Student avatars are stored with path: user_id/student_id/filename
CREATE POLICY "Teachers can view their student avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update upload policy to be more specific (teacher can only upload to their own folder)
DROP POLICY IF EXISTS "Users can upload student avatars" ON storage.objects;
CREATE POLICY "Teachers can upload their student avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update delete policy to be more specific
DROP POLICY IF EXISTS "Users can delete student avatars" ON storage.objects;
CREATE POLICY "Teachers can delete their student avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update update policy to be more specific
DROP POLICY IF EXISTS "Users can update student avatars" ON storage.objects;
CREATE POLICY "Teachers can update their student avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also update the avatars bucket policies to be more restrictive
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Update avatar upload policy to only allow users to upload to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update avatar delete policy
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update avatar update policy
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Make student-avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'student-avatars';

-- Make avatars bucket private as well for better security
UPDATE storage.buckets SET public = false WHERE id = 'avatars';