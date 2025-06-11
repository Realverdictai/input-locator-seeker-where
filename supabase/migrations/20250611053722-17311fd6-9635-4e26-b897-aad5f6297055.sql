
-- Drop the existing restrictive RLS policies for mediation_sessions
DROP POLICY IF EXISTS "Users can view mediation sessions they're part of" ON public.mediation_sessions;
DROP POLICY IF EXISTS "Users can create mediation sessions" ON public.mediation_sessions;
DROP POLICY IF EXISTS "Users can update mediation sessions they're part of" ON public.mediation_sessions;

-- Create new policies that allow proper session discovery and joining
CREATE POLICY "Users can view all mediation sessions" 
  ON public.mediation_sessions 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can create mediation sessions" 
  ON public.mediation_sessions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = pi_lawyer_id OR auth.uid() = insurance_id);

CREATE POLICY "Users can update sessions they created or joined" 
  ON public.mediation_sessions 
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() = pi_lawyer_id OR 
    auth.uid() = insurance_id OR
    (pi_lawyer_id IS NULL AND auth.uid() IS NOT NULL) OR
    (insurance_id IS NULL AND auth.uid() IS NOT NULL)
  );
