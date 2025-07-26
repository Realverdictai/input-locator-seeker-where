-- Create uploaded_docs table for storing document metadata and embeddings
CREATE TABLE public.uploaded_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  text_content TEXT,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uploaded_docs ENABLE ROW LEVEL SECURITY;

-- Create policies for uploaded docs
CREATE POLICY "Users can view their own uploaded docs" 
ON public.uploaded_docs 
FOR SELECT 
USING (true); -- Allow all authenticated users to read for now

CREATE POLICY "Users can insert uploaded docs" 
ON public.uploaded_docs 
FOR INSERT 
WITH CHECK (true); -- Allow all authenticated users to insert for now

-- Create function for matching similar documents using embeddings
CREATE OR REPLACE FUNCTION public.match_uploaded_docs(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  p_session text DEFAULT NULL
)
RETURNS TABLE (
  file_name text,
  snippet text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    uploaded_docs.file_name,
    LEFT(uploaded_docs.text_content, 200) as snippet,
    1 - (uploaded_docs.embedding <=> query_embedding) as similarity
  FROM uploaded_docs
  WHERE uploaded_docs.embedding IS NOT NULL
    AND (p_session IS NULL OR uploaded_docs.case_session_id = p_session)
  ORDER BY uploaded_docs.embedding <=> query_embedding
  LIMIT match_count;
$$;