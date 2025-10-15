-- Create briefs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefs', 'briefs', false);

-- RLS policies for briefs bucket
CREATE POLICY "Authenticated users can upload briefs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'briefs');

CREATE POLICY "Users can view their own briefs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'briefs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own briefs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'briefs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own briefs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'briefs' AND auth.uid()::text = (storage.foldername(name))[1]);