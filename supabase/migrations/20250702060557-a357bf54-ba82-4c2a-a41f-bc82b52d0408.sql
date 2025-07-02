
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Service role only access" ON public.cases_master;

-- Create new policies that allow authenticated users to manage case data
-- This assumes you want authenticated users to be able to import/manage cases
CREATE POLICY "Authenticated users can view cases" 
  ON public.cases_master 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cases" 
  ON public.cases_master 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases" 
  ON public.cases_master 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete cases" 
  ON public.cases_master 
  FOR DELETE 
  TO authenticated
  USING (true);
