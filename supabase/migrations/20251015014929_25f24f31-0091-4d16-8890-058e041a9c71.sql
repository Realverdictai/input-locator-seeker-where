-- Create briefs_one_side table for storing extracted brief text
CREATE TABLE public.briefs_one_side (
  session_id TEXT PRIMARY KEY,
  party_email TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('plaintiff', 'defense')),
  filename TEXT NOT NULL,
  brief_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefs_one_side ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own briefs
CREATE POLICY "Users can view their own briefs"
ON public.briefs_one_side
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own briefs
CREATE POLICY "Users can insert their own briefs"
ON public.briefs_one_side
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can update their own briefs
CREATE POLICY "Users can update their own briefs"
ON public.briefs_one_side
FOR UPDATE
TO authenticated
USING (true);