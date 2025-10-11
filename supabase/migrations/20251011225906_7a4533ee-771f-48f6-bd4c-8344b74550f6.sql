-- Fix storage RLS policies for case_uploads bucket
-- Allow authenticated users to upload files

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to case_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read case uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploads" ON storage.objects;

-- Create new policies for case_uploads bucket
CREATE POLICY "Authenticated users can upload to case_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case_uploads');

CREATE POLICY "Authenticated users can read case uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'case_uploads');

CREATE POLICY "Authenticated users can update their uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'case_uploads');

CREATE POLICY "Authenticated users can delete their uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'case_uploads');