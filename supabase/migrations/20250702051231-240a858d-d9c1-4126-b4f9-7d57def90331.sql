
-- Create the cases_master table for storing settlement data
CREATE TABLE public.cases_master (
  case_id INTEGER PRIMARY KEY,
  case_type TEXT NOT NULL,
  venue TEXT,
  dol TEXT, -- Date of Loss as text to handle various formats
  acc_type TEXT, -- Accident Type
  injuries TEXT,
  surgery TEXT,
  inject TEXT, -- Injections
  liab_pct TEXT, -- Liability Percentage
  pol_lim TEXT, -- Policy Limit
  settle TEXT, -- Settlement Amount
  narrative TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but restrict access to service role only
ALTER TABLE public.cases_master ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy - only service role can access
CREATE POLICY "Service role only access" 
  ON public.cases_master 
  FOR ALL 
  TO service_role
  USING (true);

-- Create index on case_id for performance
CREATE INDEX idx_cases_master_case_id ON public.cases_master(case_id);
