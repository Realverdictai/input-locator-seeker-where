-- Create storage bucket for case document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('case_uploads', 'case_uploads', false);

-- Create policy to allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own case documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'case_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to view their own uploaded documents
CREATE POLICY "Users can view their own case documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'case_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to delete their own uploaded documents
CREATE POLICY "Users can delete their own case documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'case_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);