-- Fix search path for the match_uploaded_docs function
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
SECURITY DEFINER
SET search_path = public
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