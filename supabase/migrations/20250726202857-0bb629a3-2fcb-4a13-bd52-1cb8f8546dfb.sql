-- Create table for storing clarification answers
CREATE TABLE public.clarify_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clarify_answers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert clarify answers" 
ON public.clarify_answers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view clarify answers" 
ON public.clarify_answers 
FOR SELECT 
USING (true);