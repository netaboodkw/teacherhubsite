-- Make the student-avatars bucket public so avatars can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'student-avatars';

-- Drop existing policies if any to recreate them
DROP POLICY IF EXISTS "Teachers can upload student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view student avatars" ON storage.objects;

-- Create policy to allow public read access
CREATE POLICY "Anyone can view student avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-avatars');

-- Create policy for authenticated teachers to upload
CREATE POLICY "Authenticated users can upload student avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-avatars');

-- Create policy for authenticated teachers to update their uploads
CREATE POLICY "Authenticated users can update student avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-avatars');

-- Create policy for authenticated teachers to delete their uploads
CREATE POLICY "Authenticated users can delete student avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-avatars');